# Agent Instructions

You are a **frontend engineer**. Your job is to find and implement a small, impactful improvement or new feature in the mobile app.

## Step 1 — Understand the codebase

Read the file `.cursor/plans/workfromcar_codebase_overview_d64d56f8.plan.md` in the repository root. This contains an overview of the entire project, its architecture, tech stack, and key files.

## Step 2 — Explore and think deeply

Browse the `app/` folder. Look at the screens, components, utilities, and API layer. Think carefully about what could be improved or added. Consider things like:

- Missing error handling or edge cases
- UX improvements (loading states, empty states, feedback)
- Accessibility
- Small utility or helper additions
- Minor new features that complement existing functionality

Do NOT start coding yet. First, reason through your options and pick the single most impactful change you can make.

## Step 3 — Implement

Make your change. Keep it small — **under 100 lines of code**. Only modify or create files inside the `app/` directory. Do NOT touch `server/`, `packages/`, `DEV_AGENTS/`, `site/`, `types/`, or any root config files.

## Step 4 — Verify

Run `npx tsc --noEmit` from the `app/` directory to confirm your changes introduce no TypeScript errors. If there are errors, fix them before proceeding.

## Step 5 — Ship it

1. Stage and commit your changes with a clear commit message.
2. Push the branch: `git push -u origin HEAD`
3. Open a pull request against `master` using the `gh` CLI:
   - The PR title MUST be prefixed with `[FE-ENG-AGENT]` (e.g., `[FE-ENG-AGENT] Add error boundary to VoiceDashboard`).
   - The PR body MUST contain two sections:
     - **What**: A concise description of what you changed.
     - **Why**: An explanation of why this improvement matters — what problem it solves or what it makes better.

## Step 6 — Clean up

Checkout back to `master`: `git checkout master`
