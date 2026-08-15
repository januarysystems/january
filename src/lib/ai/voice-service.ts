/**
 * Voice Service - Text-to-Speech with Female Voice defaults
 *
 * CRITICAL: JANUARY has a FEMALE voice.
 * Never default to a male voice.
 *
 * Browser voice names vary by:
 * - Operating system
 * - Browser
 * - Device
 * - Installed voices
 *
 * Therefore, implement intelligent female-voice selection.
 */

export interface VoiceConfig {
  enabled: boolean;
  voiceURI: string | null;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  gender: "female" | "male" | "unknown" | "neutral";
  isDefault?: boolean;
}

/**
 * JANUARY Voice Service
 *
 * Responsibilities:
 * - speak(text): Speak text with TTS
 * - stop(): Stop current speech
 * - pause(): Pause speech
 * - resume(): Resume speech
 * - setVoice(voiceURI): Set voice
 * - setLanguage(lang): Set language preference
 * - setRate(rate): Set speech rate
 * - setPitch(pitch): Set pitch
 * - setVolume(vol): Set volume
 * - getVoices(): Get available voices
 * - selectFemaleVoice(lang): Find best female voice for language
 */
export class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: VoiceInfo[] = [];
  private config: VoiceConfig = {
    enabled: true,
    voiceURI: null,
    language: "en-US",
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  private isPaused = false;
  private callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {};

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis;

      // Load voices when they become available
      if (this.synth) {
        this.loadVoices();

        // Voices load asynchronously on some browsers
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * Load and categorize available voices
   */
  private loadVoices(): void {
    if (!this.synth) return;

    const rawVoices = this.synth.getVoices();
    console.log("[VoiceService] Loading voices, count:", rawVoices.length);

    this.voices = rawVoices.map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
      gender: this.detectVoiceGender(v.name, v.lang),
    }));

    console.log("[VoiceService] Voices loaded:", this.voices.length);
    console.log("[VoiceService] Voice list:", this.voices.map(v => `${v.name} (${v.lang}) - ${v.gender}`).slice(0, 5));

    // Auto-select a female voice if none is configured
    if (!this.config.voiceURI && this.voices.length > 0) {
      const femaleVoice = this.selectBestFemaleVoice(this.config.language);
      if (femaleVoice) {
        this.config.voiceURI = femaleVoice.voiceURI;
        console.log("[VoiceService] Auto-selected female voice:", femaleVoice.name);
      } else {
        console.warn("[VoiceService] No female voice found, using first available");
        this.config.voiceURI = this.voices[0].voiceURI;
      }
    }
  }

  /**
   * Detect voice gender from name and language
   *
   * Female voice indicators:
   * - "Female", "Woman", "Girl"
   * - Common female names: "Samantha", "Victoria", "Alex", "Google", "Microsoft", etc.
   */
  private detectVoiceGender(name: string, lang: string): "female" | "male" | "unknown" | "neutral" {
    const lowerName = name.toLowerCase();

    // Explicit female indicators
    if (
      lowerName.includes("female") ||
      lowerName.includes("woman") ||
      lowerName.includes("girl") ||
      lowerName.includes("samantha") ||
      lowerName.includes("victoria") ||
      lowerName.includes("karen") ||
      lowerName.includes("julia") ||
      lowerName.includes("moira") ||
      lowerName.includes("fiona") ||
      lowerName.includes("siri") ||
      lowerName.includes("cortana") ||
      lowerName.includes("alexa")
    ) {
      return "female";
    }

    // Explicit male indicators
    if (
      lowerName.includes("male") ||
      lowerName.includes("man") ||
      lowerName.includes("daniel") ||
      lowerName.includes("thomas") ||
      lowerName.includes("james") ||
      lowerName.includes("google us") ||
      lowerName.includes("microsoft david") ||
      lowerName.includes("microsoft mark")
    ) {
      return "male";
    }

    // Browser/OS defaults - often female or neutral
    if (
      lowerName.includes("google ") || // Google voices are often female/neutral
      lowerName.includes("microsoft ") || // Microsoft voices vary
      lowerName.includes("apple ") || // Apple voices vary
      lowerName.includes("amazon ") || // Alexa is female
      lowerName.includes("zira") ||
      lowerName.includes("heera") ||
      lowerName.includes("rishi") // Some Indian voices
    ) {
      return "female"; // Default to female for system voices
    }

    return "unknown";
  }

  /**
   * Select the best female voice for a given language
   *
   * Priority:
   * 1. Explicitly female voice matching the language
   * 2. System default voice for the language (often female)
   * 3. First available voice for the language
   *
   * NEVER randomly select a male voice.
   */
  selectBestFemaleVoice(language: string): VoiceInfo | null {
    const langPrefix = language.split("-")[0];

    // First, try to find an explicitly female voice for the language
    const femaleVoices = this.voices.filter(
      (v) => v.gender === "female" && v.lang.startsWith(langPrefix)
    );

    if (femaleVoices.length > 0) {
      // Prefer named/system voices over generic ones
      const named = femaleVoices.find((v) =>
        v.name.includes("Google") ||
        v.name.includes("Microsoft") ||
        v.name.includes("Samantha") ||
        v.name.includes("Victoria")
      );
      return named || femaleVoices[0];
    }

    // Second, try unknown/neutral voices for the language
    const neutralVoices = this.voices.filter(
      (v) => (v.gender === "unknown" || v.gender === "neutral") && v.lang.startsWith(langPrefix)
    );

    if (neutralVoices.length > 0) {
      // Prefer Google/Microsoft voices (often female)
      const system = neutralVoices.find((v) =>
        v.name.includes("Google") ||
        v.name.includes("Microsoft")
      );
      return system || neutralVoices[0];
    }

    // Fallback: English female voice if none found for requested language
    if (langPrefix !== "en") {
      const enFemale = this.voices.find(
        (v) => (v.gender === "female" || v.gender === "unknown") && v.lang.startsWith("en")
      );
      if (enFemale) return enFemale;
    }

    // Last resort: return first voice (but this should be logged)
    if (this.voices.length > 0) {
      console.warn(`No female voice found for ${language}, using available voice`);
      return this.voices[0];
    }

    return null;
  }

  /**
   * Speak text with current voice configuration
   */
  speak(
    text: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    }
  ): void {
    console.log("[VoiceService] speak called, enabled:", this.config.enabled, "text length:", text.length);
    console.log("[VoiceService] synth available:", !!this.synth);
    console.log("[VoiceService] voices loaded:", this.voices.length);
    console.log("[VoiceService] configured voice URI:", this.config.voiceURI);

    if (!this.synth) {
      console.error("[VoiceService] Speech synthesis not available");
      callbacks?.onError?.("Speech synthesis not available");
      return;
    }

    if (!this.config.enabled) {
      console.warn("[VoiceService] Voice service disabled");
      return;
    }

    if (!text || text.trim().length === 0) {
      console.warn("[VoiceService] No text to speak");
      return;
    }

    // Cancel any current speech
    this.stop();

    this.callbacks = callbacks || {};

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Apply voice configuration
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.volume = this.config.volume;

    console.log("[VoiceService] Utterance config - rate:", utterance.rate, "pitch:", utterance.pitch, "volume:", utterance.volume);

    // Set voice if configured
    if (this.config.voiceURI) {
      const voice = this.voices.find((v) => v.voiceURI === this.config.voiceURI);
      if (voice) {
        const synthVoice = this.synth.getVoices().find((v) => v.voiceURI === voice.voiceURI);
        if (synthVoice) {
          utterance.voice = synthVoice;
          utterance.lang = voice.lang;
          console.log("[VoiceService] Set voice:", synthVoice.name, "lang:", synthVoice.lang);
        } else {
          console.warn("[VoiceService] Could not find synth voice for URI:", this.config.voiceURI);
        }
      }
    } else {
      console.warn("[VoiceService] No voice URI configured");
    }

    // Event handlers
    utterance.onstart = () => {
      console.log("[VoiceService] Speech started");
      this.isPaused = false;
      this.callbacks.onStart?.();
    };

    utterance.onend = () => {
      console.log("[VoiceService] Speech ended");
      this.currentUtterance = null;
      this.callbacks.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error("[VoiceService] Speech error:", event.error);
      this.currentUtterance = null;
      this.callbacks.onError?.(event.error || "Unknown speech error");
    };

    // Start speaking
    console.log("[VoiceService] Calling synth.speak()...");
    this.synth.speak(utterance);
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.isPaused = false;
    }
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.synth && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  /**
   * Set voice by URI
   */
  setVoice(voiceURI: string | null): void {
    this.config.voiceURI = voiceURI;
  }

  /**
   * Set language preference
   */
  setLanguage(language: string): void {
    this.config.language = language;

    // Auto-select female voice for new language
    const femaleVoice = this.selectBestFemaleVoice(language);
    if (femaleVoice) {
      this.config.voiceURI = femaleVoice.voiceURI;
    }
  }

  /**
   * Set speech rate (0.1 to 10)
   */
  setRate(rate: number): void {
    this.config.rate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set pitch (0 to 2)
   */
  setPitch(pitch: number): void {
    this.config.pitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Set volume (0 to 1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable voice
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };

    // Auto-select voice if language changed
    if (config.language && !config.voiceURI) {
      const femaleVoice = this.selectBestFemaleVoice(config.language);
      if (femaleVoice) {
        this.config.voiceURI = femaleVoice.voiceURI;
      }
    }
  }

  /**
   * Get all available voices
   */
  getVoices(): VoiceInfo[] {
    return [...this.voices];
  }

  /**
   * Check if voice service is available
   */
  isAvailable(): boolean {
    const available = this.synth !== null && this.voices.length > 0;
    console.log("[VoiceService] isAvailable:", available, "synth:", !!this.synth, "voices:", this.voices.length);
    return available;
  }

  /**
   * Force reload voices (call this after user interaction)
   */
  reloadVoices(): void {
    console.log("[VoiceService] Force reloading voices");
    if (this.synth) {
      this.loadVoices();
    }
  }

  /**
   * Test voice with a simple message
   */
  testVoice(): void {
    console.log("[VoiceService] Testing voice...");
    this.speak("Voice test successful.", {
      onStart: () => console.log("[VoiceService] Test speech started"),
      onEnd: () => console.log("[VoiceService] Test speech ended"),
      onError: (error) => console.error("[VoiceService] Test speech error:", error),
    });
  }

  /**
   * Get speaking state
   */
  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }
}

// Singleton instance
export const voiceService = new VoiceService();
