## Focus purely on the api 

The flow:
User message → /plan endpoint
Response has toolParameters === null?
Yes → Show assistantMessage, stay in plan mode, get next user input, repeat
No → Show assistantMessage, then call /execute with tool + toolParameters
/execute runs the actual action (creates draft, etc.) and returns result
Benefits:
/plan is pure reasoning - no side effects, safe to retry
/execute is where actual actions happen - creates drafts, sends emails, etc.
Clear separation makes it easy to add confirmations ("Execute this action? Y/N")
Client can log/audit all planned actions before execution
Type structure:
```
// /plan response{  assistantMessage: string,  tool: string,  toolParameters: Record<string, any> | null}// /execute request{  tool: string,  toolParameters: Record<string, any>}// /execute response{  success: boolean,  result: any  // tool-specific result}
```
### Plan API
First thing: plan API. The api we hit for purely planning. 
- `api/agent/plan`:
  input:
    {
      messages: Message[]
    }

  output:
    {

    }
