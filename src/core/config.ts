// src/core/config.ts
import { z } from "zod";

const envSchema = z.object({
  // Infrastructure
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram Bot Token is required"),
  TELEGRAM_CHAT_ID: z.string().min(1, "Telegram Chat ID is required"),

  // AI / xAI
  XAI_API_KEY: z.string().min(1, "xAI API Key is required"),
  XAI_MODEL_NAME: z.string().default("grok-beta"),

  // Google
  GOOGLE_API_KEY: z.string().min(1, "Google API Key is required"),

  // AgentHub
  AGENTHUB_URL: z.string().min(1, "AgentHub URL is required"),
});

// Validate immediately on module load
const parseResult = envSchema.safeParse(Bun.env);

if (!parseResult.success) {
  console.error("❌ Invalid environment variables:", parseResult.error.format());
  process.exit(1);
}

export const config = parseResult.data;
export type Config = z.infer<typeof envSchema>;