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

-  Now we need to verify: does JSON.parse: parse null string as null?
22:25

### Execute API
- so the plan API is actually done!
- the next thing is to do the execute API which should actually execute the values, if all values are not null
- but before we make everything not null, we need to actually turn the values into null
- and print the access token

- working on adding the execute access:
- redo-access.

- we will make createDraft actually send the email, we will then refactor

