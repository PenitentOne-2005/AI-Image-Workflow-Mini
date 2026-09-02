import React from "react";
import { useState, useEffect } from "react";
import { runApi } from "../../../shared/api/runApi";
import { CreateRunDto, WorkflowNode, Preset } from "../../../shared/types";

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: "node-prompt",
    type: "prompt",
    data: {
      label: "User Prompt",
      promptText: "Cyberpunk cat in neon city",
      status: "idle",
    },
  },
  {
    id: "node-gen-a",
    type: "generate",
    data: {
      label: "Generate Variant A (Preset)",
      presetId: "preset-demo",
      status: "idle",
    },
  },
  {
    id: "node-gen-b",
    type: "generate",
    data: { label: "Generate Variant B (Raw)", status: "idle" },
  },
  {
    id: "node-res-a",
    type: "result",
    data: { label: "Result A", status: "idle" },
  },
  {
    id: "node-res-b",
    type: "result",
    data: { label: "Result B", status: "idle" },
  },
];

const INITIAL_EDGES = [
  { id: "e1", source: "node-prompt", target: "node-gen-a" },
  { id: "e2", source: "node-prompt", target: "node-gen-b" },
  { id: "e3", source: "node-gen-a", target: "node-res-a" },
  { id: "e4", source: "node-gen-b", target: "node-res-b" },
];

const WorkflowEditor = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [promptText, setPromptText] = useState("Cyberpunk cat in neon city");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    runApi.getPresets().then(setPresets);
  }, []);

  const handleStart = async () => {
    const updatedNodes = nodes.map((n) =>
      n.id === "node-prompt" ? { ...n, data: { ...n.data, promptText } } : n,
    );

    const dto: CreateRunDto = { nodes: updatedNodes, edges: INITIAL_EDGES };
    const { runId: newRunId } = await runApi.createRun(dto);

    setRunId(newRunId);
    poll(newRunId);
  };

  const handleRetry = async (nodeId: string) => {
    if (!runId) return;
    await runApi.retryNode(runId, nodeId);
    poll(runId);
  };

  const poll = (id: string) => {
    const interval = setInterval(async () => {
      const run = await runApi.getRunStatus(id);
      setNodes(run.nodes);

      if (run.status === "success" || run.status === "error") {
        clearInterval(interval);
      }
    }, 800);
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "800px",
        margin: "0 auto",
        color: "#ecefe6",
      }}
    >
      <h2>AI Workflow Engine Mini</h2>

      <div
        style={{
          background: "#1e1e2e",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <label style={{ display: "block", marginBottom: "8px" }}>
          User Prompt:
        </label>
        <input
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "4px",
            background: "#2b2b3d",
            border: "1px solid #444",
            color: "#fff",
            marginBottom: "12px",
          }}
        />
        <button
          onClick={handleStart}
          style={{
            padding: "10px 18px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Run Parallel Graph
        </button>
      </div>

      <h3>Graph Nodes & Execution Workflow</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {nodes.map((node) => (
          <div
            key={node.id}
            style={{
              padding: "16px",
              borderRadius: "6px",
              background: "#1e1e2e",
              borderLeft: `4px solid ${
                node.data.status === "success"
                  ? "#22c55e"
                  : node.data.status === "running"
                    ? "#3b82f6"
                    : node.data.status === "error"
                      ? "#ef4444"
                      : "#6b7280"
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>
                [{node.type.toUpperCase()}] {node.data.label}
              </strong>
              <div>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: "#2b2b3d",
                    marginRight: "8px",
                  }}
                >
                  {node.data.status}
                </span>
                {node.data.status === "error" && (
                  <button
                    onClick={() => handleRetry(node.id)}
                    style={{
                      padding: "4px 8px",
                      background: "#ef4444",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>

            {node.data.imageUrl && (
              <div style={{ marginTop: "12px" }}>
                <img
                  src={node.data.imageUrl}
                  alt="AI Result"
                  style={{ maxWidth: "200px", borderRadius: "4px" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowEditor;
