import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CLAUDE_API_KEY: z.string().default("your_key_here"),
  FRONTEND_URL: z.string().url(),
  SCHOOL_NAME: z.string().default("VedaAI Public School"),
  BACKEND_RUNTIME_MODE: z.enum(["server", "serverless"]).default("server")
});

export type Env = z.infer<typeof envSchema> & {
  CLAUDE_MODEL: string;
};

export const getEnv = (): Env => {
  const parsed = envSchema.parse(process.env);

  return {
    ...parsed,
    CLAUDE_MODEL: "claude-sonnet-4-20250514"
  };
};
