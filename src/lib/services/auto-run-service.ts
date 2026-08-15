/**
 * Auto-Run Service for JANUARY Local Services
 *
 * Manages automatic startup and monitoring of local AI services:
 * - Ollama (Local AI) - Now using portable/bundled version
 * - Whisper (Speech-to-Text)
 * - Piper (Text-to-Speech)
 *
 * This service can automatically start these services when JANUARY launches
 * if they are not already running.
 */

import { portableOllamaManager } from './portable-ollama';

export interface ServiceConfig {
  name: string;
  command: string;
  args: string[];
  workingDir?: string;
  env?: Record<string, string>;
  checkUrl?: string;
  startupDelay?: number; // milliseconds
  healthCheckTimeout?: number; // milliseconds
}

export interface ServiceStatus {
  name: string;
  running: boolean;
  autoStarted: boolean;
  pid?: number;
  port?: number;
  error?: string;
  startTime?: Date;
}

export interface AutoRunConfig {
  enabled: boolean;
  services: {
    ollama: boolean;
    whisper: boolean;
    piper: boolean;
  };
  autoStart: boolean; // Auto-start on JANUARY launch
}

/**
 * Auto-Run Service Manager
 *
 * Responsibilities:
 * - Detect if services are running
 * - Automatically start services if enabled
 * - Monitor service health
 * - Provide service status
 * - Handle service shutdown
 */
export class AutoRunService {
  private config: AutoRunConfig = {
    enabled: true,
    services: {
      ollama: true,
      whisper: false, // Disabled by default (optional)
      piper: false, // Disabled by default (optional)
    },
    autoStart: true,
  };

