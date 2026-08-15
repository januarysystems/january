/**
 * Auto-Run Server Functions
 *
 * Server-side endpoints for managing local AI services.
 * These functions can spawn and monitor processes for Ollama (Portable), Whisper, and Piper.
 *
 * IMPORTANT: Now uses PORTABLE Ollama - no system installation required!
 */

import { createServerFn } from "@tanstack/react-start";
import { spawn } from "child_process";
import { autoRunService } from "../services/auto-run-service";
import { portableOllamaManager } from "../services/portable-ollama";

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
 * Now uses portable Ollama manager
 */
async function startOllama(): Promise<{
  name: string;
  success: boolean;
  running: boolean;
  pid?: number;
  error?: string;
}> {
  console.log('[AutoRun Server] Starting Portable Ollama...');

  try {
    // Check if portable Ollama is installed
    const isInstalled = portableOllamaManager.isInstalled();

    if (!isInstalled) {
      return {
        name: 'Ollama (Portable)',
        success: false,
        running: false,
        error: 'Portable Ollama not installed. Run installation first.',
      };
    }

    // Check if already running
    try {
      const ollamaCheck = await fetch('http://127.0.0.1:11434/api/tags', {
        signal: AbortSignal.timeout(5000),
      });

      if (ollamaCheck.ok) {
        console.log('[AutoRun Server] Ollama is already running');
        return {
          name: 'Ollama (Portable)',
          success: true,
          running: true,
        };
      }
    } catch (error) {
      console.log('[AutoRun Server] Ollama not running, starting...');
    }

    // Start portable Ollama
    const result = await portableOllamaManager.start();

    if (result.running) {
      console.log('[AutoRun Server] Portable Ollama started successfully');

      // Wait for Ollama to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify Ollama is responding
      try {
        const verifyCheck = await fetch('http://127.0.0.1:11434/api/tags', {
          signal: AbortSignal.timeout(10000),
        });

        if (verifyCheck.ok) {
          return {
            name: 'Ollama (Portable)',
            success: true,
            running: true,
          };
        }
      } catch (error) {
        console.error('[AutoRun Server] Ollama not responding:', error);
      }

      return {
        name: 'Ollama (Portable)',
        success: true,
        running: true,
      };
    }

    return {
      name: 'Ollama (Portable)',
      success: false,
      running: false,
      error: result.error || 'Failed to start Portable Ollama',
    };
  } catch (error) {
    console.error('[AutoRun Server] Failed to start Ollama:', error);
    return {
      name: 'Ollama (Portable)',
      success: false,
      running: false,
      error: error instanceof Error ? error.message : 'Failed to start Ollama',
    };
  }
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
 * Now reflects portable Ollama system
 */
export const getInstallationCommandsFn = createServerFn({ method: "GET" }).handler(() => {
  return {
    ollama: {
      install: 'AUTOMATIC - Uses Portable Ollama',
      description: 'No manual installation required - downloads automatically',
      start: 'Automatic - JANUARY starts portable Ollama',
      pullModel: 'Automatic - Use JANUARY interface to pull models',
      model: 'qwen2.5-coder:32b (recommended)',
      alternative: 'qwen2.5:7b (smaller model)',
    },
    portable: {
      description: 'PORTABLE OLLAMA - No system installation required!',
      features: [
        '✅ Downloads automatically on first use',
        '✅ Runs from JANUARY app directory',
        '✅ No admin privileges required',
        '✅ Works on macOS, Linux, Windows',
        '✅ Supports AMD64 and ARM64',
      ],
    },
    whisper: {
      install: 'pip install faster-whisper',
      start: 'faster-whisper-server --host 127.0.0.1 --port 8080',
      optional: true,
    },
    piper: {
      install: 'pip install piper-tts',
      start: 'piper-tts-server --host 127.0.0.1 --port 8081',
      optional: true,
    },
  };
});
