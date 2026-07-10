"use server";

import { revalidatePath } from "next/cache";

import { advanceRun, approveRun, createWorkerJob, getWorkerJob } from "@/lib/api";

export type AdvanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type ApprovalActionState = AdvanceActionState;

export type WorkerActionState = {
  status: "idle" | "success" | "error";
  message: string;
  jobId?: string;
  jobStatus?: string;
};

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

export async function createWorkerJobAction(
  _previousState: WorkerActionState,
  formData: FormData
): Promise<WorkerActionState> {
  const runId = String(formData.get("runId") ?? "").trim();

  if (!runId) {
    return {
      status: "error",
      message: "Choose a run before queueing a worker job."
    };
  }

  const job = await createWorkerJob(runId);

  if (!job) {
    return {
      status: "error",
      message: "The worker job could not be queued. Check that the API service is running."
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/runs");

  return {
    status: "success",
    message: job.message,
    jobId: job.id,
    jobStatus: job.status
  };
}

export async function refreshWorkerJobAction(
  previousState: WorkerActionState,
  formData: FormData
): Promise<WorkerActionState> {
  const jobId = String(formData.get("jobId") ?? previousState.jobId ?? "").trim();

  if (!jobId) {
    return {
      status: "error",
      message: "Queue a worker job before refreshing its status."
    };
  }

  const job = await getWorkerJob(jobId);

  if (!job) {
    return {
      status: "error",
      message: "The worker job could not be found."
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/runs");

  return {
    status: "success",
    message: job.message,
    jobId: job.id,
    jobStatus: job.status
  };
}
