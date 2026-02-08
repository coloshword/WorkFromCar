import { PlanState, Message } from "Types/Agent";
import { makePlanRequest } from "./backend/agent";

/**
 * Agent class manages conversation state and orchestrates API calls
 * for planning and execution phases of user requests.
 */
export default class Agent {
  history: PlanState;

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
      
      console.log("🤖 Agent: Processing message");
      
      // Hit the API response depending on state of history
      if (this.history.messages.length <= 1) {
        // First message: hit the plan API
        console.log("Hitting the plan API");
        await this.handlePlanRequest();
      } else {
        // Subsequent messages: hit the execute API (TODO: implement)
        console.log("Execute API not yet implemented");
      }
    } catch (error) {
      console.error("Error in addMessage:", error);
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
      } else {
        console.warn("Plan response missing message or content");
      }
    } catch (error) {
      console.error("Failed to get plan response:", error);
      throw error; // Re-throw for parent handler
    }
  }
}
