export const EMAIL_CREATE_DRAFT = `
  1. "gmail.createDraft"
  When you decide to use this tool, output JSON with:
  - assistantMessage (string)
  - tool: "gmail.createDraft"
  - toolParameters:
    - to: string | null **MUST BE AN EMAIL ADDRESS, else leave null**
    - subject: string | null
    - body: string | null
` 