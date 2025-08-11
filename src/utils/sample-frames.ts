import { transformVideoKeyToFrameKey } from "./file-utils";

export type SampleFramesInput = {
  bucket: string;
  fileKey: string;
};

export type SampledFrame = {
  frameNumber: string;
  frameFileKey: string;
  frameTime: number;
};

export async function sampleFramesInContainer(
  env: CloudflareBindings,
  video: SampleFramesInput
): Promise<SampledFrame[]> {
  const destinationFolder = transformVideoKeyToFrameKey(video.fileKey)
    .split("/")
    .slice(0, -1)
    .join("/");

  const response = await fetch(
    new Request(
      "https://screen-scribe-container.calendeam.workers.dev/sample",
      {
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
      }
    )
  );

  if (!response.ok) {
    throw new Error(
      `Failed to sample frames: ${response.status} ${
        response.statusText
      } ${await response.text()}`
    );
  }

  const { frameFileKeys } = (await response.json<{
    message: string;
    frameFileKeys: SampledFrame[];
  }>()) as { frameFileKeys: SampledFrame[] };

  return frameFileKeys;
}
