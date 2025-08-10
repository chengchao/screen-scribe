import { ERROR_MESSAGES, FILE_PATHS } from "../constants";

/**
 * Transforms a PDF file key to an image file key
 * Converts path from /pages/*.pdf to /images/*.png
 */
export function transformVideoKeyToFrameKey(videoKey: string): string {
  if (
    !videoKey.includes(FILE_PATHS.VIDEO_PREFIX) ||
    !videoKey.endsWith(FILE_PATHS.MOV_EXTENSION)
  ) {
    throw new Error(`${ERROR_MESSAGES.INVALID_FILE_KEY}: ${videoKey}`);
  }

  return videoKey
    .replace(FILE_PATHS.VIDEO_PREFIX, FILE_PATHS.FRAMES_PREFIX)
    .replace(FILE_PATHS.MOV_EXTENSION, FILE_PATHS.PNG_EXTENSION);
}

/**
 * Transforms an image file key to a markdown file key
 * Converts path from /images/*.png to /markdown/*.md
 */
export function transformImageKeyToMarkdownKey(imageKey: string): string {
  if (
    !imageKey.includes(FILE_PATHS.FRAMES_PREFIX) ||
    !imageKey.endsWith(FILE_PATHS.PNG_EXTENSION)
  ) {
    throw new Error(`${ERROR_MESSAGES.INVALID_FILE_KEY}: ${imageKey}`);
  }

  return imageKey
    .replace(FILE_PATHS.FRAMES_PREFIX, FILE_PATHS.MARKDOWN_PREFIX)
    .replace(FILE_PATHS.PNG_EXTENSION, FILE_PATHS.MD_EXTENSION);
}
