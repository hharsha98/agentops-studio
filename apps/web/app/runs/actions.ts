"use server";

import { revalidatePath } from "next/cache";

import { advanceRun, approveRun } from "@/lib/api";

export type AdvanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type ApprovalActionState = AdvanceActionState;

export async function advanceRunAction(
  _previousState: AdvanceActionState,
  formData: FormData
): Promise<AdvanceActionState> {
  const runId = String(formData.get("runId") ?? "").trim();

  if (!runId) {
    return {
      status: "error",
      message: "Choose a run before advancing execution."
    };
  }

  const run = await advanceRun(runId);

  if (!run) {
    return {
      status: "error",
      message: "The run could not be advanced. Check that the API service is running."
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/runs");

  if (run.status === "approval") {
    return {
      status: "success",
      message: "Run advanced to human approval with a review artifact."
    };
  }

  if (run.status === "done") {
    return {
      status: "success",
      message: "Run completed and final trace events were recorded."
    };
  }

  return {
    status: "success",
    message: "Run advanced to the next agent task."
  };
}

export async function approveRunAction(
  _previousState: ApprovalActionState,
  formData: FormData
): Promise<ApprovalActionState> {
  const runId = String(formData.get("runId") ?? "").trim();

  if (!runId) {
    return {
      status: "error",
      message: "Choose a run before approving execution."
    };
  }

  const run = await approveRun(runId);

  if (!run) {
    return {
      status: "error",
      message: "The run could not be approved. Check that it is waiting for approval."
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/runs");

  return {
    status: "success",
    message: "Approval completed and the workflow outcome was released."
  };
}
