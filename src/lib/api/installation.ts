/**
 * Installation Server Functions
 *
 * Server-side endpoints for automatic installation of JANUARY dependencies.
 * These functions handle Portable Ollama installation, model downloads, and setup.
 *
 * IMPORTANT: Now uses PORTABLE Ollama - no system installation required!
 * All binaries are downloaded and managed within the JANUARY application.
 */

import { createServerFn } from "@tanstack/react-start";
import { installationManager } from "../services/install-manager";
import { portableOllamaManager } from "../services/portable-ollama";
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
 * Server function to pull the Qwen2.5-Coder model
 */
export const pullModelFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const body = data as { model?: string };
    return { model: body.model || 'qwen2.5-coder:32b' };
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
 * Server function to get installation help
 * Now reflects portable Ollama system
 */
export const getInstallationHelpFn = createServerFn({ method: "GET" }).handler(() => {
  const platform = process.platform;

  return {
    ollama: {
      install: 'AUTOMATIC - Portable Ollama downloads on first use',
      description: 'Portable Ollama - No system installation required!',
      type: 'portable',
      platforms: ['darwin', 'linux', 'windows'],
      architectures: ['amd64', 'arm64'],
    },
    model: {
      name: 'qwen2.5-coder:32b',
      pull: 'Automatic download via JANUARY',
      size: '~19GB',
      description: '32B parameter model for coding and technical assistance',
      alternative: 'qwen2.5:7b (smaller, ~4GB)',
    },
    portable: {
      description: 'PORTABLE OLLAMA SYSTEM',
      features: [
        '✅ No system-level installation required',
        '✅ Downloads binaries for your platform automatically',
        '✅ Stores everything in JANUARY app directory',
        '✅ Works on macOS, Linux, and Windows',
        '✅ Supports both AMD64 and ARM64 architectures',
      ],
      storage: platform === 'win32'
        ? '%LOCALAPPDATA%\\january\\january-ollama'
        : platform === 'darwin'
        ? '~/Library/Application Support/january/january-ollama'
        : '~/.local/share/january/january-ollama',
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
      'JANUARY will download portable Ollama on first run!',
    ],
  };
});

/**
 * Server function to get portable Ollama status
 */
export const getPortableOllamaStatusFn = createServerFn({ method: "GET" }).handler(() => {
  const status = portableOllamaManager.getStatus();
  const installedModels = portableOllamaManager.getInstalledModels();

  return {
    ...status,
    models: installedModels,
    storageDir: portableOllamaManager.getStorageDir(),
    modelsDir: portableOllamaManager.getModelsDir(),
  };
});

/**
 * Server function to start portable Ollama
 */
export const startPortableOllamaFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[Installation Server] Starting portable Ollama...');
  const result = await portableOllamaManager.start();
  return result;
});

/**
 * Server function to stop portable Ollama
 */
export const stopPortableOllamaFn = createServerFn({ method: "POST" }).handler(async () => {
  console.log('[Installation Server] Stopping portable Ollama...');
  await portableOllamaManager.stop();
  return { success: true };
});