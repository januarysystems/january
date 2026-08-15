/**
 * Auto-Run Server Functions
 *
 * Server-side endpoints for managing local AI services.
 * These functions can spawn and monitor processes for Ollama, Whisper, and Piper.
 */

import { createServerFn } from "@tanstack/react-start";
import { spawn } from "child_process";
import { autoRunService } from "../services/auto-run-service";

/**
 * Server function to auto-start all enabled services
 */
export const autoStartServicesFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[AutoRun Server] Starting auto-start process...');

  const results = [];

  try {
    // Auto-start Ollama if enabled
    if (autoRunService.getConfig().services.ollama) {
      const ollamaResult = await startOllama();
      results.push(ollamaResult);
    }

    // Auto-start Whisper if enabled
    if (autoRunService.getConfig().services.whisper) {
      const whisperResult = await startWhisper();
      results.push(whisperResult);
    }

    // Auto-start Piper if enabled
    if (autoRunService.getConfig().services.piper) {
      const piperResult = await startPiper();
      results.push(piperResult);
    }

    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    };
  }
});

/**
 * Server function to start Ollama
 */
export const startOllamaFn = createServerFn({ method: "POST" }).handler(async () => {
  return await startOllama();
});

/**
 * Server function to start Whisper
 */
export const startWhisperFn = createServerFn({ method: "POST" }).handler(async () => {
  return await startWhisper();
});

/**
 * Server function to start Piper
 */
export const startPiperFn = createServerFn({ method: "POST" }).handler(async () => {
  return await startPiper();
});

/**
 * Server function to check all service statuses
 */
export const checkServicesStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  return await autoRunService.getAllServiceStatus();
});

/**
 * Start Ollama service
 */
async function startOllama(): Promise<{
  name: string;
  success: boolean;
  running: boolean;
  pid?: number;
  error?: string;
}> {
  console.log('[AutoRun Server] Starting Ollama...');

  try {
    // Check if Ollama is already running
    const ollamaCheck = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(5000),
    });

    if (ollamaCheck.ok) {
      console.log('[AutoRun Server] Ollama is already running');
      return {
        name: 'Ollama',
        success: true,
        running: true,
      };
    }
  } catch (error) {
    console.log('[AutoRun Server] Ollama not running, starting...');
  }

  // Spawn Ollama process
  const ollamaProcess = spawn('ollama', ['serve'], {
    stdio: 'ignore',
    detached: true,
  });

  ollamaProcess.unref();

  console.log('[AutoRun Server] Ollama process spawned, PID:', ollamaProcess.pid);

  // Wait for Ollama to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Verify Ollama started
  try {
    const verifyCheck = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(10000),
    });

    if (verifyCheck.ok) {
      console.log('[AutoRun Server] Ollama started successfully');
      return {
        name: 'Ollama',
        success: true,
        running: true,
        pid: ollamaProcess.pid,
      };
    }
  } catch (error) {
    console.error('[AutoRun Server] Ollama failed to start:', error);
  }

  return {
    name: 'Ollama',
    success: false,
    running: false,
    error: 'Failed to start Ollama. Make sure Ollama is installed.',
  };
}

/**
 * Start Whisper service
 */
async function startWhisper(): Promise<{
  name: string;
  success: boolean;
  running: boolean;
  pid?: number;
  error?: string;
}> {
  console.log('[AutoRun Server] Starting Whisper...');

  try {
    // Check if Whisper is already running
    const whisperCheck = await fetch('http://127.0.0.1:8080/v1/models', {
      signal: AbortSignal.timeout(5000),
    });

    if (whisperCheck.ok) {
      console.log('[AutoRun Server] Whisper is already running');
      return {
        name: 'Whisper',
        success: true,
        running: true,
      };
    }
  } catch (error) {
    console.log('[AutoRun Server] Whisper not running, starting...');
  }

  // Spawn Whisper process
  try {
    const whisperProcess = spawn('faster-whisper-server', [
      '--host', '127.0.0.1',
      '--port', '8080',
    ], {
      stdio: 'ignore',
      detached: true,
    });

    whisperProcess.unref();

    console.log('[AutoRun Server] Whisper process spawned, PID:', whisperProcess.pid);

    // Wait for Whisper to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify Whisper started
    try {
      const verifyCheck = await fetch('http://127.0.0.1:8080/v1/models', {
        signal: AbortSignal.timeout(10000),
      });

      if (verifyCheck.ok) {
        console.log('[AutoRun Server] Whisper started successfully');
        return {
          name: 'Whisper',
          success: true,
          running: true,
          pid: whisperProcess.pid,
        };
      }
    } catch (error) {
      console.error('[AutoRun Server] Whisper failed to start:', error);
    }

    return {
      name: 'Whisper',
      success: false,
      running: false,
      error: 'Failed to start Whisper. Make sure faster-whisper is installed.',
    };
  } catch (error) {
    return {
      name: 'Whisper',
      success: false,
      running: false,
      error: 'faster-whisper-server command not found. Install with: pip install faster-whisper',
    };
  }
}

/**
 * Start Piper TTS service
 */
async function startPiper(): Promise<{
  name: string;
  success: boolean;
  running: boolean;
  pid?: number;
  error?: string;
}> {
  console.log('[AutoRun Server] Starting Piper...');

  try {
    // Check if Piper is already running
    const piperCheck = await fetch('http://127.0.0.1:8081/api/voices', {
      signal: AbortSignal.timeout(5000),
    });

    if (piperCheck.ok) {
      console.log('[AutoRun Server] Piper is already running');
      return {
        name: 'Piper',
        success: true,
        running: true,
      };
    }
  } catch (error) {
    console.log('[AutoRun Server] Piper not running, starting...');
  }

  // Spawn Piper process
  try {
    const piperProcess = spawn('piper-tts-server', [
      '--host', '127.0.0.1',
      '--port', '8081',
    ], {
      stdio: 'ignore',
      detached: true,
    });

    piperProcess.unref();

    console.log('[AutoRun Server] Piper process spawned, PID:', piperProcess.pid);

    // Wait for Piper to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify Piper started
    try {
      const verifyCheck = await fetch('http://127.0.0.1:8081/api/voices', {
        signal: AbortSignal.timeout(10000),
      });

      if (verifyCheck.ok) {
        console.log('[AutoRun Server] Piper started successfully');
        return {
          name: 'Piper',
          success: true,
          running: true,
          pid: piperProcess.pid,
        };
      }
    } catch (error) {
      console.error('[AutoRun Server] Piper failed to start:', error);
    }

    return {
      name: 'Piper',
      success: false,
      running: false,
      error: 'Failed to start Piper. Make sure Piper is installed.',
    };
  } catch (error) {
    return {
      name: 'Piper',
      success: false,
      running: false,
      error: 'piper-tts-server command not found. Install with: pip install piper-tts',
    };
  }
}

/**
 * Server function to get installation commands
 */
export const getInstallationCommandsFn = createServerFn({ method: "GET" }).handler(() => {
  return {
    ollama: {
      install: 'brew install ollama', // macOS
      alternative: 'curl -fsSL https://ollama.com/install.sh | sh', // Linux
      windows: 'Download from https://ollama.com',
      start: 'ollama serve',
      pullModel: 'ollama pull qwen3-coder:30b',
    },
    whisper: {
      install: 'pip install faster-whisper',
      start: 'faster-whisper-server --host 127.0.0.1 --port 8080',
    },
    piper: {
      install: 'pip install piper-tts',
      start: 'piper-tts-server --host 127.0.0.1 --port 8081',
    },
  };
});
