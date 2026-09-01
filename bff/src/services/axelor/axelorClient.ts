import axios, { AxiosInstance, AxiosResponse } from "axios";
import { env } from "../../config/env.js";

export interface AxelorResponse<T = any> {
  status: number;
  data?: T[];
  total?: number;
  errors?: any[];
  message?: string;
}

export interface AxelorSearchCriteria {
  filter?: string;
  params?: Record<string, any>;
  offset?: number;
  limit?: number;
  sortBy?: string[];
  fields?: string[];
  data?: Record<string, any>;
}

export class AxelorClient {
  private client: AxiosInstance;
  private jsessionId: string | null = null;
  private csrfToken: string | null = null;
  private isAuthenticating: Promise<boolean> | null = null;

  constructor(
    private baseURL: string = env.AXELOR_URL,
    private username: string = env.AXELOR_USER,
    private password: string = env.AXELOR_PASS
  ) {
    this.client = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      headers: {
        "Accept": "application/json",
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      const cookies: string[] = [];
      if (this.jsessionId) cookies.push(`JSESSIONID=${this.jsessionId}`);
      if (this.csrfToken) cookies.push(`CSRF-TOKEN=${this.csrfToken}`);

      if (cookies.length > 0) {
        config.headers["Cookie"] = cookies.join("; ");
      }
      if (this.csrfToken) {
        config.headers["X-CSRF-Token"] = this.csrfToken;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        this.extractCookiesAndTokens(response);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/callback")
        ) {
          originalRequest._retry = true;
          const success = await this.authenticate();
          if (success) {
            return this.client(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private extractCookiesAndTokens(response: AxiosResponse) {
    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      for (const cookieStr of setCookie) {
        if (cookieStr.includes("JSESSIONID=")) {
          const match = cookieStr.match(/JSESSIONID=([^;]+)/);
          if (match) this.jsessionId = match[1];
        }
        if (cookieStr.includes("CSRF-TOKEN=")) {
          const match = cookieStr.match(/CSRF-TOKEN=([^;]+)/);
          if (match) this.csrfToken = match[1];
        }
      }
    }
    const headerCsrf = response.headers["x-csrf-token"];
    if (headerCsrf) {
      this.csrfToken = headerCsrf;
    }
  }

  public async authenticate(): Promise<boolean> {
    if (this.isAuthenticating) {
      return await this.isAuthenticating;
    }

    const authPromise = (async () => {
      try {
        const params = new URLSearchParams();
        params.append("username", this.username);
        params.append("password", this.password);

        const response = await axios.post(
          `${this.baseURL}/callback?client_name=FormClient`,
          params.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            maxRedirects: 0,
            validateStatus: (status) => status === 200 || status === 302 || status === 303,
            timeout: 10000,
          }
        );

        this.extractCookiesAndTokens(response);
        return Boolean(this.jsessionId);
      } catch (err: any) {
        console.error("Axelor authentication failed:", err.message);
        return false;
      } finally {
        this.isAuthenticating = null;
      }
    })();

    this.isAuthenticating = authPromise;
    return await authPromise;
  }

  public async getAppInfo(): Promise<any> {
    const response = await this.client.get("/ws/public/app/info");
    return response.data;
  }

  public async search<T = any>(
    model: string,
    criteria: AxelorSearchCriteria = {}
  ): Promise<AxelorResponse<T>> {
    await this.ensureAuth();
    const payload: any = {
      offset: criteria.offset ?? 0,
      limit: criteria.limit ?? 50,
    };
    if (criteria.filter) payload.filter = criteria.filter;
    if (criteria.params) payload.params = criteria.params;
    if (criteria.sortBy) payload.sortBy = criteria.sortBy;
    if (criteria.fields) payload.fields = criteria.fields;
    if (criteria.data) payload.data = criteria.data;

    const response = await this.client.post<AxelorResponse<T>>(
      `/ws/rest/${model}/search`,
      payload
    );
    return response.data;
  }

  public async fetch<T = any>(model: string, id: number): Promise<T | null> {
    await this.ensureAuth();
    const response = await this.client.get<AxelorResponse<T>>(`/ws/rest/${model}/${id}`);
    if (response.data && response.data.data && response.data.data.length > 0) {
      return response.data.data[0];
    }
    return null;
  }

  public async create<T = any>(
    model: string,
    data: Record<string, any>
  ): Promise<AxelorResponse<T>> {
    await this.ensureAuth();
    const response = await this.client.post<AxelorResponse<T>>(
      `/ws/rest/${model}`,
      { data }
    );
    if (response.data && response.data.status !== 0 && (response.data as any).message) {
      throw new Error((response.data as any).message || (response.data as any).title || "Error en operación de Axelor");
    }
    return response.data;
  }

  public async createMany<T = any>(
    model: string,
    items: Record<string, any>[]
  ): Promise<T[]> {
    await this.ensureAuth();
    const results: T[] = [];
    const batchSize = 10;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => this.create<T>(model, item))
      );
      for (const res of batchResults) {
        if (res.data && res.data.length > 0) {
          results.push(res.data[0]);
        }
      }
    }

    return results;
  }

  public async update<T = any>(
    model: string,
    data: Record<string, any>
  ): Promise<AxelorResponse<T>> {
    await this.ensureAuth();
    const response = await this.client.post<AxelorResponse<T>>(
      `/ws/rest/${model}`,
      { data }
    );
    if (response.data && response.data.status !== 0 && (response.data as any).message) {
      throw new Error((response.data as any).message || (response.data as any).title || "Error en operación de Axelor");
    }
    return response.data;
  }

  public async remove(model: string, id: number, version: number): Promise<boolean> {
    await this.ensureAuth();
    const response = await this.client.delete(`/ws/rest/${model}/${id}`, {
      data: {
        data: { id, version },
      },
    });
    return response.status === 200 || response.data?.status === 0;
  }

  public async action(actionName: string, data: Record<string, any> = {}): Promise<any> {
    await this.ensureAuth();
    const response = await this.client.post(`/ws/action/${actionName}`, {
      data: data,
    });
    return response.data;
  }

  private async ensureAuth() {
    if (!this.jsessionId) {
      await this.authenticate();
    }
  }
}

export const axelor = new AxelorClient();