  private runningProcesses: Map<string, any> = new Map();
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadConfig();
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): void {
    if (typeof process !== 'undefined' && process.env) {
      this.config.enabled = process.env.AUTO_RUN_ENABLED !== 'false';
      this.config.autoStart = process.env.AUTO_START_SERVICES !== 'false';
      this.config.services.ollama = process.env.AUTO_RUN_OLLAMA !== 'false';
      this.config.services.whisper = process.env.AUTO_RUN_WHISPER === 'true';
      this.config.services.piper = process.env.AUTO_RUN_PIPER === 'true';
    }
  }

  /**
   * Get service configurations
   */
  private getServiceConfigs(): Record<string, ServiceConfig> {
    return {
      ollama: {
        name: 'Ollama',
        command: 'ollama',
        args: ['serve'],
        checkUrl: 'http://127.0.0.1:11434/api/tags',
        startupDelay: 2000,
        healthCheckTimeout: 5000,
      },
      whisper: {
        name: 'Whisper',
        command: 'faster-whisper-server',
        args: ['--host', '127.0.0.1', '--port', '8080'],
        checkUrl: 'http://127.0.0.1:8080/v1/models',
        startupDelay: 3000,
        healthCheckTimeout: 10000,
      },
      piper: {
        name: 'Piper TTS',
        command: 'piper-tts-server',
        args: ['--host', '127.0.0.1', '--port', '8081'],
        checkUrl: 'http://127.0.0.1:8081/api/voices',
        startupDelay: 3000,
        healthCheckTimeout: 10000,
      },
    };
  }

  /**
   * Check if a service is running by testing its endpoint
   */
  private async checkServiceRunning(config: ServiceConfig): Promise<boolean> {
    if (!config.checkUrl) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.healthCheckTimeout || 5000);

      const response = await fetch(config.checkUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start a service
   *
   * Now uses portable Ollama manager for the Ollama service
   */
  async startService(serviceKey: string): Promise<ServiceStatus> {
    const configs = this.getServiceConfigs();
    const config = configs[serviceKey];

    if (!config) {
      return {
        name: serviceKey,
        running: false,
        autoStarted: false,
        error: 'Unknown service',
      };
    }

    // Handle Ollama with portable manager
    if (serviceKey === 'ollama') {
      const isInstalled = portableOllamaManager.isInstalled();

      if (!isInstalled) {
        const status: ServiceStatus = {
          name: config.name,
          running: false,
          autoStarted: false,
          error: 'Portable Ollama not installed. Run installation first.',
        };
        this.serviceStatus.set(serviceKey, status);
        return status;
      }

      // Check if already running
      const alreadyRunning = await this.checkServiceRunning(config);
      if (alreadyRunning) {
        const status: ServiceStatus = {
          name: config.name,
          running: true,
          autoStarted: false,
        };
        this.serviceStatus.set(serviceKey, status);
        return status;
      }

      // Start portable Ollama
      const result = await portableOllamaManager.start();
      const status: ServiceStatus = {
        name: config.name,
        running: result.running,
        autoStarted: result.running,
        error: result.error,
      };
      this.serviceStatus.set(serviceKey, status);
      return status;
    }

    // For other services (Whisper, Piper), keep the old behavior
    const alreadyRunning = await this.checkServiceRunning(config);
    if (alreadyRunning) {
      const status: ServiceStatus = {
        name: config.name,
        running: true,
        autoStarted: false,
      };
      this.serviceStatus.set(serviceKey, status);
      return status;
    }

    // Server-side only: Cannot spawn processes from browser
    const status: ServiceStatus = {
      name: config.name,
      running: false,
      autoStarted: false,
      error: 'Auto-start requires server-side execution. Use server endpoint.',
    };

    this.serviceStatus.set(serviceKey, status);
    return status;
  }

  /**
   * Auto-start all enabled services
   */
  async autoStartServices(): Promise<ServiceStatus[]> {
    if (!this.config.enabled || !this.config.autoStart) {
      console.log('[AutoRun] Auto-start is disabled');
      return [];
    }

    console.log('[AutoRun] Auto-starting local services...');
    const results: ServiceStatus[] = [];

    for (const [key, enabled] of Object.entries(this.config.services)) {
      if (enabled) {
        console.log(`[AutoRun] Checking ${key}...`);
        const status = await this.startService(key);
        results.push(status);

        if (status.running) {
          console.log(`[AutoRun] ${key} is running`);
        } else {
          console.warn(`[AutoRun] ${key} failed to start:`, status.error);
        }

        // Add delay between services
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get status of all services
   */
  async getAllServiceStatus(): Promise<Record<string, ServiceStatus>> {
    const configs = this.getServiceConfigs();
    const results: Record<string, ServiceStatus> = {};

    for (const [key, config] of Object.entries(configs)) {
      const running = await this.checkServiceRunning(config);
      results[key] = {
        name: config.name,
        running,
        autoStarted: this.serviceStatus.get(key)?.autoStarted || false,
      };
    }

    return results;
  }

  /**
   * Get configuration
   */
  getConfig(): AutoRunConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<AutoRunConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Stop all auto-started services
   */
  async stopAllServices(): Promise<void> {
    console.log('[AutoRun] Stopping all auto-started services...');

    for (const [key, status] of this.serviceStatus) {
      if (status.autoStarted && status.pid) {
        try {
          // Server-side only: kill process
          console.log(`[AutoRun] Stopping ${key} (PID: ${status.pid})`);
        } catch (error) {
          console.error(`[AutoRun] Failed to stop ${key}:`, error);
        }
      }
    }

    this.serviceStatus.clear();
    this.runningProcesses.clear();

    // Clear health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }

  /**
   * Start health monitoring for services
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    // Clear existing intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }

    // Monitor each service
    const configs = this.getServiceConfigs();
    for (const [key, config] of Object.entries(configs)) {
      if (!config.checkUrl) continue;

      const interval = setInterval(async () => {
        const running = await this.checkServiceRunning(config);
        console.log(`[AutoRun] Health check ${key}:`, running ? 'OK' : 'FAILED');

        if (!running && this.serviceStatus.get(key)?.autoStarted) {
          console.warn(`[AutoRun] ${key} stopped unexpectedly`);
          // Could implement auto-restart here
        }
      }, intervalMs);

      this.healthCheckIntervals.set(key, interval);
    }
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    this.healthCheckIntervals.clear();
  }
}

// Singleton instance
export const autoRunService = new AutoRunService();
