import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { sampleFramesInContainer } from "./utils/sample-frames";

export type WorkflowParams = {
  video: {
    bucket: string;
    fileKey: string;
  };
};

export class ScreenScribeWorkflow extends WorkflowEntrypoint<CloudflareBindings> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    const frames = await step.do("sample-frames", async () => {
      return sampleFramesInContainer(this.env, {
        bucket: event.payload.video.bucket,
        fileKey: event.payload.video.fileKey,
      });
    });

    await step.do("transcribe", async () => {});

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
