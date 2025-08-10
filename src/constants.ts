/**
 * Application constants and configuration values
 */

/**
 * File path patterns and transformations
 */
export const FILE_PATHS = {
  VIDEOS_PREFIX: "/videos/",
  FRAMES_PREFIX: "/frames/",
  MARKDOWN_PREFIX: "/markdown/",
  MOV_EXTENSION: ".mov",
  PNG_EXTENSION: ".png",
  MD_EXTENSION: ".md",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  EMPTY_BATCH: "No messages in batch",
  INVALID_FILE_KEY: "Invalid file key format",
  INVALID_KEY_FORMAT: "Invalid key format",
} as const;
