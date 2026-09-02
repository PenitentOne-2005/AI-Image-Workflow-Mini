import { CreateRunDto } from "../types";

const BASE_URL = "http://localhost:3001/api";

export const runApi = {
  getPresets: async () => {
    const res = await fetch(`${BASE_URL}/presets`);
    return res.json();
  },

  createRun: async (dto: CreateRunDto) => {
    const res = await fetch(`${BASE_URL}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });
    return res.json();
  },

  getRunStatus: async (runId: string) => {
    const res = await fetch(`${BASE_URL}/runs/${runId}`);
    return res.json();
  },

  retryNode: async (runId: string, nodeId: string) => {
    const res = await fetch(`${BASE_URL}/runs/${runId}/nodes/${nodeId}/retry`, {
      method: "POST",
    });
    return res.json();
  },
};
