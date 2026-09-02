export type JobStatus = "idle" | "queued" | "running" | "success" | "error";

export type NodeType = "prompt" | "preset" | "generate" | "result";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  data: {
    label?: string;
    promptText?: string;
    presetId?: string;
    imageUrl?: string;
    status: JobStatus;
    error?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Preset {
  id: string;
  name: string;
  mainPrompt: string;
  negativePrompt: string;
  references: string[];
}

export interface CreateRunDto {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
