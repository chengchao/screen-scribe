import { z } from 'zod';

// 1. Define your schema
const EnvSchema = z.object({
	R2_ACCESS_KEY_ID: z.string(),
	R2_SECRET_ACCESS_KEY: z.string(),
	CLOUDFLARE_ACCOUNT_ID: z.string(),
	DOWNLOAD_TIMEOUT_MS: z
		.string()
		.transform(Number)
		.default(() => 1000 * 20), // 20 seconds
	PDF_CONVERT_TIMEOUT_MS: z
		.string()
		.transform(Number)
		.default(() => 1000 * 20), // 20 seconds
	PDF_CONVERT_CONCURRENCY_LIMIT: z
		.string()
		.transform(Number)
		.default(() => 5), // Default to 5 concurrent conversions
	CONTAINER_PORT: z
		.string()
		.transform(Number)
		.default(() => 3000),
	UPLOAD_CONCURRENCY_LIMIT: z
		.string()
		.transform(Number)
		.default(() => 100),
});

// 2. Parse & validate
export function getEnv(env: NodeJS.ProcessEnv = process.env) {
	const parsed = EnvSchema.parse(env);
	return parsed;
}
