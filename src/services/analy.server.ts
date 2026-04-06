import axios, { AxiosInstance } from "axios";

const ERROR_RESPONSE = { success: false, status: 404, message: "Connect Server Error!!!" };

class AnalysisService {
  private readonly http: AxiosInstance;
  private readonly uri = process.env.SERVER_URL || "http://localhost:8000"
  constructor() {
    this.http = axios.create({
      baseURL: process.env.SERVER_URL || "http://localhost:8006",
    });
  }

  async generateToken(token: string) {
    try {
      const res = await this.http.post(`${this.uri}/api/analy/v1/generate-token`, {
        token
      });
      return res.data;
    } catch {
      return ERROR_RESPONSE;
    }
  }

  async gettask_id(task_id: string, token: string) {
    try {
      const res = await this.http.post(`${this.uri}/api/analy/v1/task_id`, {
        token, task_id
      });
      return res.data;
    } catch {
      return ERROR_RESPONSE;
    }
  }

  async gettask_reporttarget(task_id: string, token: string,tool:string) {
    try {
      const res = await this.http.post(`${this.uri}/api/analy/v1/report_target`, {
        token, task_id,tool
      });
      return res.data;
    } catch {
      return ERROR_RESPONSE;
    }
  }

  async history(body:AnalysisHistoryParams) {
    try {
      const res = await this.http.post(`${this.uri}/api/analy/v1/history`, {
        ...body
      });
      return res.data;
    } catch {
      return ERROR_RESPONSE;
    }
  }
}

export const AnalyService = new AnalysisService();