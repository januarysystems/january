/**
 * Server-side AI Configuration
 *
 * Handles environment variable loading for AI providers.
 * This file runs server-side only.
 */

// Load environment variables once at module load time
let envLoaded = false;

export function loadServerEnv(): void {
  if (envLoaded) return;

  console.log("[Server Config] loadServerEnv called, envLoaded:", envLoaded);

  if (typeof process === "undefined" || !process.env) {
    console.warn("[Server Config] Not running in server environment");
    return;
  }

  // Check if environment variables are already loaded
  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    console.log("[Server Config] Environment variables already loaded");
    envLoaded = true;
    return;
  }

  // Try to load from .env file
  try {
    const fs = require("fs");
    const path = require("path");
    const dotenv = require("dotenv");

    const envPath = path.resolve(process.cwd(), ".env");
    console.log("[Server Config] Looking for .env at:", envPath);

    if (fs.existsSync(envPath)) {
      console.log("[Server Config] .env file found, parsing...");
      const envConfig = dotenv.parse(fs.readFileSync(envPath));

      // Merge into process.env
      Object.assign(process.env, envConfig);

      console.log("[Server Config] Loaded .env file successfully");
      console.log("[Server Config] OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
      console.log("[Server Config] ANTHROPIC_API_KEY present:", !!process.env.ANTHROPIC_API_KEY);
    } else {
      console.warn("[Server Config] .env file not found at:", envPath);
    }
  } catch (error) {
    console.error("[Server Config] Failed to load .env:", error);
  }

  envLoaded = true;
}

// Auto-load on import
loadServerEnv();

/**
 * Get environment variable with fallback
 */
export function getEnvVar(key: string, fallback?: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || fallback;
  }
  return fallback;
}

/**
 * Check if server environment is ready
 */
export function isServerReady(): boolean {
  return typeof process !== "undefined" && !!process.env;
}
