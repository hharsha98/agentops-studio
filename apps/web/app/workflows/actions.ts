"use server";

import { revalidatePath } from "next/cache";

import { startReplay } from "@/lib/api";

export type ReplayActionState = {
  status: "idle" | "success" | "error";
  message: string;
  runId?: string;
  runTitle?: string;
};

export async function startReplayAction(
  _previousState: ReplayActionState,
  formData: FormData
): Promise<ReplayActionState> {
  const workflowId = String(formData.get("workflowId") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();

  if (!workflowId) {
    return {
      status: "error",
      message: "Choose a workflow before starting a replay."
    };
  }

  if (goal.length < 8) {
    return {
      status: "error",
      message: "Describe the goal in at least 8 characters."
    };
  }

  const run = await startReplay({
    workflow_id: workflowId,
    goal
  });

  if (!run) {
    return {
      status: "error",
      message: "The API is not reachable. Start the FastAPI service, then try the replay again."
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/runs");
  revalidatePath("/workflows");

  return {
    status: "success",
    message: "Replay started. Open the run board to inspect tasks, trace events, and artifacts.",
    runId: run.id,
    runTitle: run.title
  };
}
