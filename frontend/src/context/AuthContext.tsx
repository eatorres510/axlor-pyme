import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, authApi } from "../api/authApi";
import { apiClient } from "../api/client";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  switchCompany: (companyId: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("axelor_auth_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("axelor_auth_token");
  });

  const [loading, setLoading] = useState<boolean>(false);

  // Sincronizar token con Axios
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (user?.activeCompanyId) {
        apiClient.defaults.headers.common["X-Company-Id"] = user.activeCompanyId.toString();
      }
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
      delete apiClient.defaults.headers.common["X-Company-Id"];
    }
  }, [token, user?.activeCompanyId]);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await authApi.login(credentials);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("axelor_auth_token", data.token);
      localStorage.setItem("axelor_auth_user", JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("axelor_auth_token");
    localStorage.removeItem("axelor_auth_user");
  };

  const switchCompany = async (companyId: number) => {
    setLoading(true);
    try {
      const data = await authApi.switchCompany(companyId);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("axelor_auth_token", data.token);
      localStorage.setItem("axelor_auth_user", JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        switchCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
