import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";

type WorkflowParams = {};

export class ScreenScribeWorkflow extends WorkflowEntrypoint<CloudflareBindings> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    await step.do("sample-frames", async () => {
      return "key frames";
    });

    await step.do("segment", async () => {});

    await Promise.all(
      await step.do("understand", async () => {
        return "frame descriptions";
      })
    );

    await step.waitForEvent("segment-done", {
      type: "segment-done",
    });

    await step.do("compose", async () => {});
  }
}
