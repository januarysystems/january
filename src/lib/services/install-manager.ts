/**
 * JANUARY Installation Manager
 *
 * Automatically detects, installs, and configures all required services:
 * - Ollama (if not installed)
 * - Qwen3-Coder 30B model (if not pulled)
 * - Whisper (optional, for voice input)
 * - Piper (optional, for female voice output)
 *
 * Makes JANUARY truly "just run npm install && npm run dev"
 */

import { spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(require('child_process').exec);

export interface InstallationStatus {
  component: string;
  installed: boolean;
  version?: string;
  error?: string;
  actionRequired?: boolean;
}

export interface InstallationProgress {
  step: string;
  progress: number;
  message: string;
  status: 'running' | 'completed' | 'error' | 'cancelled';
}

export interface InstallationConfig {
  autoInstallOllama: boolean;
  autoPullModel: boolean;
  autoInstallWhisper: boolean;
  autoInstallPiper: boolean;
  confirmBeforeInstall: boolean;
}

/**
 * Installation Manager
 *
 * Detects what's missing and handles installation automatically
 */
export class InstallationManager {
  private config: InstallationConfig = {
    autoInstallOllama: true,
    autoPullModel: true,
    autoInstallWhisper: false, // Optional
    autoInstallPiper: false, // Optional
    confirmBeforeInstall: true,
  };

  private progressCallbacks: ((progress: InstallationProgress) => void)[] = [];

  constructor() {
    this.loadConfig();
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): void {
    if (typeof process !== 'undefined' && process.env) {
      this.config.autoInstallOllama = process.env.AUTO_INSTALL_OLLAMA !== 'false';
      this.config.autoPullModel = process.env.AUTO_PULL_MODEL !== 'false';
      this.config.autoInstallWhisper = process.env.AUTO_INSTALL_WHISPER === 'true';
      this.config.autoInstallPiper = process.env.AUTO_INSTALL_PIPER === 'true';
      this.config.confirmBeforeInstall = process.env.CONFIRM_INSTALL !== 'false';
    }
  }

  /**
   * Report progress
   */
  private reportProgress(step: string, progress: number, message: string, status: InstallationProgress['status']) {
    const update: InstallationProgress = { step, progress, message, status };
    this.progressCallbacks.forEach(callback => callback(update));
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (progress: InstallationProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  offProgress(callback: (progress: InstallationProgress) => void): void {
    const index = this.progressCallbacks.indexOf(callback);
    if (index > -1) {
      this.progressCallbacks.splice(index, 1);
    }
  }

  /**
   * Check if Ollama is installed
   */
  async checkOllamaInstalled(): Promise<InstallationStatus> {
    try {
      const { stdout } = await execAsync('ollama --version');
      const version = stdout.trim();
      console.log('[InstallManager] Ollama installed:', version);
      return {
        component: 'Ollama',
        installed: true,
        version,
      };
    } catch (error) {
      console.log('[InstallManager] Ollama not installed');
      return {
        component: 'Ollama',
        installed: false,
        actionRequired: true,
        error: 'Ollama is not installed',
      };
    }
  }

  /**
   * Install Ollama automatically
   */
  async installOllama(): Promise<InstallationStatus> {
    this.reportProgress('ollama-install', 0, 'Starting Ollama installation...', 'running');

    try {
      const platform = process.platform;
      let installCommand: string;

      if (platform === 'darwin') {
        // macOS - use Homebrew
        this.reportProgress('ollama-install', 10, 'Installing Ollama via Homebrew...', 'running');

        // Check if Homebrew is installed
        try {
          await execAsync('brew --version');
        } catch (error) {
          this.reportProgress('ollama-install', 5, 'Homebrew not found. Installing Homebrew first...', 'running');
          await this.installHomebrew();
        }

        installCommand = 'brew install ollama';
        this.reportProgress('ollama-install', 20, 'Running: brew install ollama', 'running');

      } else if (platform === 'linux') {
        // Linux - use official install script
        this.reportProgress('ollama-install', 20, 'Installing Ollama via official script...', 'running');
        installCommand = 'curl -fsSL https://ollama.com/install.sh | sh';

      } else {
        return {
          component: 'Ollama',
          installed: false,
          error: 'Automatic installation not supported on Windows. Please download from https://ollama.com',
          actionRequired: true,
        };
      }

      // Execute installation
      await execAsync(installCommand, {
        env: { ...process.env, NONINTERACTIVE: '1' },
      });

      this.reportProgress('ollama-install', 90, 'Verifying installation...', 'running');

      // Verify installation
      const check = await this.checkOllamaInstalled();
      if (check.installed) {
        this.reportProgress('ollama-install', 100, 'Ollama installed successfully!', 'completed');
        return check;
      }

      return {
        component: 'Ollama',
        installed: false,
        error: 'Installation verification failed',
        actionRequired: true,
      };

    } catch (error) {
      this.reportProgress('ollama-install', 0, 'Ollama installation failed', 'error');
      return {
        component: 'Ollama',
        installed: false,
        error: error instanceof Error ? error.message : 'Installation failed',
        actionRequired: true,
      };
    }
  }

  /**
   * Install Homebrew (for macOS)
   */
  private async installHomebrew(): Promise<void> {
    this.reportProgress('homebrew-install', 0, 'Installing Homebrew...', 'running');

    const installCommand = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';

    try {
      await execAsync(installCommand, {
        env: { ...process.env, NONINTERACTIVE: '1' },
      });
      this.reportProgress('homebrew-install', 100, 'Homebrew installed!', 'completed');
    } catch (error) {
      throw new Error('Failed to install Homebrew');
    }
  }

  /**
   * Check if model is available
   */
  async checkModelInstalled(model: string = 'qwen3-coder:30b'): Promise<InstallationStatus> {
    try {
      const { stdout } = await execAsync('ollama list');
      const models = stdout.trim();
      const modelInstalled = models.includes(model);

      console.log('[InstallManager] Model', model, 'installed:', modelInstalled);

      return {
        component: `Model (${model})`,
        installed: modelInstalled,
        actionRequired: !modelInstalled,
      };
    } catch (error) {
      return {
        component: `Model (${model})`,
        installed: false,
        error: 'Cannot check models - Ollama not running',
        actionRequired: true,
      };
    }
  }

  /**
   * Pull Ollama model
   */
  async pullModel(model: string = 'qwen3-coder:30b'): Promise<InstallationStatus> {
    this.reportProgress('model-pull', 0, `Pulling ${model}...`, 'running');

    try {
      this.reportProgress('model-pull', 10, 'Starting model download (this may take a while)...', 'running');

      const modelProcess = spawn('ollama', ['pull', model]);

      return new Promise((resolve) => {
        let progress = 10;

        modelProcess.stdout?.on('data', (data) => {
          const output = data.toString();
          console.log('[InstallManager] Pull progress:', output);

          // Update progress based on output
          if (output.includes('%')) {
            const match = output.match(/(\d+)%/);
            if (match) {
              progress = 10 + parseInt(match[1]) * 0.8;
              this.reportProgress('model-pull', progress, `Downloading model: ${Math.round(progress)}%`, 'running');
            }
          }
        });

        modelProcess.stderr?.on('data', (data) => {
          console.log('[InstallManager] Pull error:', data.toString());
        });

        modelProcess.on('close', async (code) => {
          if (code === 0) {
            this.reportProgress('model-pull', 100, 'Model downloaded successfully!', 'completed');
            const check = await this.checkModelInstalled(model);
            resolve(check);
          } else {
            this.reportProgress('model-pull', 0, 'Model download failed', 'error');
            resolve({
              component: `Model (${model})`,
              installed: false,
              error: `Download failed with code ${code}`,
              actionRequired: true,
            });
          }
        });

        modelProcess.on('error', (error) => {
          this.reportProgress('model-pull', 0, 'Model download failed', 'error');
          resolve({
            component: `Model (${model})`,
            installed: false,
            error: error.message,
            actionRequired: true,
          });
        });
      });

    } catch (error) {
      this.reportProgress('model-pull', 0, 'Model download failed', 'error');
      return {
        component: `Model (${model})`,
        installed: false,
        error: error instanceof Error ? error.message : 'Download failed',
        actionRequired: true,
      };
    }
  }

  /**
   * Check if Whisper is installed
   */
  async checkWhisperInstalled(): Promise<InstallationStatus> {
    try {
      const { stdout } = await execAsync('pip show faster-whisper');
      return {
        component: 'Whisper',
        installed: true,
      };
    } catch (error) {
      return {
        component: 'Whisper',
        installed: false,
        actionRequired: true,
      };
    }
  }

  /**
   * Install Whisper
   */
  async installWhisper(): Promise<InstallationStatus> {
    this.reportProgress('whisper-install', 0, 'Installing Whisper...', 'running');

    try {
      await execAsync('pip install faster-whisper', {
        env: { ...process.env },
      });

      this.reportProgress('whisper-install', 100, 'Whisper installed!', 'completed');
      return await this.checkWhisperInstalled();
    } catch (error) {
      this.reportProgress('whisper-install', 0, 'Whisper installation failed', 'error');
      return {
        component: 'Whisper',
        installed: false,
        error: error instanceof Error ? error.message : 'Installation failed',
        actionRequired: true,
      };
    }
  }

  /**
   * Check if Piper is installed
   */
  async checkPiperInstalled(): Promise<InstallationStatus> {
    try {
      const { stdout } = await execAsync('pip show piper-tts');
      return {
        component: 'Piper',
        installed: true,
      };
    } catch (error) {
      return {
        component: 'Piper',
        installed: false,
        actionRequired: true,
      };
    }
  }

  /**
   * Install Piper
   */
  async installPiper(): Promise<InstallationStatus> {
    this.reportProgress('piper-install', 0, 'Installing Piper TTS...', 'running');

    try {
      await execAsync('pip install piper-tts', {
        env: { ...process.env },
      });

      this.reportProgress('piper-install', 100, 'Piper installed!', 'completed');
      return await this.checkPiperInstalled();
    } catch (error) {
      this.reportProgress('piper-install', 0, 'Piper installation failed', 'error');
      return {
        component: 'Piper',
        installed: false,
        error: error instanceof Error ? error.message : 'Installation failed',
        actionRequired: true,
      };
    }
  }

  /**
   * Complete installation check
   */
  async checkAllComponents(): Promise<InstallationStatus[]> {
    const results: InstallationStatus[] = [];

    // Check Ollama
    results.push(await this.checkOllamaInstalled());

    // Check Model (if Ollama is installed)
    const ollamaStatus = results[0];
    if (ollamaStatus.installed) {
      results.push(await this.checkModelInstalled());
    }

    // Check optional components
    if (this.config.autoInstallWhisper) {
      results.push(await this.checkWhisperInstalled());
    }

    if (this.config.autoInstallPiper) {
      results.push(await this.checkPiperInstalled());
    }

    return results;
  }

  /**
   * Perform automatic installation
   */
  async autoInstall(): Promise<InstallationStatus[]> {
    console.log('[InstallManager] Starting automatic installation...');
    const results: InstallationStatus[] = [];

    // 1. Install Ollama if needed
    const ollamaStatus = await this.checkOllamaInstalled();
    results.push(ollamaStatus);

    if (!ollamaStatus.installed && this.config.autoInstallOllama) {
      console.log('[InstallManager] Installing Ollama...');
      const installResult = await this.installOllama();
      results[0] = installResult;

      if (!installResult.installed) {
        return results; // Stop if Ollama installation fails
      }
    }

    // 2. Pull model if needed
    const modelStatus = await this.checkModelInstalled();
    results.push(modelStatus);

    if (!modelStatus.installed && this.config.autoPullModel) {
      console.log('[InstallManager] Pulling model...');
      const pullResult = await this.pullModel();
      results[1] = pullResult;
    }

    // 3. Install optional components
    if (this.config.autoInstallWhisper) {
      const whisperStatus = await this.checkWhisperInstalled();
      results.push(whisperStatus);

      if (!whisperStatus.installed) {
        console.log('[InstallManager] Installing Whisper...');
        const installResult = await this.installWhisper();
        results[results.length - 1] = installResult;
      }
    }

    if (this.config.autoInstallPiper) {
      const piperStatus = await this.checkPiperInstalled();
      results.push(piperStatus);

      if (!piperStatus.installed) {
        console.log('[InstallManager] Installing Piper...');
        const installResult = await this.installPiper();
        results[results.length - 1] = installResult;
      }
    }

    console.log('[InstallManager] Automatic installation complete');
    return results;
  }

  /**
   * Get configuration
   */
  getConfig(): InstallationConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<InstallationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
export const installationManager = new InstallationManager();
