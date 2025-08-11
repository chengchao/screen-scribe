import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { sampleFramesInContainer } from "./utils/sample-frames";
import { understandImageWithClaude } from "./utils/anthropic-vision";
import { composeDocumentWithClaude } from "./utils/compose";

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

    const frameDescriptions = await Promise.all(
      frames.map((frame) => {
        return step.do(`transcribe-${frame.frameNumber}`, async () => {
          return understandImageWithClaude(this.env, {
            bucket: event.payload.video.bucket,
            fileKey: frame.frameFileKey,
            frameTime: frame.frameTime,
          });
        });
      })
    );

    await step.do("segment", async () => {});

    // await Promise.all(
    //   await step.do("understand", async () => {
    //     return "frame descriptions";
    //   })
    // );

    // await step.waitForEvent("segment-done", {
    //   type: "segment-done",
    // });

    await step.do("compose", async () => {
      const composed = await composeDocumentWithClaude(
        this.env,
        frameDescriptions.map((desc, idx) => ({
          frameNumber: frames[idx].frameNumber,
          description: desc,
        })),
        { format: "markdown" }
      );
      return composed;
    });
  }
}
