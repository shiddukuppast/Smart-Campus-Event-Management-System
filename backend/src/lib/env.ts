import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1d"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_ORIGIN: z.string().url().optional(),
});

export class EnvironmentConfigurationError extends Error {
  constructor(public readonly missingVariables: string[]) {
    super("Required environment variables are missing or invalid");
    this.name = "EnvironmentConfigurationError";
  }
}

export function getEnv() {
  const result = envSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  });
  if (!result.success) {
    const variables = new Set(
      result.error.issues.map((issue) => issue.path[0]).filter((value): value is string => typeof value === "string"),
    );
    const missingVariables = [...variables];
    console.error("Backend environment configuration is invalid", { variables: missingVariables });
    throw new EnvironmentConfigurationError(missingVariables);
  }
  return result.data;
}
