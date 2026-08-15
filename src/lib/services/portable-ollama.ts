/**
 * Portable Ollama Manager for JANUARY
 *
 * This service manages a portable/bundled Ollama installation that:
 * - Downloads Ollama binaries for the current platform
 * - Stores them locally within the application
 * - Launches Ollama from the bundled location
 * - Works without system-level installation
 * - Stores models in the app directory
 *
 * This makes JANUARY truly portable across different systems.
 */

import { spawn, ChildProcess } from 'child_process';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { chmod } from 'fs/promises';
import { platform, arch } from 'os';
import { join, dirname } from 'path';
import { homedir } from 'os';
import https from 'https';
import http from 'http';

export interface PortableOllamaConfig {
  storageDir: string;
  binariesDir: string;
  modelsDir: string;
  downloadUrl: string;
}

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  speed: number;
  status: 'downloading' | 'extracting' | 'complete' | 'error';
}

export interface PortableOllamaStatus {
  installed: boolean;
  running: boolean;
  version?: string;
  platform: string;
  architecture: string;
  error?: string;
}

/**
 * Portable Ollama Manager
 *
 * Downloads and manages portable Ollama binaries
 */
export class PortableOllamaManager {
  private config: PortableOllamaConfig;
  private ollamaProcess: ChildProcess | null = null;
  private currentPlatform: string;
  private currentArch: string;
  private progressCallback: ((progress: DownloadProgress) => void) | null = null;

  constructor() {
    this.currentPlatform = this.detectPlatform();
    this.currentArch = this.detectArchitecture();

    // Set up storage directories
    const appDataDir = this.getAppDataDir();
    this.config = {
      storageDir: join(appDataDir, 'january-ollama'),
      binariesDir: join(appDataDir, 'january-ollama', 'binaries'),
      modelsDir: join(appDataDir, 'january-ollama', 'models'),
      downloadUrl: this.getDownloadUrl(),
    };

    console.log('[PortableOllama] Initializing with config:', {
      platform: this.currentPlatform,
      arch: this.currentArch,
      storageDir: this.config.storageDir,
    });
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): string {
    const p = platform();
    switch (p) {
      case 'darwin': return 'darwin';
      case 'win32': return 'windows';
      case 'linux': return 'linux';
      default: throw new Error(`Unsupported platform: ${p}`);
    }
  }

  /**
   * Detect current architecture
   */
  private detectArchitecture(): string {
    const a = arch();
    switch (a) {
      case 'x64': return 'amd64';
      case 'arm64': return 'arm64';
      case 'arm': return 'arm';
      default: throw new Error(`Unsupported architecture: ${a}`);
    }
  }

  /**
   * Get application data directory
   */
  private getAppDataDir(): string {
    const p = platform();
    const baseDir = p === 'win32'
      ? process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local')
      : p === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');

    return join(baseDir, 'january');
  }

  /**
   * Get Ollama download URL for current platform
   */
  private getDownloadUrl(): string {
    const version = '0.1.26'; // Current stable version
    const platform = this.currentPlatform;
    const arch = this.currentArch;

    // Ollama's binary URLs follow a pattern
    const baseUrl = 'https://github.com/ollama/ollama/releases/download';

    switch (platform) {
      case 'darwin':
        return `${baseUrl}/v${version}/ollama-darwin-${arch}`;
      case 'linux':
        return `${baseUrl}/v${version}/ollama-linux-${arch}`;
      case 'windows':
        // Windows uses a different structure
        return `${baseUrl}/v${version}/ollama-windows-${arch}.zip`;
      default:
        throw new Error(`No download URL for platform: ${platform}`);
    }
  }

  /**
   * Ensure directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      this.config.storageDir,
      this.config.binariesDir,
      this.config.modelsDir,
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log('[PortableOllama] Created directory:', dir);
      }
    }
  }

  /**
   * Check if portable Ollama is installed
   */
  isInstalled(): boolean {
    const binaryPath = this.getBinaryPath();
    return existsSync(binaryPath);
  }

