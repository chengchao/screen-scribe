import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { downloadFile, uploadFile } from "./r2";
import { getS3Client } from "./s3-client";
import { createTmpDirectory } from "./helpers";
import { join } from "path";
import { sampleVideo } from "./ffmpeg";
import pLimit from "p-limit";
import { getEnv } from "./config";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post(
  "/sample",
  zValidator(
    "json",
    z.object({
      source: z.object({
        bucket: z.string(),
        fileKey: z.string(),
      }),
      destination: z.object({
        bucket: z.string(),
        folder: z.string(),
      }),
    })
  ),
  async (c) => {
    try {
      const { source, destination } = c.req.valid("json");
      const env = getEnv();
      const s3 = getS3Client();

      const tmpDir = await createTmpDirectory();
      const videoPath = join(tmpDir, "downloaded.mov");

      await downloadFile({
        s3,
        bucket: source.bucket,
        fileKey: source.fileKey,
        outputPath: videoPath,
      });
      const { files: frames } = await sampleVideo({
        inputPath: videoPath,
        outputDir: tmpDir,
      });

      const limit = pLimit(env.UPLOAD_CONCURRENCY_LIMIT);
      const uploadPromises = frames.map((frame) =>
        limit(() => {
          const asyncUpload = async () => {
            const frameNumber = frame
              .split("/")
              .pop()
              ?.replace(/frame-(\d+)\.png$/, "$1");

            await uploadFile({
              s3,
              bucket: destination.bucket,
              fileKey: `${destination.folder}/${frameNumber}.png`,
              inputPath: frame,
            });
            return {
              frameNumber,
              frameFileKey: `${destination.folder}/${frameNumber}.png`,
            };
          };

          return asyncUpload();
        })
      );
      const frameFileKeys = await Promise.all(uploadPromises);
      console.log(
        `Uploaded ${frames.length} frames to ${destination.bucket}/${destination.folder}`
      );
      return c.json({
        message: "Frames uploaded",
        frameFileKeys,
      });
    } catch (error) {
      return c.json({ error: "Invalid request" }, 400);
    }
  }
);

export default app;
