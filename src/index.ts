import { frameProcessingQueue, R2Event } from "./queue";
import { ScreenScribeWorkflow } from "./workflow";
import { Container } from "@cloudflare/containers";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class MyContainer extends Container<CloudflareBindings> {
  defaultPort = 3000;
  sleepAfter = "10m";
  envVars = {
    R2_ACCESS_KEY_ID: this.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: this.env.R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID,
  };
}

export default {
  async fetch(
    request: Request,
    env: CloudflareBindings,
    ctx: ExecutionContext
  ) {
    console.log("Fetching request:", request.url);
    const url = new URL(request.url);

    if (url.pathname.startsWith("/favicon")) {
      return Response.json({}, { status: 404 });
    }

    if (url.pathname.startsWith("/upload")) {
      const s3 = new S3Client({
        requestChecksumCalculation: "WHEN_REQUIRED",
        responseChecksumValidation: "WHEN_REQUIRED",
        region: "auto",
        endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      });

      const key = `files/videos/${crypto.randomUUID()}/test.mov`;
      const fileType = "video/quicktime";

      const command = new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return Response.json({ url });
    }

    return Response.json({ message: "Not found" }, { status: 404 });
  },

  async queue(batch: MessageBatch<R2Event>, env: CloudflareBindings) {
    await frameProcessingQueue(batch, env);
  },
} satisfies ExportedHandler<CloudflareBindings, R2Event>;

export { ScreenScribeWorkflow, frameProcessingQueue };
