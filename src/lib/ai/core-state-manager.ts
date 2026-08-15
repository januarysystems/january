/**
 * JANUARY Core State Manager
 *
 * Global state manager for JANUARY 3D Core lifecycle states.
 * Connects AI interactions to the visual Core states.
 *
 * States:
 * - idle: Default state, no active AI interaction
 * - listening: JANUARY is listening for user input (future)
 * - thinking: AI is processing/generating response
 * - speaking: JANUARY is speaking via TTS
 * - success: Successful operation completed
 * - error: Error occurred during AI interaction
 */

import type { CoreState } from "@/components/january/JanuaryCore";

type StateListener = (state: CoreState) => void;

class CoreStateManager {
  private state: CoreState = "idle";
  private listeners: Set<StateListener> = new Set();
  private stateTimeouts: Map<CoreState, NodeJS.Timeout> = new Map();

  /**
   * Get current state
   */
  getState(): CoreState {
    return this.state;
  }

  /**
   * Set state and notify all listeners
   */
  setState(newState: CoreState): void {
    if (this.state === newState) return;

    // Clear any pending timeout for the current state
    const timeout = this.stateTimeouts.get(this.state);
    if (timeout) {
      clearTimeout(timeout);
      this.stateTimeouts.delete(this.state);
    }

    this.state = newState;

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (error) {
        console.error("Error in state listener:", error);
      }
    });
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);

    // Immediately call with current state
    try {
      listener(this.state);
    } catch (error) {
      console.error("Error in initial state listener:", error);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Set state with automatic timeout to return to idle
   */
  setStateWithTimeout(newState: CoreState, timeoutMs: number): void {
    this.setState(newState);

    // Clear any existing timeout for this state
    const existingTimeout = this.stateTimeouts.get(newState);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to return to idle
    const timeout = setTimeout(() => {
      this.setState("idle");
      this.stateTimeouts.delete(newState);
    }, timeoutMs);

    this.stateTimeouts.set(newState, timeout);
  }

  /**
   * Convenience method for starting AI thinking
   */
  startThinking(): void {
    this.setState("thinking");
  }

  /**
   * Convenience method for stopping AI thinking
   */
  stopThinking(returnToIdle: boolean = true): void {
    if (returnToIdle) {
      this.setState("idle");
    }
  }

  /**
   * Convenience method for starting TTS
   */
  startSpeaking(): void {
    this.setState("speaking");
  }

  /**
   * Convenience method for stopping TTS
   */
  stopSpeaking(returnToIdle: boolean = true): void {
    if (returnToIdle) {
      this.setState("idle");
    }
  }

  /**
   * Convenience method for showing error state
   */
  showError(): void {
    this.setStateWithTimeout("error", 3000);
  }

  /**
   * Convenience method for showing success state
   */
  showSuccess(): void {
    this.setStateWithTimeout("success", 2000);
  }

  /**
   * Reset to idle state
   */
  reset(): void {
    this.setState("idle");
    // Clear all pending timeouts
    this.stateTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.stateTimeouts.clear();
  }
}

// Global singleton instance
export const coreStateManager = new CoreStateManager();

/**
 * React hook for accessing core state
 * (Can be used in React components)
 */
export function useCoreState(): [CoreState, (state: CoreState) => void] {
  // This would typically use React state, but for simplicity
  // we return the manager methods. Components should use
  // coreStateManager.subscribe() in useEffect.
  return [coreStateManager.getState(), (state) => coreStateManager.setState(state)];
}
