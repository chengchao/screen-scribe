import { execute } from "./execute";
import { dirname } from "path";
import { promises as fs } from "fs";
import { listFiles } from "./helpers";

type SampleOpts = {
  inputPath: string; // e.g. /Users/you/Desktop/Recording.mov
  outputDir: string; // e.g. /tmp/frames
  rate?: number; // frames per second to keep (default 1)
  ext?: "png" | "jpg"; // output format (default 'png')
};

export async function sampleVideo({
  inputPath,
  outputDir,
  rate = 1,
  ext = "png",
}: SampleOpts) {
  // Ensure outputDir exists
  await fs.mkdir(outputDir, { recursive: true });

  // Use the output directory as cwd and a simple relative pattern
  const outputPattern = `frame_%06d.${ext}`;

  // Notes:
  // - -vf fps=1: samples 1 frame/sec (better than -r for VFR inputs like QuickTime)
  // - -hide_banner -loglevel error: keep stderr clean unless there’s an actual error
  // - -y: overwrite existing frames if re-running
  const flags = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    inputPath,
    "-vf",
    `fps=${rate}`,
    outputPattern,
  ];

  await execute("ffmpeg", { flags, cwd: outputDir });

  const files = await listFiles(outputDir, "frame_", ".png");
  return { dir: outputDir, pattern: outputPattern, files };
}