  /**
   * Get path to Ollama binary
   */
  private getBinaryPath(): string {
    const platform = this.currentPlatform;
    const arch = this.currentArch;

    switch (platform) {
      case 'darwin':
      case 'linux':
        return join(this.config.binariesDir, 'ollama');
      case 'windows':
        return join(this.config.binariesDir, 'ollama.exe');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Download file with progress tracking
   */
  private async downloadFile(
    url: string,
    destination: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = createWriteStream(destination);
      let bytesDownloaded = 0;
      let totalBytes = 0;
      let lastUpdate = Date.now();
      let lastBytes = 0;

      protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect without location'));
            file.close();
            return;
          }
          file.close();
          this.downloadFile(redirectUrl, destination).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          file.close();
          return;
        }

        totalBytes = parseInt(response.headers['content-length'] || '0', 10);

        response.pipe(file);

        response.on('data', (chunk) => {
          bytesDownloaded += chunk.length;

          // Update progress every 100ms
          const now = Date.now();
          if (now - lastUpdate > 100) {
            const speed = (bytesDownloaded - lastBytes) / ((now - lastUpdate) / 1000);
            lastBytes = bytesDownloaded;
            lastUpdate = now;

            if (this.progressCallback) {
              this.progressCallback({
                bytesDownloaded,
                totalBytes,
                percentage: totalBytes > 0 ? (bytesDownloaded / totalBytes) * 100 : 0,
                speed: speed * 8 / 1000000, // Convert to Mbps
                status: 'downloading',
              });
            }
          }
        });

        file.on('finish', () => {
          file.close();
          if (this.progressCallback) {
            this.progressCallback({
              bytesDownloaded,
              totalBytes,
              percentage: 100,
              speed: 0,
              status: 'complete',
            });
          }
          resolve();
        });
      }).on('error', (err) => {
        file.close();
        reject(err);
      });
    });
  }

  /**
   * Download and install portable Ollama
   */
  async install(
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<PortableOllamaStatus> {
    this.progressCallback = onProgress || null;
    this.ensureDirectories();

    console.log('[PortableOllama] Starting installation...');

    try {
      const downloadUrl = this.config.downloadUrl;
      const binaryPath = this.getBinaryPath();

      console.log('[PortableOllama] Downloading from:', downloadUrl);
      console.log('[PortableOllama] To:', binaryPath);

      // Download binary
      await this.downloadFile(downloadUrl, binaryPath);

      // Make binary executable on Unix systems
      if (this.currentPlatform !== 'windows') {
        await chmod(binaryPath, 0o755);
        console.log('[PortableOllama] Made binary executable');
      }

      console.log('[PortableOllama] Installation complete!');

      return {
        installed: true,
        running: false,
        platform: this.currentPlatform,
        architecture: this.currentArch,
      };
    } catch (error) {
      console.error('[PortableOllama] Installation failed:', error);
      return {
        installed: false,
        running: false,
        platform: this.currentPlatform,
        architecture: this.currentArch,
        error: error instanceof Error ? error.message : 'Installation failed',
      };
    }
  }

  /**
   * Start portable Ollama
   */
  async start(): Promise<PortableOllamaStatus> {
    if (!this.isInstalled()) {
      return {
        installed: false,
        running: false,
        platform: this.currentPlatform,
        architecture: this.currentArch,
        error: 'Ollama is not installed',
      };
    }

    if (this.ollamaProcess) {
      console.log('[PortableOllama] Ollama is already running');
      return {
        installed: true,
        running: true,
        platform: this.currentPlatform,
        architecture: this.currentArch,
      };
    }

    const binaryPath = this.getBinaryPath();

    // Set environment variables for local model storage
    const env = {
      ...process.env,
      OLLAMA_MODELS: this.config.modelsDir,
      OLLAMA_HOST: '127.0.0.1:11434',
    };

    console.log('[PortableOllama] Starting Ollama...');
    console.log('[PortableOllama] Binary:', binaryPath);
    console.log('[PortableOllama] Models dir:', this.config.modelsDir);

    try {
      this.ollamaProcess = spawn(binaryPath, ['serve'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.ollamaProcess.stdout?.on('data', (data) => {
        console.log('[PortableOllama]', data.toString().trim());
      });

      this.ollamaProcess.stderr?.on('data', (data) => {
        console.error('[PortableOllama]', data.toString().trim());
      });

      this.ollamaProcess.on('close', (code) => {
        console.log('[PortableOllama] Process exited with code:', code);
        this.ollamaProcess = null;
      });

      this.ollamaProcess.on('error', (error) => {
        console.error('[PortableOllama] Process error:', error);
        this.ollamaProcess = null;
      });

      // Wait a moment for the process to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        installed: true,
        running: true,
        platform: this.currentPlatform,
        architecture: this.currentArch,
      };
    } catch (error) {
      console.error('[PortableOllama] Failed to start:', error);
      return {
        installed: true,
        running: false,
        platform: this.currentPlatform,
        architecture: this.currentArch,
        error: error instanceof Error ? error.message : 'Failed to start Ollama',
      };
    }
  }

  /**
   * Stop portable Ollama
   */
  async stop(): Promise<void> {
    if (this.ollamaProcess) {
      console.log('[PortableOllama] Stopping Ollama...');
      this.ollamaProcess.kill('SIGTERM');

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.ollamaProcess) {
        this.ollamaProcess.kill('SIGKILL');
      }

      this.ollamaProcess = null;
      console.log('[PortableOllama] Stopped');
    }
  }

  /**
   * Get status
   */
  getStatus(): PortableOllamaStatus {
    return {
      installed: this.isInstalled(),
      running: this.ollamaProcess !== null,
      platform: this.currentPlatform,
      architecture: this.currentArch,
    };
  }

  /**
   * Get models directory
   */
  getModelsDir(): string {
    return this.config.modelsDir;
  }

  /**
   * Get storage directory
   */
  getStorageDir(): string {
    return this.config.storageDir;
  }

  /**
   * Execute Ollama command
   */
  async executeCommand(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
    const binaryPath = this.getBinaryPath();

    return new Promise((resolve, reject) => {
      const process = spawn(binaryPath, args, {
        env: {
          ...process.env,
          OLLAMA_MODELS: this.config.modelsDir,
        },
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({ stdout, stderr, code });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get installed models
   */
  async getInstalledModels(): Promise<string[]> {
    try {
      const { stdout } = await this.executeCommand(['list']);
      const lines = stdout.trim().split('\n').slice(1); // Skip header
      return lines.map(line => line.split(/\s+/)[0]).filter(Boolean);
    } catch (error) {
      console.error('[PortableOllama] Failed to list models:', error);
      return [];
    }
  }

  /**
   * Pull a model
   */
  async pullModel(model: string, onProgress?: (progress: DownloadProgress) => void): Promise<void> {
    console.log('[PortableOllama] Pulling model:', model);

    // Note: This would require streaming parsing of Ollama's output
    // For now, we'll do a simple pull
    await this.executeCommand(['pull', model]);
  }
}

// Singleton instance
export const portableOllamaManager = new PortableOllamaManager();
