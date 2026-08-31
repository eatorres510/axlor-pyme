import { axelor } from "./axelorClient.js";

export class SequenceService {
  public async getNextSequence(
    prefix: string,
    model?: string,
    field: string = "code",
    companyId: number = 13,
    padding: number = 5
  ): Promise<string> {
    const year = new Date().getFullYear();
    const formattedPrefix = `${prefix}-${year}-`;

    if (model) {
      try {
        const res = await axelor.search(model, {
          fields: [field],
          sortBy: [`-${field}`],
          limit: 1,
          data: {
            _domain: `self.${field} like '${formattedPrefix}%'`,
          },
        });

        if (res.data && res.data.length > 0 && res.data[0][field]) {
          const lastSeq = String(res.data[0][field]);
          const numPart = lastSeq.replace(formattedPrefix, "").replace(/\D/g, "");
          const nextNum = parseInt(numPart, 10) + 1;
          if (!isNaN(nextNum)) {
            return `${formattedPrefix}${String(nextNum).padStart(padding, "0")}`;
          }
        }
      } catch (err: any) {
        console.warn(`[SequenceService] Error consultando secuencia para ${model}:`, err.message);
      }
    }

    return `${formattedPrefix}${String(1).padStart(padding, "0")}`;
  }
}

export const sequenceService = new SequenceService();
