import Anthropic from "@anthropic-ai/sdk";

export type FrameSummary = {
  frameNumber: string;
  description: string;
};

export async function composeDocumentWithClaude(
  env: CloudflareBindings,
  frames: FrameSummary[],
  options?: { format?: "markdown" | "plain"; extraPrompt?: string }
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const format = options?.format ?? "markdown";
  const extraPrompt = options?.extraPrompt ?? "";

  const bulletPoints = frames
    .map((f) => `- [${f.frameNumber}] ${f.description}`)
    .join("\n");

  const userText = `You are composing a single ${format} document that summarizes the following frame descriptions from a screen recording.\n\n${bulletPoints}\n\n${extraPrompt}\n\nRequirements:\n- Merge overlapping information.\n- Preserve important on-screen text.\n- Use clear headings and ordered steps where appropriate.\n- Keep it concise and actionable.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-4-1",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userText,
          },
        ],
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block: any) => block.text as string)
    .join("\n\n");

  return text;
}
