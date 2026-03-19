import { z } from "zod";

const baseEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CLAUDE_API_KEY: z.string().default("your_key_here"),
  FRONTEND_URL: z.string().url(),
  SCHOOL_NAME: z.string().default("VedaAI Public School"),
  BACKEND_RUNTIME_MODE: z.enum(["server", "serverless"]).default("server")
});

const envSchema = baseEnvSchema.superRefine((env, context) => {
  if (env.BACKEND_RUNTIME_MODE === "server" && !env.REDIS_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["REDIS_URL"],
      message: "REDIS_URL is required when BACKEND_RUNTIME_MODE=server."
    });
  }

  if (
    env.BACKEND_RUNTIME_MODE === "serverless" &&
    !env.REDIS_URL &&
    !(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["UPSTASH_REDIS_REST_URL"],
      message:
        "Serverless mode requires either REDIS_URL or both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    });
  }
});

export type Env = z.infer<typeof baseEnvSchema> & {
  CLAUDE_MODEL: string;
};

export const getEnv = (): Env => {
  const parsed = envSchema.parse(process.env);

  return {
    ...parsed,
    CLAUDE_MODEL: "claude-sonnet-4-20250514"
  };
};
