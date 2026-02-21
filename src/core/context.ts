// src/core/context.ts
import type { AppDatabase } from "./database";
import type { AppEventBus } from "./events";
import type { Config } from "./config";
import type { Bot } from "grammy";

// The Global Dependency Injection Container
export interface AppContext {
  db: AppDatabase;
  bus: AppEventBus;
  config: Config;
  bot: Bot; // Telegram Bot instance
}