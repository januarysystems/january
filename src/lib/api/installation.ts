/**
 * Installation Server Functions
 *
 * Server-side endpoints for automatic installation of JANUARY dependencies.
 * These functions handle Ollama installation, model downloads, and setup.
 */

import { createServerFn } from "@tanstack/react-start";
import { installationManager } from "../services/install-manager";
import type { InstallationProgress } from "../services/install-manager";

// Store active installation progress for polling
let activeInstallation: {
  progress: InstallationProgress;
  results: any[];
  complete: boolean;
} | null = null;

/**
 * Server function to check all installation status
 */
export const checkInstallationStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  return await installationManager.checkAllComponents();
});

/**
 * Server function to perform automatic installation
 */
export const autoInstallFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[Installation Server] Starting automatic installation...');

  // Reset active installation
  activeInstallation = {
    progress: { step: '', progress: 0, message: '', status: 'running' },
    results: [],
    complete: false,
  };

  // Subscribe to progress
  installationManager.onProgress((progress) => {
    if (activeInstallation) {
      activeInstallation.progress = progress;
    }
  });

  try {
    const results = await installationManager.autoInstall();
    if (activeInstallation) {
      activeInstallation.results = results;
      activeInstallation.complete = true;
      activeInstallation.progress = {
        step: 'complete',
        progress: 100,
        message: 'Installation complete',
        status: 'completed',
      };
    }
    return { success: true, results };
  } catch (error) {
    if (activeInstallation) {
      activeInstallation.complete = true;
      activeInstallation.progress = {
        step: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Installation failed',
        status: 'error',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: activeInstallation?.results || [],
    };
  }
});

/**
 * Server function to get installation progress
 */
export const getInstallationProgressFn = createServerFn({ method: "GET" }).handler(() => {
  return activeInstallation || {
    progress: { step: '', progress: 0, message: 'No installation in progress', status: 'running' },
    results: [],
    complete: true,
  };
});

/**
 * Server function to install Ollama specifically
 */
export const installOllamaFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[Installation Server] Installing Ollama...');
  return await installationManager.installOllama();
});

/**
 * Server function to pull the Qwen3-Coder model
 */
export const pullModelFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { model?: string };
    return { model: body.model || 'qwen3-coder:30b' };
  })
  .handler(async ({ data }) => {
    console.log('[Installation Server] Pulling model:', data.model);
    return await installationManager.pullModel(data.model);
  });

/**
 * Server function to install Whisper
 */
export const installWhisperFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[Installation Server] Installing Whisper...');
  return await installationManager.installWhisper();
});

/**
 * Server function to install Piper
 */
export const installPiperFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[Installation Server] Installing Piper...');
  return await installationManager.installPiper();
});

/**
 * Server function to get installation commands
 */
export const getInstallationHelpFn = createServerFn({ method: "GET" }).handler(() => {
  const platform = process.platform;

  return {
    ollama: {
      ...platform === 'darwin' ? {
        install: 'brew install ollama',
        description: 'Install via Homebrew (macOS)',
      } : platform === 'linux' ? {
        install: 'curl -fsSL https://ollama.com/install.sh | sh',
        description: 'Install via official script (Linux)',
      } : {
        install: 'Download from https://ollama.com',
        description: 'Download installer for Windows',
      },
      start: 'ollama serve',
      pullModel: 'ollama pull qwen3-coder:30b',
      verify: 'ollama list',
    },
    model: {
      name: 'qwen3-coder:30b',
      pull: 'ollama pull qwen3-coder:30b',
      size: '~18GB',
      description: '30B parameter model for coding and technical assistance',
    },
    whisper: {
      install: 'pip install faster-whisper',
      description: 'Speech-to-text engine (optional)',
      start: 'faster-whisper-server --host 127.0.0.1 --port 8080',
    },
    piper: {
      install: 'pip install piper-tts',
      description: 'Text-to-speech engine with female voices (optional)',
      start: 'piper-tts-server --host 127.0.0.1 --port 8081',
      femaleVoices: ['en_US-amy-medium', 'en_US-amy-low', 'en_GB-jenny-medium'],
    },
    platform,
    quickStart: [
      'npm install',
      'npm run dev',
      'Open http://localhost:8080',
      'JANUARY will auto-install Ollama on first run!',
    ],
  };
});