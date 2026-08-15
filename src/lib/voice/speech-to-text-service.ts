/**
 * Speech-to-Text Service for JANUARY
 *
 * Local speech recognition using Whisper.
 * This service handles microphone input and transcription.
 *
 * Supports local Whisper implementations:
 * - faster-whisper (preferred)
 * - whisper.cpp
 * - Other compatible Whisper servers
 */

export interface TranscriptionConfig {
  enabled: boolean;
  language: string;
  model: string;
  host: string;
  port: number;
}

export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
  duration?: number;
}

export interface RecordingState {
  isRecording: boolean;
  startTime: number | null;
  audioLevels: number[];
}

/**
 * Speech-to-Text Service
 *
 * Responsibilities:
 * - startRecording(): Start microphone capture
 * - stopRecording(): Stop and transcribe audio
 * - transcribe(audio): Convert audio to text using Whisper
 * - isAvailable(): Check if service is ready
 */
export class SpeechToTextService {
  private config: TranscriptionConfig = {
    enabled: true,
    language: 'en',
    model: 'base',
    host: '127.0.0.1',
    port: 8080, // Default Whisper server port
  };

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingState: RecordingState = {
    isRecording: false,
    startTime: null,
    audioLevels: [],
  };

  private callbacks: {
    onStart?: () => void;
    onStop?: () => void;
    onTranscribe?: (text: string) => void;
    onError?: (error: string) => void;
  } = {};

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private animationFrame: number | null = null;

  constructor() {
    // Read configuration from environment if available
    this.loadConfig();
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): void {
    if (typeof process !== 'undefined' && process.env) {
      this.config.host = process.env.WHISPER_HOST || '127.0.0.1';
      this.config.port = parseInt(process.env.WHISPER_PORT || '8080');
      this.config.model = process.env.WHISPER_MODEL || 'base';
      this.config.language = process.env.WHISPER_LANGUAGE || 'en';
    }
  }

  /**
   * Check if browser supports speech recognition
   */
  isBrowserSupported(): boolean {
    return typeof window !== 'undefined' &&
           'MediaRecorder' in window &&
           'AudioContext' in window;
  }

  /**
   * Check if microphone permission is granted
   */
  async checkMicrophonePermission(): Promise<PermissionState> {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('[SpeechToText] Cannot check microphone permission:', error);
      return 'prompt';
    }
  }

  /**
   * Request microphone permission
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('[SpeechToText] Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Start recording from microphone
   */
  async startRecording(): Promise<boolean> {
    if (!this.isBrowserSupported()) {
      const error = 'Browser does not support audio recording';
      this.callbacks.onError?.(error);
      return false;
    }

    if (this.recordingState.isRecording) {
      console.warn('[SpeechToText] Already recording');
      return false;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio context for level monitoring
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      this.analyser.fftSize = 256;

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.audioChunks = [];
      this.recordingState.isRecording = true;
      this.recordingState.startTime = Date.now();
      this.recordingState.audioLevels = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        this.recordingState.isRecording = false;
        this.stopAudioLevelMonitoring();

        // Create audio blob and transcribe
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.transcribeAudio(audioBlob);

        // Clean up
        this.cleanup();
      };

      // Start recording
      this.mediaRecorder.start(100); // Capture every 100ms
      this.startAudioLevelMonitoring();

      this.callbacks.onStart?.();
      console.log('[SpeechToText] Recording started');

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('[SpeechToText] Failed to start recording:', error);
      this.callbacks.onError?.(errorMessage);
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop recording and transcribe
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.recordingState.isRecording) {
      console.log('[SpeechToText] Stopping recording...');
      this.mediaRecorder.stop();
      this.callbacks.onStop?.();
    }
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitor = () => {
      if (!this.recordingState.isRecording || !this.analyser) {
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      this.recordingState.audioLevels.push(average);

      // Keep only last 100 levels
      if (this.recordingState.audioLevels.length > 100) {
        this.recordingState.audioLevels.shift();
      }

      this.animationFrame = requestAnimationFrame(monitor);
    };

    monitor();
  }

  /**
   * Stop monitoring audio levels
   */
  private stopAudioLevelMonitoring(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Get current audio level (0-255)
   */
  getCurrentAudioLevel(): number {
    if (this.recordingState.audioLevels.length === 0) {
      return 0;
    }
    return this.recordingState.audioLevels[this.recordingState.audioLevels.length - 1];
  }

  /**
   * Get average audio level during recording
   */
  getAverageAudioLevel(): number {
    if (this.recordingState.audioLevels.length === 0) {
      return 0;
    }
    const sum = this.recordingState.audioLevels.reduce((a, b) => a + b, 0);
    return sum / this.recordingState.audioLevels.length;
  }

  /**
   * Transcribe audio using local Whisper service
   */
  private async transcribeAudio(audioBlob: Blob): Promise<void> {
    console.log('[SpeechToText] Transcribing audio...');

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', this.config.language);
      formData.append('model', this.config.model);

      // Send to local Whisper service
      const whisperUrl = `http://${this.config.host}:${this.config.port}/v1/audio/transcriptions`;

      const response = await fetch(whisperUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const transcript = data.text || '';

      if (transcript) {
        console.log('[SpeechToText] Transcription:', transcript);
        this.callbacks.onTranscribe?.(transcript);
      } else {
        console.warn('[SpeechToText] Empty transcription received');
        this.callbacks.onError?.('No speech detected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transcription failed';
      console.error('[SpeechToText] Transcription error:', error);
      this.callbacks.onError?.(errorMessage);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onStart?: () => void;
    onStop?: () => void;
    onTranscribe?: (text: string) => void;
    onError?: (error: string) => void;
  }): void {
    this.callbacks = callbacks;
  }

  /**
   * Get recording state
   */
  getRecordingState(): RecordingState {
    return { ...this.recordingState };
  }

  /**
   * Get configuration
   */
  getConfig(): TranscriptionConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<TranscriptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isBrowserSupported()) {
      return false;
    }

    try {
      // Check if Whisper service is running
      const whisperUrl = `http://${this.config.host}:${this.config.port}/v1/models`;
      const response = await fetch(whisperUrl);

      return response.ok;
    } catch (error) {
      console.warn('[SpeechToText] Whisper service not available:', error);
      return false;
    }
  }

  /**
   * Get Whisper service status
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    error?: string;
  }> {
    try {
      const whisperUrl = `http://${this.config.host}:${this.config.port}/v1/models`;
      const response = await fetch(whisperUrl);

      if (response.ok) {
        return { available: true };
      }

      return {
        available: false,
        error: `Whisper service responded with ${response.status}`,
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
export const speechToTextService = new SpeechToTextService();
