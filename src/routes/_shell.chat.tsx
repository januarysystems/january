import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bookmark,
  Code2,
  Copy,
  FileText,
  Globe,
  ImageIcon,
  Languages,
  Mic,
  MoreVertical,
  Pin,
  Plus,
  Search,
  Share2,
  Sparkles,
  Square,
  StopCircle,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AICore } from "@/components/january/AICore";
import { AppShell, AmberButton, GhostButton } from "@/components/january/AppShell";
import { MetricBar, Panel, PanelHeader, QuickActionGrid } from "@/components/january/primitives";
import { coreStateManager } from "@/lib/ai/core-state-manager";
import { januaryAIService } from "@/lib/ai/january-ai-service";
import { voiceService } from "@/lib/ai/voice-service";
import { createSession, deleteSession, listMessages, listSessions, sendMessage, type ChatMessage, type ChatSession } from "@/lib/api";

export const Route = createFileRoute("/_shell/chat")({
  head: () => ({
    meta: [
      { title: "Chat — JANUARY intelligent assistant" },
      {
        name: "description",
        content:
          "Converse with JANUARY: markdown and code-block ready chat with voice, attachments and context.",
      },
      { property: "og:title", content: "Chat — JANUARY" },
      {
        property: "og:description",
        content: "Markdown and code-ready AI conversation workspace with voice input.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Debug logging on mount
  useEffect(() => {
    console.log("[CHAT-DEBUG] ChatPage mounted, activeSessionId:", activeSessionId);
  }, [activeSessionId]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // AI streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [puterInitializing, setPuterInitializing] = useState(true);
  const [puterReady, setPuterReady] = useState(false);
  const streamingAbortRef = useRef<AbortController | null>(null);

  // Subscribe to core state changes
  useEffect(() => {
    const unsubscribe = coreStateManager.subscribe((state) => {
      // Could update local UI state here if needed
      console.log("Core state changed:", state);
    });

    return unsubscribe;
  }, []);

  // Initialize JANUARY AI service (Puter) on mount
  useEffect(() => {
    let mounted = true;

    const initPuter = async () => {
      console.log("[CHAT-DEBUG] Initializing JANUARY AI service (Puter)...");
      try {
        await januaryAIService.initialize();
        if (mounted) {
          setPuterReady(true);
          setPuterInitializing(false);
          console.log("[CHAT-DEBUG] JANUARY AI service ready");
        }
      } catch (error) {
        console.error("[CHAT-DEBUG] Failed to initialize JANUARY AI service:", error);
        if (mounted) {
          setPuterInitializing(false);
          setError("Failed to initialize AI service. Please refresh the page.");
        }
      }
    };

    initPuter();

    return () => {
      mounted = false;
    };
  }, []);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: listSessions,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", activeSessionId],
    queryFn: () => (activeSessionId ? listMessages(activeSessionId) : []),
    enabled: !!activeSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: (title?: string) => createSession(title),
    onSuccess: (data) => {
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setActiveSessionId(data.id);
      setIsCreating(false);
      setNewTitle("");
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (activeSessionId) {
        setActiveSessionId(null);
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, sessionId }: { content: string; sessionId: string }) => {
      if (!sessionId) throw new Error("No active conversation");
      return sendMessage(sessionId, content, "user");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.sessionId] });
    },
  });

  // Stop AI generation
  const stopGeneration = useCallback(() => {
    voiceService.stop();
    setIsStreaming(false);
    coreStateManager.reset();
  }, []);

  // Send message with AI response
  const sendMessageWithAI = useCallback(async (content: string) => {
    console.log("[CHAT-DEBUG] sendMessageWithAI called with:", content?.substring(0, 50));
    console.log("[CHAT-DEBUG] activeSessionId:", activeSessionId);
    console.log("[CHAT-DEBUG] isStreaming:", isStreaming);
    console.log("[CHAT-DEBUG] puterReady:", puterReady);

    // Check if Puter is ready
    if (!puterReady) {
      console.error("[CHAT-DEBUG] Puter AI service not ready");
      setError(puterInitializing ? "AI service is initializing..." : "AI service is not available. Please refresh the page.");
      return;
    }

    // Auto-create session if none exists
    let sessionId = activeSessionId;
    if (!sessionId && !isStreaming) {
      console.log("[CHAT-DEBUG] No active session, creating one automatically...");
      try {
        const newSession = await createSession(content?.substring(0, 50) || "New conversation");
        if (!newSession) {
          throw new Error("Failed to create session");
        }
        sessionId = newSession.id;
        setActiveSessionId(sessionId);
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        console.log("[CHAT-DEBUG] Auto-created session:", sessionId);
      } catch (error) {
        console.error("[CHAT-DEBUG] Failed to auto-create session:", error);
        setError("Failed to create conversation. Please try again.");
        return;
      }
    }

    if (isStreaming) {
      console.log("[CHAT-DEBUG] Already streaming, ignoring request");
      return;
    }

    if (!sessionId) {
      console.error("[CHAT-DEBUG] No session ID available");
      setError("No active conversation. Please create one first.");
      return;
    }

    setError(null);
    setStreamedContent("");
    setIsStreaming(true);
    coreStateManager.startThinking();

    // First, save the user message
    try {
      console.log("[CHAT-DEBUG] Saving user message to Supabase with sessionId:", sessionId);
      await sendMessageMutation.mutateAsync({ content, sessionId });
      console.log("[CHAT-DEBUG] User message saved successfully");
    } catch (error) {
      console.error("[CHAT-DEBUG] Failed to save user message:", error);
      setError(error instanceof Error ? error.message : "Failed to send message");
      coreStateManager.showError();
      setIsStreaming(false);
      return;
    }

    // Then, get AI response using JANUARY AI service (Puter)
    try {
      console.log("[CHAT-DEBUG] Calling JANUARY AI service...");

      // Convert chat messages to AI messages format
      const aiMessages = messages
        .slice(-10)
        .filter(m => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      console.log("[CHAT-DEBUG] Conversation history count:", aiMessages.length);

      // Call JANUARY AI service
      const response = await januaryAIService.generateResponse(content, {
        conversationId: sessionId,
        messages: aiMessages
      }, {
        temperature: 0.7,
        maxTokens: 4096,
        enableMemory: true
      });

      console.log("[CHAT-DEBUG] AI response received, success:", response.success);

      if (!response.success || !response.content) {
        console.error("[CHAT-DEBUG] AI generation failed:", response.error);
        setError(response.error || "Failed to generate AI response");
        coreStateManager.showError();
        voiceService.stop();
        setIsStreaming(false);
        return;
      }

      // Display the response
      const fullResponse = response.content;
      setStreamedContent(fullResponse);
      console.log("[CHAT-DEBUG] Response length:", fullResponse.length);

      // Save the AI response to Supabase
      await sendMessage(sessionId, fullResponse, "assistant");
      queryClient.invalidateQueries({ queryKey: ["chat-messages", sessionId] });
      console.log("[CHAT-DEBUG] Assistant response saved");

      // Speak the response if voice is enabled
      console.log("[CHAT-DEBUG] Checking TTS - fullResponse length:", fullResponse?.length);
      const voiceConfig = voiceService.getConfig();
      console.log("[CHAT-DEBUG] Voice config - enabled:", voiceConfig.enabled, "voiceURI:", voiceConfig.voiceURI);
      console.log("[CHAT-DEBUG] Voice service available:", voiceService.isAvailable());

      if (voiceConfig.enabled && fullResponse) {
        console.log("[CHAT-DEBUG] Starting TTS for response");
        coreStateManager.startSpeaking();
        voiceService.speak(fullResponse, {
          onStart: () => console.log("[CHAT-DEBUG] TTS started"),
          onEnd: () => {
            console.log("[CHAT-DEBUG] TTS ended");
            coreStateManager.stopSpeaking(true);
          },
          onError: (error) => {
            console.error("[CHAT-DEBUG] TTS error:", error);
            coreStateManager.stopSpeaking(true);
          },
        });
      } else {
        console.log("[CHAT-DEBUG] TTS skipped - enabled:", voiceConfig.enabled, "hasResponse:", !!fullResponse);
        coreStateManager.stopSpeaking(true);
      }

      setStreamedContent("");
      setIsStreaming(false);
    } catch (error) {
      console.error("[CHAT-DEBUG] AI service error:", error);
      setError(error instanceof Error ? error.message : "Failed to get AI response");
      coreStateManager.showError();
      voiceService.stop();
      setIsStreaming(false);
    }
  }, [activeSessionId, isStreaming, messages, sendMessageMutation, queryClient, puterReady, puterInitializing]);

  // Handle message from AppShell prompt bar
  useEffect(() => {
    const handlePromptSubmit = (event: CustomEvent<string>) => {
      console.log("[CHAT-EVENT] prompt-submit event received:", event.detail?.substring(0, 50));
      console.log("[CHAT-EVENT] Full event detail length:", event.detail?.length);
      sendMessageWithAI(event.detail);
    };

    console.log("[CHAT-EVENT] Setting up prompt-submit event listener");
    window.addEventListener("prompt-submit" as any, handlePromptSubmit);
    return () => {
      console.log("[CHAT-EVENT] Cleaning up prompt-submit event listener");
      window.removeEventListener("prompt-submit" as any, handlePromptSubmit);
    };
  }, [sendMessageWithAI]);

  // Stop generation on unmount
  useEffect(() => {
    return () => {
      stopGeneration();
    };
  }, [stopGeneration]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell promptPlaceholder="Type your message or speak..." rightPanel={<ChatRail />}>
      <div className="flex h-full min-h-[560px] gap-3">
        <Panel className="hidden w-[224px] shrink-0 flex-col md:flex">
          <div className="flex items-center justify-between border-b border-hairline px-3 py-2.5">
            <PanelHeader title="Conversations" />
            <button
              onClick={() => setIsCreating(true)}
              className="grid size-7 place-items-center rounded-md text-amber hover:bg-accent/40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {isCreating ? (
            <div className="border-b border-hairline p-2">
              <input
                autoFocus
                placeholder="Conversation title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mb-2 h-8 w-full rounded-md border border-hairline bg-secondary/40 px-2 text-[11px] outline-none focus:border-amber/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") createSessionMutation.mutate(newTitle || undefined);
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <div className="flex gap-1">
                <AmberButton
                  size="sm"
                  onClick={() => createSessionMutation.mutate(newTitle || undefined)}
                  disabled={createSessionMutation.isPending}
                >
                  {createSessionMutation.isPending ? "..." : "Create"}
                </AmberButton>
                <GhostButton size="sm" onClick={() => setIsCreating(false)}>
                  <X className="size-3" />
                </GhostButton>
              </div>
            </div>
          ) : null}

          <div className="p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-hairline bg-secondary/40 pr-2 pl-8 text-[11px] outline-none focus:border-amber/40"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
            {sessionsLoading ? (
              <p className="p-4 text-center text-[11px] text-muted-foreground">Loading...</p>
            ) : filteredSessions.length === 0 ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-hairline bg-secondary/40 p-6 text-center text-[11px] text-muted-foreground">
                <p className="text-[12px] font-medium text-foreground">No conversations yet</p>
                <p className="mt-2 max-w-[240px] leading-relaxed">
                  Your recent chats will appear here once you start a conversation with January.
                </p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {filteredSessions.map((s) => (
                  <li key={s.id}>
                    <div
                      onClick={() => setActiveSessionId(s.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                        activeSessionId === s.id
                          ? "bg-accent/60 text-amber"
                          : "text-muted-foreground hover:bg-accent/30"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-[11px]">{s.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${s.title}"?`)) deleteSessionMutation.mutate(s.id);
                        }}
                        className="shrink-0 opacity-0 hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-hairline p-2 space-y-2">
            <div className="flex items-center justify-between rounded-md bg-secondary/20 px-2 py-1.5">
              <span className="text-[10px] text-muted-foreground">Puter AI</span>
              <span className={`text-[9px] ${puterReady ? 'text-amber' : puterInitializing ? 'text-yellow-600' : 'text-red-500'}`}>
                {puterReady ? '● Ready' : puterInitializing ? '● Loading...' : '● Offline'}
              </span>
            </div>
            <button
              onClick={() => setActiveSessionId(null)}
              className="w-full rounded-md border border-hairline bg-secondary/40 py-1.5 text-[10.5px] text-foreground/80 hover:border-amber/40 hover:text-amber"
            >
              View All Conversations
            </button>
          </div>
        </Panel>

        <Panel className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
            <h3 className="min-w-0 flex-1 truncate text-[13px] text-foreground">
              {activeSession?.title || "No conversations selected"}
            </h3>
            <div className="flex items-center gap-1">
              {isStreaming && (
                <button
                  onClick={stopGeneration}
                  className="grid size-7 place-items-center rounded-md text-danger hover:bg-accent/40"
                  title="Stop generation"
                >
                  <StopCircle className="size-3.5" />
                </button>
              )}
              {[Pin, Share2, Trash2, MoreVertical].map((Icon, i) => (
                <button
                  key={i}
                  className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/40 hover:text-amber"
                  disabled={!activeSessionId || isStreaming}
                  onClick={() => {
                    if (i === 2 && activeSessionId && activeSession && confirm(`Delete "${activeSession.title}"?`)) {
                      deleteSessionMutation.mutate(activeSessionId);
                    }
                  }}
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>

          {!activeSessionId ? (
            <div className="min-h-0 flex-1 p-4">
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-2xl border border-hairline bg-secondary/40 px-6 py-5">
                  <p className="text-[13px] font-medium text-foreground">No active conversation</p>
                  <p className="mt-2 max-w-[320px] text-[11px] leading-relaxed text-muted-foreground">
                    Start a conversation with January using the prompt at the bottom or create a new
                    chat from the sidebar.
                  </p>
                </div>

                {/* Puter AI Status */}
                {!puterReady && (
                  <div className="mb-4 rounded-lg border border-amber/30 bg-amber/10 px-4 py-2">
                    <p className="text-[11px] text-amber">
                      {puterInitializing ? "🔄 Initializing Puter AI..." : "⚠️ Puter AI not available. Please refresh the page."}
                    </p>
                  </div>
                )}

                <AmberButton onClick={() => createSessionMutation.mutate()} disabled={!puterReady}>
                  <Plus className="size-3.5" /> New Conversation
                </AmberButton>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {error && (
                  <div className="flex justify-center">
                    <div className="max-w-[80%] rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11px] text-danger">
                      <p className="font-medium">Error: {error}</p>
                      <p className="mt-1">Please try again or check your AI provider configuration in Settings.</p>
                    </div>
                  </div>
                )}
                {messagesLoading ? (
                  <p className="text-center text-[12px] text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 && !isStreaming ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-[11px] text-muted-foreground">
                      Start the conversation by sending a message below.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-[12px] ${
                            m.role === "user"
                              ? "amber-gradient text-primary-foreground"
                              : "bg-secondary/60 text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      </div>
                    ))}
                    {/* Streaming message */}
                    {isStreaming && streamedContent && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg bg-secondary/60 px-3 py-2 text-[12px] text-foreground">
                          <p className="whitespace-pre-wrap break-words">{streamedContent}</p>
                          <div className="mt-1 flex items-center gap-1">
                            <div className="flex gap-0.5">
                              <span className="block size-1 animate-pulse rounded-full bg-amber" />
                              <span className="block size-1 animate-pulse rounded-full bg-amber" style={{ animationDelay: "0.2s" }} />
                              <span className="block size-1 animate-pulse rounded-full bg-amber" style={{ animationDelay: "0.4s" }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground">JANUARY is responding...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Thinking indicator */}
                    {isStreaming && !streamedContent && !error && (
                      <div className="flex justify-center">
                        <div className="rounded-full border border-hairline bg-secondary/40 px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              <span className="block size-1 animate-pulse rounded-full bg-amber" />
                              <span className="block size-1 animate-pulse rounded-full bg-amber" style={{ animationDelay: "0.2s" }} />
                              <span className="block size-1 animate-pulse rounded-full bg-amber" style={{ animationDelay: "0.4s" }} />
                            </div>
                            <span className="text-[11px] text-muted-foreground">JANUARY is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function ChatRail() {
  const [coreState, setCoreState] = useState<string>("idle");
  const [aiStatus, setAiStatus] = useState({
    initialized: false,
    ready: false,
    model: 'gpt-5.4-nano'
  });

  useEffect(() => {
    const unsubscribe = coreStateManager.subscribe((state) => {
      setCoreState(state);
    });

    return unsubscribe;
  }, []);

  // Check AI service status
  useEffect(() => {
    const checkAIStatus = () => {
      const state = januaryAIService.getState();
      setAiStatus({
        initialized: state.initialized,
        ready: state.puterReady,
        model: 'gpt-5.4-nano'
      });
    };

    checkAIStatus();
    const interval = setInterval(checkAIStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Panel>
        <PanelHeader title="JANUARY Core" icon={Sparkles} />
        <div className="space-y-3 p-3">
          <AICore state={coreState} showControls={false} />
          <div className="space-y-2 text-[11px] text-muted-foreground">
            <MetricBar
              label="Status"
              value={coreState === "idle" ? 20 : coreState === "thinking" ? 60 : coreState === "speaking" ? 80 : 40}
              max={100}
              tone="amber"
              showValue={false}
            />
            <div className="flex items-center justify-between">
              <span>AI Engine</span>
              <span className={aiStatus.ready ? "text-[10px] text-amber" : "text-[10px] text-muted-foreground"}>
                {aiStatus.ready ? "Puter AI Ready" : "Initializing..."}
              </span>
            </div>
            <p className="text-[10px]">Model: {aiStatus.model}</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Voice Control" icon={Mic} />
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Text-to-Speech</span>
            <span className="text-[10px] text-amber">Active</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Female voice enabled for JANUARY responses.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Conversation Context" icon={Bookmark} />
        <div className="space-y-2 p-3 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Memory</span>
            <span className="text-[10px] text-amber">Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Project Context</span>
            <span className="text-[10px] text-muted-foreground">When active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Conversation History</span>
            <span className="text-[10px] text-muted-foreground">10 messages</span>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Quick Actions" />
        <div className="p-3">
          <QuickActionGrid
            actions={[
              { icon: FileText, label: "Summarize" },
              { icon: Code2, label: "Explain Code" },
              { icon: Bookmark, label: "Debug Code" },
              { icon: Languages, label: "Translate" },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}
