/**
 * Wake Word Detection Service for JANUARY
 *
 * Listens continuously for the wake word "arise" and activates JANUARY.
 * Uses the Web Speech API for browser-based speech recognition.
 *
 * Features:
 * - Continuous listening for "arise" command
 * - Visual feedback when wake word is detected
 * - Automatic voice response from JANUARY
 * - Command listening after activation
 * - Privacy-focused (local processing, no cloud)
 */

export interface WakeWordConfig {
  wakeWord: string;
  sensitivity: number;
  autoResponse: boolean;
  responseMessage: string;
  listenForCommand: boolean;
  commandTimeout: number;
}

export interface WakeWordState {
  isActive: boolean;
  isListening: boolean;
  isAwaitingCommand: boolean;
  lastDetection: number | null;
  confidence: number;
  error: string | null;
}

export interface DetectionEvent {
  detected: boolean;
  command?: string;
  confidence: number;
  timestamp: number;
}

/**
 * Wake Word Detection Service
 *
 * Uses Web Speech API for continuous wake word detection
 */
export class WakeWordService {
  private recognition: any = null;
  private config: WakeWordConfig = {
    wakeWord: 'arise',
    sensitivity: 0.7,
    autoResponse: true,
    responseMessage: 'Yes, I am here. How may I assist you today?',
    listenForCommand: true,
    commandTimeout: 8000,
  };

  private state: WakeWordState = {
    isActive: false,
    isListening: false,
    isAwaitingCommand: false,
    lastDetection: null,
    confidence: 0,
    error: null,
  };

  private callbacks: {
    onWakeWordDetected?: (event: DetectionEvent) => void;
    onCommandReceived?: (command: string) => void;
    onListeningStateChanged?: (isListening: boolean) => void;
    onError?: (error: string) => void;
  } = {};

  private commandTimeoutTimer: NodeJS.Timeout | null = null;
  private restartTimeoutTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize the speech recognition
   */
  private initialize(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('[WakeWord] Speech recognition not supported in this browser');
      this.state.error = 'Speech recognition not supported';
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }

  /**
   * Set up speech recognition configuration
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    // Configure for continuous listening
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    // Handle results
    this.recognition.onresult = (event: any) => {
      this.handleSpeechResult(event);
    };

    // Handle errors
    this.recognition.onerror = (event: any) => {
      this.handleRecognitionError(event);
    };

    // Handle end of speech
    this.recognition.onend = () => {
      this.handleRecognitionEnd();
    };

    // Handle start
    this.recognition.onstart = () => {
      console.log('[WakeWord] Speech recognition started');
      this.state.isListening = true;
      this.callbacks.onListeningStateChanged?.(true);
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(event: any): void {
    const results = event.results;
    const latestResult = results[results.length - 1];

    if (!latestResult) return;

    const transcript = latestResult[0].transcript.toLowerCase().trim();
    const confidence = latestResult[0].confidence || 0;
    const isFinal = latestResult.isFinal;

    console.log('[WakeWord] Heard:', transcript, 'Confidence:', confidence, 'Final:', isFinal);

    // Check if we're awaiting a command
    if (this.state.isAwaitingCommand && isFinal) {
      this.handleCommandReceived(transcript);
      return;
    }

    // Check for wake word
    if (this.isWakeWordDetected(transcript) && confidence >= this.config.sensitivity) {
      this.handleWakeWordDetection(transcript, confidence);
    }
  }

  /**
   * Check if the wake word is detected in the transcript
   */
  private isWakeWordDetected(transcript: string): boolean {
    const wakeWord = this.config.wakeWord.toLowerCase();
    return transcript.includes(wakeWord);
  }

  /**
   * Handle wake word detection
   */
  private handleWakeWordDetection(transcript: string, confidence: number): void {
    console.log('[WakeWord] Wake word detected!', transcript, confidence);

    const event: DetectionEvent = {
      detected: true,
      confidence,
      timestamp: Date.now(),
    };

    this.state.lastDetection = Date.now();
    this.state.confidence = confidence;

    // Trigger callback
    this.callbacks.onWakeWordDetected?.(event);

    // If configured to listen for command
    if (this.config.listenForCommand) {
      this.startCommandListening();
    }
  }

