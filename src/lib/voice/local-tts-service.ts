/**
 * Local Text-to-Speech Service for JANUARY
 *
 * Local TTS using Piper or other local TTS engines.
 * This service provides high-quality female voice synthesis.
 *
 * JANUARY MUST use a FEMALE voice.
 *
 * Supported engines:
 * - Piper (preferred)
 * - Other compatible TTS servers
 */

export interface LocalTTSConfig {
  enabled: boolean;
  engine: 'piper' | 'espeak' | 'custom';
  voice: string;
  host: string;
  port: number;
  speed: number;
}

export interface LocalTTSResult {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

export interface LocalTTSVoice {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  language: string;
  quality: 'low' | 'medium' | 'high';
}

/**
 * Local TTS Service
 *
 * Responsibilities:
 * - speak(text): Synthesize speech using local TTS
 * - getVoices(): Get available voices
 * - setVoice(voice): Set female voice
 * - isAvailable(): Check if service is ready
 */
export class LocalTTSService {
  private config: LocalTTSConfig = {
    enabled: true,
    engine: 'piper',
    voice: 'en_US-amy-medium', // Default female voice
    host: '127.0.0.1',
    port: 8081, // Default Piper server port
    speed: 1.0,
  };

  private availableVoices: LocalTTSVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {};

  constructor() {
    // Load configuration from environment
    this.loadConfig();

    // Initialize default voices
    this.initializeVoices();
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): void {
    if (typeof process !== 'undefined' && process.env) {
      this.config.host = process.env.TTS_HOST || '127.0.0.1';
      this.config.port = parseInt(process.env.TTS_PORT || '8081');
      this.config.voice = process.env.TTS_VOICE || 'en_US-amy-medium';
      this.config.engine = (process.env.TTS_ENGINE as any) || 'piper';
    }
  }

  /**
   * Initialize available voices
   */
  private initializeVoices(): void {
    // Common Piper female voices
    this.availableVoices = [
      {
        id: 'en_US-amy-medium',
        name: 'Amy (Medium)',
        gender: 'female',
        language: 'en-US',
        quality: 'medium',
      },
      {
        id: 'en_US-amy-low',
        name: 'Amy (Low)',
        gender: 'female',
        language: 'en-US',
        quality: 'low',
      },
      {
        id: 'en_US-amy-high',
        name: 'Amy (High)',
        gender: 'female',
        language: 'en-US',
        quality: 'high',
      },
      {
        id: 'en_GB-jenny-medium',
        name: 'Jenny (Medium)',
        gender: 'female',
        language: 'en-GB',
        quality: 'medium',
      },
      {
        id: 'en_GB-jenny-low',
        name: 'Jenny (Low)',
        gender: 'female',
        language: 'en-GB',
        quality: 'low',
      },
    ];

    console.log('[LocalTTS] Initialized', this.availableVoices.length, 'voices');
  }

  /**
   * Speak text using local TTS
   */
  async speak(
    text: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    }
  ): Promise<LocalTTSResult> {
    console.log('[LocalTTS] speak called, enabled:', this.config.enabled, 'text length:', text.length);

    this.callbacks = callbacks || {};

    if (!this.config.enabled) {
      console.warn('[LocalTTS] Local TTS disabled');
      return { success: false, error: 'Local TTS is disabled' };
    }

    if (!text || text.trim().length === 0) {
      console.warn('[LocalTTS] No text to speak');
      return { success: false, error: 'No text to speak' };
    }

    // Stop current audio
    this.stop();

    try {
      this.callbacks.onStart?.();

      // Call local TTS service
      const result = await this.synthesizeSpeech(text);

      if (result.success && result.audioUrl) {
        // Play the audio
        await this.playAudio(result.audioUrl);
        return { success: true, audioUrl: result.audioUrl };
      } else {
        throw new Error(result.error || 'Failed to synthesize speech');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[LocalTTS] Speech error:', errorMessage);
      this.callbacks.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Synthesize speech using local TTS service
   */
  private async synthesizeSpeech(text: string): Promise<LocalTTSResult> {
    try {
      // Prepare request
      const ttsUrl = `http://${this.config.host}:${this.config.port}/api/tts`;

      const requestBody = {
        text: text,
        voice: this.config.voice,
        speed: this.config.speed,
      };

      console.log('[LocalTTS] Calling TTS service with voice:', this.config.voice);

      const response = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('[LocalTTS] Audio synthesized, size:', audioBlob.size);

      return { success: true, audioUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to synthesize speech';
      console.error('[LocalTTS] Synthesis error:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Play audio URL
   */
  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);

      this.currentAudio.onended = () => {
        console.log('[LocalTTS] Audio playback ended');
        this.callbacks.onEnd?.();
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        resolve();
      };

      this.currentAudio.onerror = (error) => {
        console.error('[LocalTTS] Audio playback error:', error);
        this.callbacks.onError?.('Audio playback failed');
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        reject(new Error('Audio playback failed'));
      };

      console.log('[LocalTTS] Starting audio playback');
      this.currentAudio.play();
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Get available female voices
   */
  getFemaleVoices(): LocalTTSVoice[] {
    return this.availableVoices.filter(v => v.gender === 'female');
  }

  /**
   * Get all available voices
   */
  getAllVoices(): LocalTTSVoice[] {
    return [...this.availableVoices];
  }

  /**
   * Set voice by ID
   */
  setVoice(voiceId: string): void {
    const voice = this.availableVoices.find(v => v.id === voiceId);
    if (voice) {
      if (voice.gender !== 'female') {
        console.warn('[LocalTTS] WARNING: Non-female voice selected:', voiceId);
      }
      this.config.voice = voiceId;
      console.log('[LocalTTS] Voice set to:', voice.name);
    } else {
      console.error('[LocalTTS] Voice not found:', voiceId);
    }
  }

  /**
   * Get current voice
   */
  getCurrentVoice(): LocalTTSVoice | null {
    return this.availableVoices.find(v => v.id === this.config.voice) || null;
  }

  /**
   * Get configuration
   */
  getConfig(): LocalTTSConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<LocalTTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable/disable local TTS
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const ttsUrl = `http://${this.config.host}:${this.config.port}/api/voices`;
      const response = await fetch(ttsUrl);
      return response.ok;
    } catch (error) {
      console.warn('[LocalTTS] Service not available:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    currentVoice: string;
    error?: string;
  }> {
    try {
      const available = await this.isAvailable();
      return {
        available,
        currentVoice: this.config.voice,
      };
    } catch (error) {
      return {
        available: false,
        currentVoice: this.config.voice,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reload voices from server
   */
  async reloadVoices(): Promise<void> {
    try {
      const ttsUrl = `http://${this.config.host}:${this.config.port}/api/voices`;
      const response = await fetch(ttsUrl);

      if (response.ok) {
        const data = await response.json();
        // Update voices if server provides them
        if (Array.isArray(data.voices)) {
          this.availableVoices = data.voices;
          console.log('[LocalTTS] Reloaded', this.availableVoices.length, 'voices from server');
        }
      }
    } catch (error) {
      console.warn('[LocalTTS] Failed to reload voices:', error);
    }
  }
}

// Singleton instance
export const localTTSService = new LocalTTSService();
