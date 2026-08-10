import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
	},
	client: {
		NEXT_PUBLIC_URL: z.string().url().optional(),
		NEXT_PUBLIC_API_URL: z.string().url().optional(),
		NEXT_PUBLIC_APP_URL: z.string().url().optional(),
		NEXT_PUBLIC_USE_MOCK: z.enum(["true", "false"]).optional(),
		NEXT_PUBLIC_VENDOR_CORE_API_URL: z.string().url().optional(),
		NEXT_PUBLIC_GA_ID: z.string().optional(),
		NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().optional(),
		NEXT_PUBLIC_YANDEX_VERIFICATION: z.string().optional(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,
		NEXT_PUBLIC_VENDOR_CORE_API_URL:
			process.env.NEXT_PUBLIC_VENDOR_CORE_API_URL,
		NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
		NEXT_PUBLIC_GOOGLE_VERIFICATION:
			process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
		NEXT_PUBLIC_YANDEX_VERIFICATION:
			process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
	},
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
