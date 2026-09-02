import type { WorkflowNode, RunState } from "../types/index.js";
import { PRESETS } from "../config/presets.js";
import { runsStore } from "../store/runsStore.js";
import fetchWithTimeout from "./aiService.js";

export async function processNode(node: WorkflowNode, run: RunState) {
  node.data.status = "running";

  try {
    if (node.type === "generate") {
      const incomingEdges = run.edges.filter((e) => e.target === node.id);
      const parentNodes = run.nodes.filter((n) =>
        incomingEdges.some((e) => e.source === n.id),
      );
      const promptNode = parentNodes.find((n) => n.type === "prompt");

      let finalPrompt =
        promptNode?.data.promptText || "A creative cyberpunk cat";

      if (node.data.presetId) {
        const preset = PRESETS.find((p) => p.id === node.data.presetId);
        if (preset) {
          finalPrompt = `${finalPrompt}, ${preset.mainPrompt}`;
        }
      }

      console.log(
        `[AI Generation - Node ${node.id}] Generating for prompt: "${finalPrompt}"`,
      );

      const encodedPrompt = encodeURIComponent(finalPrompt);
      const seed = Math.floor(Math.random() * 10000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${seed}`;

      let lastError: Error | null = null;
      let response: Response | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetchWithTimeout(imageUrl, { method: "GET" }, 20000);
          if (response.ok) break;
          lastError = new Error(
            `HTTP ${response.status} ${response.statusText}`,
          );
        } catch (err: any) {
          lastError = err;
        }

        const delay = 800 * (attempt + 1) + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
      }

      if (!response || !response.ok) {
        throw new Error(
          lastError?.message || "Failed to reach Image Generation API",
        );
      }

      node.data.imageUrl = response.url;
    } else {
      await new Promise((r) => setTimeout(r, 200));
    }

    node.data.status = "success";
  } catch (err: any) {
    console.error(`[Node ${node.id} Error]:`, err.message);
    node.data.status = "error";
    node.data.error = err.message || "Generation failed";
  }
}

export async function executeGraph(runId: string, startFromNodeIds?: string[]) {
  const run = runsStore.get(runId);
  if (!run) return;

  try {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    run.nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      graph.set(n.id, []);
    });

    run.edges.forEach((e) => {
      graph.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    let currentBatch = startFromNodeIds
      ? run.nodes
          .filter((n) => startFromNodeIds.includes(n.id))
          .map((n) => n.id)
      : run.nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);

    const executed = new Set<string>();
    const failed = new Set<string>();

    while (currentBatch.length > 0) {
      await Promise.all(
        currentBatch.map(async (nodeId) => {
          const node = run.nodes.find((n) => n.id === nodeId)!;

          const incoming = run.edges
            .filter((e) => e.target === nodeId)
            .map((e) => e.source);
          const hasFailedParent = incoming.some((sourceId) =>
            failed.has(sourceId),
          );

          if (hasFailedParent) {
            node.data.status = "error";
            node.data.error = "Upstream node failed";
            failed.add(nodeId);
            executed.add(nodeId);
            return;
          }

          await processNode(node, run);
          executed.add(nodeId);
          if (node.data.status === "error") {
            failed.add(nodeId);
          }
        }),
      );

      const nextBatch: string[] = [];
      run.nodes.forEach((n) => {
        if (executed.has(n.id)) return;

        const incoming = run.edges
          .filter((e) => e.target === n.id)
          .map((e) => e.source);
        const isReady = incoming.every((sourceId) => executed.has(sourceId));

        if (isReady && !nextBatch.includes(n.id)) {
          nextBatch.push(n.id);
        }
      });

      currentBatch = nextBatch;
    }

    run.status = failed.size > 0 ? "partial_error" : "success";
  } catch (err: any) {
    run.status = "error";
    run.error = err.message;
  }
}
