/**
 * Speech Recognition Service
 *
 * Provides browser-native speech recognition with proper error handling.
 * Uses Web Speech API (SpeechRecognition) which requires internet connection
 * to browser speech recognition servers (Google, Microsoft, or Apple).
 *
 * IMPORTANT: This service depends on browser SpeechRecognition API availability.
 * It does NOT include a fallback transcription service - that would require
 * a separate speech-to-text API provider.
 */

export interface SpeechRecognitionConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export type SpeechRecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export type SpeechRecognitionError =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'language-not-supported'
  | 'audio-capture'
  | 'aborted'
  | 'unknown';

export interface SpeechRecognitionEventHandlers {
  onResult: (result: SpeechRecognitionResult) => void;
  onStateChange?: (state: SpeechRecognitionState) => void;
  onError?: (error: { type: SpeechRecognitionError; message: string }) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Check if SpeechRecognition is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return !!SpeechRecognition;
}

/**
 * Get user-friendly error message for speech recognition errors
 */
export function getSpeechRecognitionErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Microphone permission denied. Please allow microphone access in your browser settings.';
    case 'no-speech':
      return 'No speech detected. Please try speaking again.';
    case 'network':
      return 'Speech recognition service unavailable. This browser feature requires connection to recognition servers. Please try again or use text input.';
    case 'language-not-supported':
      return 'Language not supported. Using default language.';
    case 'audio-capture':
      return 'No microphone found. Please connect a microphone.';
    case 'aborted':
      return 'Speech recognition was stopped.';
    default:
      return `Speech recognition failed: ${error}`;
  }
}

/**
 * Get browser compatibility information
 */
export function getBrowserInfo(): {
  name: string;
  speechRecognitionSupported: boolean;
  recommendation: string;
} {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let recommendation = '';

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    recommendation = 'Chrome supports speech recognition but requires internet connection to Google servers.';
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
    recommendation = 'Edge supports speech recognition but requires internet connection to Microsoft servers.';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    recommendation = 'Safari supports speech recognition but requires internet connection to Apple servers.';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    recommendation = 'Firefox has limited speech recognition support. Consider using Chrome or Edge.';
  } else {
    recommendation = 'Browser compatibility unknown. Consider using Chrome, Edge, or Safari for best results.';
  }

  return {
    name,
    speechRecognitionSupported: isSpeechRecognitionSupported(),
    recommendation,
  };
}

/**
 * Speech Recognition Service Class
 */
export class SpeechRecognitionService {
  private recognition: any | null = null;
  private isListening = false;
  private config: SpeechRecognitionConfig = {
    lang: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  };

  constructor(config?: Partial<SpeechRecognitionConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (isSpeechRecognitionSupported()) {
      this.initializeRecognition();
    }
  }

  private initializeRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[SpeechRecognition] Not supported in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      console.log('[SpeechRecognition] Initialized successfully');
    } catch (error) {
      console.error('[SpeechRecognition] Failed to initialize:', error);
    }
  }

  /**
   * Start speech recognition
   */
  start(handlers: SpeechRecognitionEventHandlers): boolean {
    console.log('[SpeechRecognition] start called');

    if (!isSpeechRecognitionSupported()) {
      const error = {
        type: 'unknown' as SpeechRecognitionError,
        message: 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
      };
      handlers.onError?.(error);
      return false;
    }

    if (this.isListening) {
      console.warn('[SpeechRecognition] Already listening');
      return false;
    }

    // Recreate recognition instance for fresh start
    this.initializeRecognition();

    if (!this.recognition) {
      const error = {
        type: 'unknown' as SpeechRecognitionError,
        message: 'Failed to initialize speech recognition.',
      };
      handlers.onError?.(error);
      return false;
    }

    // Configure recognition
    this.recognition.lang = this.config.lang;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('[SpeechRecognition] Started');
      this.isListening = true;
      handlers.onStateChange?.('listening');
      handlers.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      console.log('[SpeechRecognition] Result received');

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        handlers.onResult({
          transcript,
          isFinal: result.isFinal,
          confidence,
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[SpeechRecognition] Error:', event.error);
      this.isListening = false;

      const errorType = (event.error || 'unknown') as SpeechRecognitionError;
      const errorMessage = getSpeechRecognitionErrorMessage(event.error);

      handlers.onError?.({
        type: errorType,
        message: errorMessage,
      });

      handlers.onStateChange?.('error');
    };

    this.recognition.onend = () => {
      console.log('[SpeechRecognition] Ended');
      this.isListening = false;
      handlers.onStateChange?.('idle');
      handlers.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (error: any) {
      console.error('[SpeechRecognition] Failed to start:', error);

      if (error.name === 'not-allowed') {
        handlers.onError?.({
          type: 'not-allowed',
          message: getSpeechRecognitionErrorMessage('not-allowed'),
        });
      } else {
        handlers.onError?.({
          type: 'unknown',
          message: `Failed to start speech recognition: ${error.message || 'Unknown error'}`,
        });
      }

      return false;
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    console.log('[SpeechRecognition] stop called');

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
      } catch (error) {
        console.error('[SpeechRecognition] Error stopping:', error);
      }
    }
  }

  /**
   * Abort speech recognition
   */
  abort(): void {
    console.log('[SpeechRecognition] abort called');

    if (this.recognition) {
      try {
        this.recognition.abort();
        this.isListening = false;
      } catch (error) {
        console.error('[SpeechRecognition] Error aborting:', error);
      }
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SpeechRecognitionConfig {
    return { ...this.config };
  }
}

/**
 * Singleton instance
 */
let speechRecognitionInstance: SpeechRecognitionService | null = null;

export function getSpeechRecognitionService(): SpeechRecognitionService {
  if (!speechRecognitionInstance) {
    speechRecognitionInstance = new SpeechRecognitionService();
  }
  return speechRecognitionInstance;
}
