/**
 * Custom error classes for better error handling
 */

export const ProblemType = {
  ValidationError: "https://api.cobbling.com/problems/validation-error",
  FileTooLarge: "https://api.cobbling.com/problems/file-too-large",
  FileNotFound: "https://api.cobbling.com/problems/file-not-found",
  UnsupportedImageType:
    "https://api.cobbling.com/problems/unsupported-image-type",
  OcrUpstreamError: "https://api.cobbling.com/problems/ocr-upstream-error",
  StorageUpstreamError:
    "https://api.cobbling.com/problems/storage-upstream-error",
  InternalError: "https://api.cobbling.com/problems/internal-error",
  RateLimitExceeded: "https://api.cobbling.com/problems/rate-limit-exceeded",
} as const

export type ProblemDetails = {
  type: (typeof ProblemType)[keyof typeof ProblemType]
  title: string
  status: number
  detail?: string
  instance?: string
  code?: string
  requestId?: string
  errors?: Array<{
    field?: string
    reason?: string
    message: string
    code?: string
  }>
  [ext: string]: unknown
}

export class ApiError extends Error {
  status: number
  type?: string
  code?: string
  requestId?: string
  errors?: ProblemDetails["errors"]
  headers: Headers

  constructor(init: {
    message: string
    status: number
    problem?: ProblemDetails
    headers?: Headers
  }) {
    super(init.message)
    this.name = "ApiError"
    this.status = init.status
    this.headers = init.headers ?? new Headers()
    if (init.problem) {
      this.type = init.problem.type
      this.code = init.problem.code
      this.requestId = init.problem.requestId
      this.errors = init.problem.errors
    }
  }
}

function isProblemJson(res: Response) {
  const ct = res.headers.get("content-type") ?? ""
  return ct.toLowerCase().startsWith("application/problem+json")
}

export async function parseProblem(
  res: Response
): Promise<ProblemDetails | undefined> {
  try {
    if (isProblemJson(res)) return await res.json()
    // Graceful fallback if server didn’t set problem+json
    const text = await res.text()
    try {
      return JSON.parse(text) as ProblemDetails
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
  return undefined
}

export class ImageOcrError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseText?: string
  ) {
    super(message)
    this.name = "ImageOcrError"
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApiKeyError"
  }
}

/**
 * Creates a standardized error from an HTTP response
 */
export async function createHttpError(
  response: Response
): Promise<ImageOcrError> {
  const responseText = await response.text().catch(() => "Unknown error")
  return new ImageOcrError(
    `HTTP ${response.status}: ${response.statusText}`,
    response.status,
    responseText
  )
}

/**
 * Logs error with context information
 */
export function logError(error: Error, context?: Record<string, any>): void {
  console.error("Error occurred:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Checks if an error is retryable based on its type
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof ImageOcrError) {
    // Retry on server errors but not client errors
    return (
      !error.statusCode ||
      (error.statusCode >= 500 && error.statusCode < 600) ||
      error.statusCode === 429 // Rate limiting
    )
  }

  // Retry on network errors or unknown errors
  return !(error instanceof ValidationError) && !(error instanceof ApiKeyError)
}
