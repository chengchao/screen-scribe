import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { sampleFramesInContainer } from "./utils/sample-frames";
import { understandImageWithClaude } from "./utils/anthropic-vision";

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

    await Promise.all(
      frames.map((frame) => {
        return step.do(`transcribe-${frame.frameNumber}`, async () => {
          return understandImageWithClaude(this.env, {
            bucket: event.payload.video.bucket,
            fileKey: frame.frameFileKey,
            prompt:
              "Extract on-screen text and key UI actions. Provide a concise, ordered transcription of what the user would read/do.",
          });
        });
      })
    );

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
