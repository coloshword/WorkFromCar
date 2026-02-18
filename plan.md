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



### Execute API rewrite:
<cot>
- rewrite the execute api to be a execute with permissions api
- we can name it, executePermission,
    - goal is to 
        1) validate the API params 
        2) ensure that the user has given permissions 

- now to check user intent. We probably need a new set of permissions from the original
- we have messages which is good
- let's see the state of messages...

- our LM now has the ability to have all the messages, we just need one thing, permission, and also the chat. Just a single message that we can append to messages, and whether or not we have permission (true or false). If it is true, then we send the message, false we won't send the email



{
  "assistant": "Great, I’m sending the email to john17@gmail.com now.",
  "executePermissionGranted": true,
  "tool": {
    "tool": "gmail.createDraft",
    "toolParameters": {
      "to": "john17@gmail.com",
      "subject": "Start the email earlier",
      "body": "Hey John, please start the email at 3:45 instead of 4"
    }
  }
}

- ok now that the shape is correct, let's get the update to demo.tsx to do the same thing 

### React native TurboModules
- new architecture, you don't write bridges anymore

- you define a TurboModule spec in TS (which is basically like a specification of the bridge), and react native codegen generates it for you (you don't write your own bridges)
- codegen should run per library/module and RN's codegen/autolinking expects each native library to declare its own codegen config



