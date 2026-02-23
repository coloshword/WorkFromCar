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
- Now we need to verify: does JSON.parse: parse null string as null?
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

- rewrite the execute api to be a execute with permissions api - we can name it, executePermission, - goal is to 1) validate the API params 2) ensure that the user has given permissions
- now to check user intent. We probably need a new set of permissions from the original
- we have messages which is good
- let's see the state of messages...
- our LM now has the ability to have all the messages, we just need one thing, permission, and also the chat. Just a single message that we can append to messages, and whether or not we have permission (true or false). If it is true, then we send the message, false we won't send the email

{
  "assistant": "Great, I’m sending the email to [john17@gmail.com](mailto:john17@gmail.com) now.",
  "executePermissionGranted": true,
  "tool": {
    "tool": "gmail.createDraft",
    "toolParameters": {
      "to": "[john17@gmail.com](mailto:john17@gmail.com)",
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

### Method signature

```objc
- (void) loadModel: (NSString *) modelPath
    resolve: (RCTPromiseResolveBlock)resolve
      reject: (RCTPromiseRejectBlock) reject 
```

- defines a method signature (void) --> instance method, returns nothing
- first argument is (NSString *) modelPath = first argument 
  - NSString* is iOS's string type
- resolve/reject: the two call backs --> promise callbacks called conditionally on resolving promise or rejecting promise
  - that's why you define two callbacks 
  - they are needed for a Promise<...> turbomodule method

** What this means in TS/JS land**:

- native gets called with (modelPath), but if its awaited / resolves / rejects (promise function), it must include resolve and reject function signature.

```
dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT,0), ^ {
```

- This says "Don't block react native thread, run this on a background thread 
- ^{} --> "block" (like a closure)
  - ^{} --> define a function block (define a function body inside of the braces)

```
struct whipser_context_params params = whisper_context_default_params();
```

struct ... is a C struct from whisper.cpp

- a struct is just a "dumb" object. Just key / value pairs, an object without methods
- Also a fixed size set and known at compile time, because its just a fixed set of fields laid out in memory

```
params.use_gpu = YES;
```

- use the gpu. 
- the struct already has this field defined at compile time

```
struct whisper_context *ctx = whisper_init_from_file_with_params(modelPath.UTF8String, params);
```

- initializes the model by calling the existing `whisper_init_from_file_with_params` function from whisper.cpp's C API (declared in whisper.h), implemented in the library I compiled and linked
- modelPath.UTF8String converts `NSString*` to const char* (CString) (different representation)
- whisper_init_from_file_with_params loads the .bin model file, and returns a pointer to a whisper context `ctx`
- `ctx` is NULL if loading failed 
- context (black box that holds the initialized model), and it can process audio files

### Success path:

```
if (ctx != null) {
  if (self->_ctx) whisper_free(self-> _ctx);  
  self->_ctx = ctx;
}
```

if ctx is not null 

- check the instance variable _ctx, if it is already initialized, you free it by calling whisper_free so you avoid leaking memory 
- then store the new ctx

```
resolve(@YES)
```

- resolves the JS Promise with a boolean true

### Failure path:

- else you fail

```
else {
  reject(@"load_failed", @"whisper_init_from_file returned null", nil)
}
```

### adding whisper voice

- remove react-native-sound from dependencies



- The next thing to do:
- literally implement the pcmBuffer to text function

