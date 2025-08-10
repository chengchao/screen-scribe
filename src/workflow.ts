import { getRandom } from "@cloudflare/containers";
import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";
import { transformVideoKeyToFrameKey } from "./utils/file-utils";

export type WorkflowParams = {
  video: {
    bucket: string;
    fileKey: string;
  };
};

export class ScreenScribeWorkflow extends WorkflowEntrypoint<CloudflareBindings> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    await step.do("sample-frames", async () => {
      const containerInstance = await getRandom(
        this.env.SCREEN_SCRIBE_CONTAINER
      );
      const response = await containerInstance.fetch(
        new Request("http://localhost:3000/sample", {
          method: "POST",
          body: JSON.stringify({
            source: {
              bucket: event.payload.video.bucket,
              fileKey: event.payload.video.fileKey,
            },
            destination: {
              bucket: event.payload.video.bucket,
              folder: transformVideoKeyToFrameKey(event.payload.video.fileKey)
                .split("/")
                .slice(0, -1)
                .join("/"),
            },
          }),
        })
      );
      const { frameFileKeys } = await response.json<{
        frameFileKeys: { frameNumber: string; frameFileKey: string }[];
      }>();
      return frameFileKeys;
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
