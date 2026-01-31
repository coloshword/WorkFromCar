import { AgentState, Message } from "Types/Agent";
import { makePlanRequest } from "./backend/agent";
import { ttsSpeak, pauseListening, resumeListening, ttsIsSpeaking } from "expo-whisper";

/**
 * Agent class manages conversation state and orchestrates API calls
 * for planning and execution phases of user requests.
 */
export default class Agent {
  history: AgentState;

  constructor() {
    this.history = {
      messages: []
    };
  }

  /**
   * Adds a message to the conversation history and triggers appropriate API calls.
   * 
   * @param message - The message to add to the conversation
   * @returns Promise that resolves when the message is processed
   * @throws Will log errors but not throw to prevent UI crashes
   */
  async addMessage(message: Message): Promise<void> {
    try {
      this.history.messages.push(message);
      
      // Pause listening while processing (prevents hearing its own speech)
      pauseListening();
      console.log("🤖 Agent: Paused listening for processing");
      
      // Hit the API response depending on state of history
      if (this.history.messages.length <= 1) {
        // First message: hit the plan API
        console.log("Hitting the plan API");
        await this.handlePlanRequest();
      } else {
        // Subsequent messages: hit the execute API (TODO: implement)
        console.log("Execute API not yet implemented");
        // Resume listening since we didn't do anything
        resumeListening();
        console.log("🤖 Agent: Resumed listening (no action taken)");
      }
    } catch (error) {
      console.error("Error in addMessage:", error);
      // Resume listening on error
      resumeListening();
      console.log("🤖 Agent: Resumed listening after error");
      // Don't rethrow to prevent UI crashes - errors are logged
    }
  }

  /**
   * Handles the plan request to the backend and processes the response.
   * @private
   */
  private async handlePlanRequest(): Promise<void> {
    try {
      const planResponse = await makePlanRequest(this.history);
      console.log("Plan response received:", planResponse);
      
      if (planResponse?.message?.content) {
        this.history.messages.push(planResponse.message);
        
        // Speak the response using TTS
        try {
          ttsSpeak(planResponse.message.content);
          
          // Wait for TTS to complete, then resume listening
          await this.waitForTTSComplete();
          
        } catch (ttsError) {
          console.error("TTS failed:", ttsError);
          // Resume listening even if TTS fails
          resumeListening();
          console.log("🤖 Agent: Resumed listening after TTS error");
        }
      } else {
        console.warn("Plan response missing message or content");
        // Resume listening if no response content
        resumeListening();
        console.log("🤖 Agent: Resumed listening (no response content)");
      }
    } catch (error) {
      console.error("Failed to get plan response:", error);
      // Resume listening on error
      resumeListening();
      console.log("🤖 Agent: Resumed listening after plan request error");
      throw error; // Re-throw for parent handler
    }
  }
  
  /**
   * Waits for TTS to complete by polling the speaking status.
   * @private
   */
  private async waitForTTSComplete(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!ttsIsSpeaking()) {
          clearInterval(checkInterval);
          // Resume listening after TTS completes
          resumeListening();
          console.log("🤖 Agent: TTS complete, resumed listening");
          resolve();
        }
      }, 100); // Check every 100ms
      
      // Safety timeout - max 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resumeListening();
        console.log("🤖 Agent: TTS timeout, resumed listening");
        resolve();
      }, 30000);
    });
  }
}
