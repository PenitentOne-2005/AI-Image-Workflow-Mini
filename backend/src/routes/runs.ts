import { Router } from "express";
import type { CreateRunDto, RunState } from "../types/index.js";
import { PRESETS } from "../config/presets.js";
import { runsStore } from "../store/runsStore.js";
import { executeGraph } from "../services/engineService.js";

const router = Router();

router.get("/presets", (req, res) => {
  res.json(PRESETS);
});

router.post("/runs", (req, res) => {
  const { nodes, edges }: CreateRunDto = req.body;
  const runId = `run_${Date.now()}`;

  const runState: RunState = {
    id: runId,
    status: "running",
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data, status: "queued" } })),
    edges,
  };

  runsStore.set(runId, runState);
  executeGraph(runId);

  res.json({ runId });
});

router.get("/runs/:runId", (req, res) => {
  const run = runsStore.get(req.params.runId);
  if (!run) return res.status(404).json({ error: "Run not found" });
  res.json(run);
});

router.post("/runs/:runId/nodes/:nodeId/retry", (req, res) => {
  const { runId, nodeId } = req.params;
  const run = runsStore.get(runId);

  if (!run) return res.status(404).json({ error: "Run not found" });

  const node = run.nodes.find((n) => n.id === nodeId);
  if (!node) return res.status(404).json({ error: "Node not found" });

  node.data.status = "queued";
  node.data.error = undefined;
  run.status = "running";

  executeGraph(runId, [nodeId]);

  res.json({ success: true, runId, nodeId });
});

export default router;
