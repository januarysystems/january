/**
 * Debug endpoint to check environment variables
 */

import { createServerFn } from "@tanstack/react-start";

export const getEnvDebug = createServerFn({ method: "GET" }).handler(() => {
  return {
    hasProcess: typeof process !== "undefined",
    hasProcessEnv: typeof process !== "undefined" && !!process.env,
    envKeys: typeof process !== "undefined" && process.env
      ? Object.keys(process.env).filter(key => key.includes("OPENAI") || key.includes("ANTHROPIC") || key.includes("API"))
      : [],
    openAIKey: typeof process !== "undefined" && process.env?.OPENAI_API_KEY
      ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : null,
    anthropicKey: typeof process !== "undefined" && process.env?.ANTHROPIC_API_KEY
      ? `${process.env.ANTHROPIC_API_KEY?.substring(0, 10)}...` : null,
  };
});
