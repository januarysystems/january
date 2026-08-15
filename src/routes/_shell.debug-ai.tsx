/**
 * AI Debug Page - For testing AI pipeline independently
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, AmberButton, GhostButton, PageHeader } from "@/components/january/AppShell";
import { Panel, PanelHeader } from "@/components/january/primitives";

export const Route = createFileRoute("/_shell/debug-ai")({
  head: () => ({
    meta: [
      { title: "AI Debug — JANUARY diagnostics" },
      {
        name: "description",
        content: "Debug and test JANUARY AI pipeline independently.",
      },
    ],
  }),
  component: AIDebugPage,
});

function AIDebugPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testPuterAI = async () => {
    setIsLoading(true);
    addResult("🔧 Starting Puter AI test...");

    try {
      const { januaryAIService } = await import("@/lib/ai/january-ai-service");
      await januaryAIService.initialize();

      const state = januaryAIService.getState();
      addResult(`   Puter Ready: ${state.puterReady}`);
      addResult(`   Puter Initialized: ${state.initialized}`);

      if (state.puterReady) {
        const response = await januaryAIService.generateResponse("Hello JANUARY, can you hear me?", {
          conversationId: null,
          messages: []
        });

        addResult(`✅ Puter AI test completed`);
        addResult(`   Success: ${response.success}`);

        if (response.success && response.content) {
          addResult(`   Response: ${response.content.substring(0, 100)}...`);
        } else {
          addResult(`   ❌ Error: ${response.error}`);
        }
      } else {
        addResult(`❌ Puter AI not ready`);
      }
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testProviders = async () => {
    setIsLoading(true);
    addResult("🔧 Checking available AI providers...");

    try {
      const { getProviders } = await import("@/routes/-api.ai.chat");
      const providers = await getProviders();

      addResult(`✅ Found ${providers.length} providers:`);
      providers.forEach((p: any) => {
        addResult(`   - ${p.name} (${p.id}): ${p.configured ? "✅ Configured" : "❌ Not configured"}`);
        if (p.models && p.models.length > 0) {
          addResult(`     Models: ${p.models.join(", ")}`);
        }
      });
    } catch (error) {
      addResult(`❌ Provider check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBrowserSupport = () => {
    addResult("🔧 Checking browser support...");

    // Speech Synthesis
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      addResult(`✅ Speech Synthesis supported (${voices.length} voices)`);

      const femaleVoices = voices.filter(v =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("victoria") ||
        v.name.toLowerCase().includes("google")
      );
      addResult(`   Female/preferred voices: ${femaleVoices.length}`);
    } else {
      addResult("❌ Speech Synthesis not supported");
    }

    // Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      addResult("✅ Speech Recognition supported");
    } else {
      addResult("❌ Speech Recognition not supported");
    }

    // EventSource (for streaming)
    if ("EventSource" in window) {
      addResult("✅ EventSource (streaming) supported");
    } else {
      addResult("❌ EventSource not supported");
    }
  };

  const testTextToSpeech = () => {
    addResult("🔧 Testing Text-to-Speech...");

    if (!("speechSynthesis" in window)) {
      addResult("❌ Speech Synthesis not available");
      return;
    }

    const utterance = new SpeechSynthesisUtterance("Hello. I am JANUARY.");
    utterance.onstart = () => addResult("✅ TTS started speaking");
    utterance.onend = () => addResult("✅ TTS finished speaking");
    utterance.onerror = (e) => addResult(`❌ TTS error: ${e}`);

    window.speechSynthesis.speak(utterance);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <AppShell promptPlaceholder="Debug AI pipeline..." rightPanel={null}>
      <PageHeader
        title="AI Pipeline Debug"
        subtitle="Test JANUARY AI components independently"
      />

      <Panel className="mb-3">
        <PanelHeader title="Diagnostic Tests" />
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <AmberButton onClick={testProviders} disabled={isLoading}>
            Check Providers
          </AmberButton>
          <AmberButton onClick={testProviders} disabled={isLoading}>
            Check Providers
          </AmberButton>
          <AmberButton onClick={testPuterAI} disabled={isLoading}>
            Test Puter AI
          </AmberButton>
          <GhostButton onClick={testBrowserSupport} disabled={isLoading}>
            Browser Support
          </GhostButton>
          <GhostButton onClick={testTextToSpeech} disabled={isLoading}>
            Test TTS
          </GhostButton>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Test Results"
          action={
            testResults.length > 0 ? (
              <button
                onClick={clearResults}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            ) : null
          }
        />
        <div className="min-h-[300px] space-y-1 p-4 font-mono text-[11px]">
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">Run a test to see results...</p>
          ) : (
            testResults.map((result, i) => (
              <div key={i} className={result.startsWith("✅") ? "text-green-600" : result.startsWith("❌") ? "text-red-600" : "text-foreground"}>
                {result}
              </div>
            ))
          )}
        </div>
      </Panel>
    </AppShell>
  );
}
