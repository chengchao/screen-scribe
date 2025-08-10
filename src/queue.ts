import { getRandom } from "@cloudflare/containers";
import { WorkflowParams } from "./workflow";

export type R2Event = {
  account: string;
  action:
    | "PutObject"
    | "CopyObject"
    | "CompleteMultipartUpload"
    | "DeleteObject";
  bucket: string;
  object: {
    key: string;
    size: number;
    eTag: string;
  };
  eventTime: string;
  copySource?: {
    bucket: string;
    object: string;
  };
};

export async function frameProcessingQueue(
  batch: MessageBatch<R2Event>,
  env: CloudflareBindings
) {
  for (const message of batch.messages) {
    const event = message.body;
    console.log(event);

    const params: WorkflowParams = {
      video: {
        bucket: event.bucket,
        fileKey: event.object.key,
      },
    };

    await env.SCREEN_SCRIBE.create({
      params,
    });
  }
}