  /**
   * Handle command received after wake word
   */
  private handleCommandReceived(command: string): void {
    console.log('[WakeWord] Command received:', command);

    // Clear timeout
    if (this.commandTimeoutTimer) {
      clearTimeout(this.commandTimeoutTimer);
      this.commandTimeoutTimer = null;
    }

    this.state.isAwaitingCommand = false;
    this.callbacks.onCommandReceived?.(command);
  }

  /**
   * Start listening for command after wake word
   */
  private startCommandListening(): void {
    console.log('[WakeWord] Listening for command...');

    this.state.isAwaitingCommand = true;

    // Set timeout for command
    if (this.commandTimeoutTimer) {
      clearTimeout(this.commandTimeoutTimer);
    }

    this.commandTimeoutTimer = setTimeout(() => {
      console.log('[WakeWord] Command timeout');
      this.state.isAwaitingCommand = false;

      // Could trigger a "I didn't catch that" response here
    }, this.config.commandTimeout);
  }

  /**
   * Handle recognition errors
   */
  private handleRecognitionError(event: any): void {
    console.error('[WakeWord] Recognition error:', event.error);

    const errorMessage = event.error || 'Unknown error';
    this.state.error = errorMessage;

    // Don't notify on no-speech errors (normal during continuous listening)
    if (errorMessage !== 'no-speech') {
      this.callbacks.onError?.(errorMessage);
    }

    // Restart on network errors
    if (errorMessage === 'network') {
      this.restartRecognition();
    }
  }

  /**
   * Handle recognition end
   */
  private handleRecognitionEnd(): void {
    console.log('[WakeWord] Recognition ended');

    this.state.isListening = false;
    this.callbacks.onListeningStateChanged?.(false);

    // Auto-restart if active
    if (this.state.isActive) {
      this.restartRecognition();
    }
  }

  /**
   * Restart recognition with delay
   */
  private restartRecognition(): void {
    if (this.restartTimeoutTimer) {
      clearTimeout(this.restartTimeoutTimer);
    }

    this.restartTimeoutTimer = setTimeout(() => {
      if (this.state.isActive && this.recognition) {
        try {
          this.recognition.start();
          console.log('[WakeWord] Recognition restarted');
        } catch (error) {
          console.error('[WakeWord] Failed to restart:', error);
        }
      }
    }, 1000);
  }

  /**
   * Start wake word detection
   */
  async start(): Promise<boolean> {
    if (!this.recognition) {
      console.error('[WakeWord] Recognition not initialized');
      return false;
    }

    if (this.state.isActive) {
      console.warn('[WakeWord] Already active');
      return true;
    }

    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      this.state.isActive = true;
      this.recognition.start();

      console.log('[WakeWord] Wake word detection started');
      return true;
    } catch (error) {
      console.error('[WakeWord] Failed to start:', error);
      this.state.error = error instanceof Error ? error.message : 'Failed to start';
      this.callbacks.onError?.(this.state.error);
      return false;
    }
  }

  /**
   * Stop wake word detection
   */
  stop(): void {
    if (!this.state.isActive) {
      return;
    }

    console.log('[WakeWord] Stopping wake word detection');

    this.state.isActive = false;
    this.state.isAwaitingCommand = false;

    if (this.commandTimeoutTimer) {
      clearTimeout(this.commandTimeoutTimer);
      this.commandTimeoutTimer = null;
    }

    if (this.restartTimeoutTimer) {
      clearTimeout(this.restartTimeoutTimer);
      this.restartTimeoutTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('[WakeWord] Error stopping recognition:', error);
      }
    }
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onWakeWordDetected?: (event: DetectionEvent) => void;
    onCommandReceived?: (command: string) => void;
    onListeningStateChanged?: (isListening: boolean) => void;
    onError?: (error: string) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get configuration
   */
  getConfig(): WakeWordConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WakeWordConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get state
   */
  getState(): WakeWordState {
    return { ...this.state };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  /**
   * Check browser support
   */
  static isBrowserSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}

// Singleton instance
export const wakeWordService = new WakeWordService();
