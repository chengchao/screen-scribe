import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
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

// Build Hono app
const app = new Hono<{ Bindings: CloudflareBindings }>();

// favicon and similar asset requests → 404
app.get("/favicon*", (c) => c.json({}, 404));

// Generate a pre-signed upload URL in R2
app.get("/upload", async (c) => {
  const env = c.env;
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
  return c.json({ url });
});

// Also support GET /status?id=...
app.get(
  "/status",
  zValidator("query", z.object({ id: z.string() })),
  async (c) => {
    const id = c.req.valid("query").id;
    if (!id) return c.json({ message: "Missing id" }, 400);
    const workflowInstance = await c.env.SCREEN_SCRIBE.get(id);
    const status = await workflowInstance.status();
    return c.json({
      status,
      output: status.output,
      id,
    });
  }
);

// Catch-all 404
app.all("*", (c) => c.json({ message: "Not found" }, 404));

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<R2Event>, env: CloudflareBindings) {
    await frameProcessingQueue(batch, env);
  },
} satisfies ExportedHandler<CloudflareBindings, R2Event>;

export { ScreenScribeWorkflow, frameProcessingQueue };
