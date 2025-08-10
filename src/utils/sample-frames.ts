import { getRandom } from "@cloudflare/containers";
import { transformVideoKeyToFrameKey } from "./file-utils";

export type SampleFramesInput = {
  bucket: string;
  fileKey: string;
};

export type SampledFrame = {
  frameNumber: string;
  frameFileKey: string;
};

export async function sampleFramesInContainer(
  env: CloudflareBindings,
  video: SampleFramesInput
): Promise<SampledFrame[]> {
  const containerInstance = await getRandom(env.SCREEN_SCRIBE_CONTAINER);

  const destinationFolder = transformVideoKeyToFrameKey(video.fileKey)
    .split("/")
    .slice(0, -1)
    .join("/");

  const response = await containerInstance.fetch(
    new Request("http://localhost:3000/sample", {
      method: "POST",
      body: JSON.stringify({
        source: {
          bucket: video.bucket,
          fileKey: video.fileKey,
        },
        destination: {
          bucket: video.bucket,
          folder: destinationFolder,
        },
      }),
    })
  );

  const { frameFileKeys } = (await response.json<{
    frameFileKeys: SampledFrame[];
  }>()) as { frameFileKeys: SampledFrame[] };

  return frameFileKeys;
}
