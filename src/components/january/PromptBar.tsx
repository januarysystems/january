import { motion } from "framer-motion";
import { ArrowUp, Code2, FileText, ImageIcon, Mic, Paperclip, StopCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import {
  getSpeechRecognitionService,
  isSpeechRecognitionSupported,
  getBrowserInfo,
  type SpeechRecognitionResult,
} from "@/lib/speech/speech-recognition";

export function PromptBar({
  placeholder = "Ask January anything...",
}: {
  placeholder?: string;
}) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  // Check speech recognition support on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setRecognitionSupported(supported);

    if (!supported) {
      const browserInfo = getBrowserInfo();
      console.warn("[PromptBar] Speech recognition not supported:", browserInfo);
      setMicError(`Speech recognition is not supported in ${browserInfo.name}. ${browserInfo.recommendation}`);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const service = getSpeechRecognitionService();
      service.abort();
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (message.trim()) {
      const messageContent = message.trim();
      console.log("[PROMPTBAR-DEBUG] Dispatching prompt-submit event:", messageContent.substring(0, 50));
      // Dispatch custom event that the Chat component listens for
      window.dispatchEvent(new CustomEvent("prompt-submit", { detail: messageContent }));
      setMessage("");
      setInterimTranscript("");
    } else {
      console.log("[PROMPTBAR-DEBUG] Submit called but message is empty");
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleListening = useCallback(() => {
    console.log("[PromptBar] Toggle listening called, current state:", isListening);

    // Clear any previous errors
    setMicError(null);

    if (isListening) {
      // Stop listening
      console.log("[PromptBar] Stopping speech recognition");
      const service = getSpeechRecognitionService();
      service.stop();
      setIsListening(false);
      setInterimTranscript("");
    } else {
      // Start listening
      console.log("[PromptBar] Starting speech recognition");

      if (!recognitionSupported) {
        const browserInfo = getBrowserInfo();
        setMicError(`Speech recognition not supported in ${browserInfo.name}. ${browserInfo.recommendation}`);
        return;
      }

      const service = getSpeechRecognitionService();

      const success = service.start({
        onResult: (result: SpeechRecognitionResult) => {
          console.log("[PromptBar] Speech result:", result);

          if (result.isFinal) {
            // Final transcript - add to message
            setMessage(prev => prev + result.transcript);
            setInterimTranscript("");
          } else {
            // Interim transcript - show but don't add yet
            setInterimTranscript(result.transcript);
          }
        },
        onStateChange: (state) => {
          console.log("[PromptBar] Recognition state:", state);
          if (state === 'listening') {
            setIsListening(true);
          } else if (state === 'idle' || state === 'error') {
            setIsListening(false);
          }
        },
        onError: (error) => {
          console.error("[PromptBar] Recognition error:", error);
          setMicError(error.message);
          setIsListening(false);

          // Auto-clear error after 8 seconds
          setTimeout(() => setMicError(null), 8000);
        },
        onStart: () => {
          console.log("[PromptBar] Recognition started");
          setInterimTranscript("");
        },
        onEnd: () => {
          console.log("[PromptBar] Recognition ended");
          setIsListening(false);
          // Keep interim transcript briefly for UX
          setTimeout(() => setInterimTranscript(""), 1000);
        },
      });

      if (!success) {
        console.error("[PromptBar] Failed to start speech recognition");
        setIsListening(false);
      }
    }
  }, [isListening, recognitionSupported]);

  return (
    <div className="glass-panel flex items-end gap-3 rounded-2xl px-3 py-3">
      <div className="min-w-0 flex-1">
        <textarea
          rows={1}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-32 w-full resize-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        {(isListening || interimTranscript || micError) && (
          <div className="mb-2 text-[11px]">
            {micError ? (
              <span className="text-danger flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-danger" />
                {micError}
              </span>
            ) : isListening ? (
              <span className="text-amber flex items-center gap-1">
                <span className="inline-block size-2 animate-pulse rounded-full bg-amber" />
                Listening: {interimTranscript || "..."}
              </span>
            ) : (
              <span className="text-muted-foreground">{interimTranscript}</span>
            )}
          </div>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          {[Paperclip, ImageIcon, Code2, FileText].map((Icon, i) => (
            <button
              key={i}
              aria-label="Attach"
              className="grid size-7 place-items-center rounded-md transition-colors hover:bg-accent/40 hover:text-amber"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-0.5">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={isListening ? "Stop listening" : "Voice input"}
          onClick={toggleListening}
          className={isListening
            ? "grid size-10 place-items-center rounded-full border border-danger/40 bg-danger/10 text-danger"
            : "grid size-10 place-items-center rounded-full border border-amber/40 bg-secondary/50 text-amber"
          }
        >
          {isListening ? <StopCircle className="size-4" /> : <Mic className="size-4" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Send"
          onClick={handleSubmit}
          disabled={!message.trim()}
          className="amber-gradient glow-ring grid size-10 place-items-center rounded-full text-primary-foreground disabled:opacity-50"
        >
          <ArrowUp className="size-4" />
        </motion.button>
      </div>
    </div>
  );
}