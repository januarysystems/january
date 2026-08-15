/**
 * Wake Word Detector Component for JANUARY
 *
 * Provides visual and audio feedback for wake word detection.
 * Shows January's status and responses when "arise" is detected.
 */

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Volume2, Waves, Sparkles } from "lucide-react";

import { voiceService } from "@/lib/ai/voice-service";
import { wakeWordService, type DetectionEvent } from "@/lib/voice/wake-word-service";
import { coreStateManager } from "@/lib/ai/core-state-manager";
import { januaryAIService } from "@/lib/ai/january-ai-service";

export interface WakeWordDetectorProps {
  onResponse?: (response: string) => void;
}

export function WakeWordDetector({ onResponse }: WakeWordDetectorProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAwaitingCommand, setIsAwaitingCommand] = useState(false);
  const [justResponded, setJustResponded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mounted, setMounted] = useState(false);

  const justRespondedRef = useRef(false);
  const audioLevelInterval = useRef<NodeJS.Timeout | null>(null);

  // Only initialize after client-side mount
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // Skip if not mounted yet (SSR safety)
    if (!mounted) return;
    // Check browser support
    if (!wakeWordService.isAvailable()) {
      setError("Wake word detection not supported in this browser");
      return;
    }

    // Set up callbacks with error handling
    try {
      wakeWordService.setCallbacks({
        onWakeWordDetected: handleWakeWordDetected,
        onCommandReceived: handleCommandReceived,
        onListeningStateChanged: handleListeningStateChanged,
        onError: handleRecognitionError,
      });

      // Start wake word detection
      startWakeWordDetection();
    } catch (error) {
      console.error('[WakeWordUI] Failed to initialize:', error);
      setError("Failed to initialize wake word detection");
    }

    return () => {
      try {
        wakeWordService.stop();
      } catch (error) {
        console.error('[WakeWordUI] Error stopping service:', error);
      }
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
    };
  }, []);

  const startWakeWordDetection = async () => {
    console.log('[WakeWordUI] Starting wake word detection...');
    const started = await wakeWordService.start();
    if (started) {
      setIsActive(true);
      console.log('[WakeWordUI] Wake word detection active');
    } else {
      setError("Failed to start wake word detection");
    }
  };

  const handleWakeWordDetected = (event: DetectionEvent) => {
    console.log('[WakeWordUI] Wake word detected!', event);

    if (justRespondedRef.current) {
      console.log('[WakeWordUI] Just responded, ignoring');
      return;
    }

    // Update UI state
    setIsAwaitingCommand(true);
    coreStateManager.startListening();

    // Respond after a brief moment
    setTimeout(() => {
      respondToWakeWord();
    }, 500);
  };

  const respondToWakeWord = async () => {
    console.log('[WakeWordUI] Responding to wake word...');

    // Update state
    setIsAwaitingCommand(false);
    setJustResponded(true);
    justRespondedRef.current = true;

    // Clear the flag after a delay
    setTimeout(() => {
      setJustResponded(false);
      justRespondedRef.current = false;
    }, 3000);

    // Get response message
    const responseMessage = wakeWordService.getConfig().responseMessage;

    // Update core state
    coreStateManager.stopListening();
    coreStateManager.startSpeaking();

    // Speak the response
    voiceService.speak(responseMessage, {
      onStart: () => {
        console.log('[WakeWordUI] Started speaking response');
      },
      onEnd: () => {
        console.log('[WakeWordUI] Finished speaking response');
        coreStateManager.stopSpeaking(true);
        onResponse?.(responseMessage);
      },
      onError: (error) => {
        console.error('[WakeWordUI] TTS error:', error);
        coreStateManager.stopSpeaking(true);
      },
    });
  };

  const handleCommandReceived = (command: string) => {
    console.log('[WakeWordUI] Command received:', command);

    setIsAwaitingCommand(false);
    coreStateManager.stopListening();

    // Process command with AI
    processCommand(command);
  };

  const processCommand = async (command: string) => {
    console.log('[WakeWordUI] Processing command:', command);

    try {
      // Generate AI response
      coreStateManager.startThinking();

      const response = await januaryAIService.generateResponse(command, {
        conversationId: null,
        messages: [],
      });

      coreStateManager.stopThinking();

      if (response.success && response.content) {
        // Speak the response
        coreStateManager.startSpeaking();

        voiceService.speak(response.content, {
          onEnd: () => {
            coreStateManager.stopSpeaking(true);
            onResponse?.(response.content);
          },
          onError: () => {
            coreStateManager.stopSpeaking(true);
          },
        });
      }
    } catch (error) {
      console.error('[WakeWordUI] Error processing command:', error);
      coreStateManager.showError();
    }
  };

  const handleListeningStateChanged = (listening: boolean) => {
    console.log('[WakeWordUI] Listening state changed:', listening);
    setIsListening(listening);
  };

  const handleRecognitionError = (error: string) => {
    console.error('[WakeWordUI] Recognition error:', error);
    setError(error);
  };

  const toggleWakeWord = async () => {
    if (isActive) {
      wakeWordService.stop();
      setIsActive(false);
    } else {
      const started = await wakeWordService.start();
      if (started) {
        setIsActive(true);
        setError(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <div className={`relative grid size-16 place-items-center rounded-full transition-all duration-500 ${
            isActive
              ? isAwaitingCommand
                ? 'bg-amber/20 scale-110'
                : justResponded
                ? 'bg-green-500/20 scale-105'
                : 'bg-amber/10'
              : 'bg-secondary/40'
          }`}>
            {/* Animated rings when active */}
            {isActive && !justResponded && (
              <>
                <div className={`absolute inset-0 rounded-full border-2 border-amber/30 ${
                  isAwaitingCommand ? 'animate-ping' : ''
                }`} />
                <div className={`absolute inset-0 rounded-full border border-amber/20 ${
                  isAwaitingCommand ? 'animate-pulse' : ''
                }`} style={{ animationDuration: '2s' }} />
              </>
            )}

            {/* Icon */}
            {error ? (
              <MicOff className="size-6 text-red-500" />
            ) : isActive ? (
              isAwaitingCommand ? (
                <Waves className="size-6 text-amber animate-pulse" />
              ) : justResponded ? (
                <Sparkles className="size-6 text-green-500" />
              ) : (
                <Mic className="size-6 text-amber" />
              )
            ) : (
              <MicOff className="size-6 text-muted-foreground" />
            )}
          </div>

          {/* Status text */}
          <div className="mt-2 text-center">
            {error ? (
              <p className="text-[10px] text-red-500">Error</p>
            ) : isActive ? (
              isAwaitingCommand ? (
                <p className="text-[10px] text-amber font-medium">Listening...</p>
              ) : justResponded ? (
                <p className="text-[10px] text-green-500">Responding</p>
              ) : (
                <p className="text-[10px] text-amber">Active</p>
              )
            ) : (
              <p className="text-[10px] text-muted-foreground">Inactive</p>
            )}
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={toggleWakeWord}
          disabled={!wakeWordService.isAvailable()}
          className={`flex h-10 items-center gap-2 rounded-lg px-4 text-[11px] font-medium transition-all ${
            isActive
              ? 'bg-amber/10 text-amber hover:bg-amber/20'
              : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60'
          } ${!wakeWordService.isAvailable() ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isActive ? (
            <>
              <Volume2 className="size-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="size-4" />
              Start Listening
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      {isActive && !isAwaitingCommand && !justResponded && (
        <div className="rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-center">
          <p className="text-[11px] text-amber">
            Say <span className="font-bold">"arise"</span> to wake me up
          </p>
        </div>
      )}

      {/* Awaiting command */}
      {isAwaitingCommand && (
        <div className="rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-center">
          <p className="text-[11px] text-amber">
            I'm listening... give me a command
          </p>
        </div>
      )}

      {/* Just responded */}
      {justResponded && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-center">
          <p className="text-[11px] text-green-500">
            Yes, I am here. How may I assist you today?
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center">
          <p className="text-[10px] text-red-500">{error}</p>
        </div>
      )}

      {/* Browser support warning */}
      {!wakeWordService.isAvailable() && !error && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-center">
          <p className="text-[10px] text-yellow-500">
            Wake word detection not supported in this browser
          </p>
        </div>
      )}
    </div>
  );
}
