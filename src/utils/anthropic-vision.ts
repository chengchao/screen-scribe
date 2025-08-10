import Anthropic from "@anthropic-ai/sdk";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UnderstandImageInput = {
  bucket: string;
  fileKey: string;
  prompt?: string;
};

function createR2S3Client(env: CloudflareBindings): S3Client {
  return new S3Client({
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    region: "auto",
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function understandImageWithClaude(
  env: CloudflareBindings,
  { bucket, fileKey, prompt }: UnderstandImageInput
): Promise<string> {
  const s3 = createR2S3Client(env);

  // Pre-sign a short-lived GET URL for Claude to fetch the image
  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: fileKey }),
    { expiresIn: 60 * 5 }
  );

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-opus-4-1",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: signedUrl },
          },
          {
            type: "text",
            text:
              prompt ??
              "Describe this frame. Focus on on-screen text and key UI elements; summarize relevant content succinctly.",
          },
        ],
      },
    ],
  });

  // Concatenate any text blocks in the response
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block: any) => block.text as string)
    .join("\n\n");

  return text;
}
