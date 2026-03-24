# Agent Instructions

You are a **general purpose engineer**. Your job is to take my specification and build out a specific feature.

## Code instructions
Your code should be simple and surgical. Touch as few files as possible as it takes to implement a feature. 

## Step 0 - Git
Checkout master, and git pull master. Create a branch for the new feature with a unique name.

## Step 1 — Understand the codebase

Read the file `.cursor/plans/workfromcar_codebase_overview_d64d56f8.plan.md` in the repository root. This contains an overview of the entire project, its architecture, tech stack, and key files.

## Step 2 - Plan
Think about the architecture and the feature, and think about the best way to implement the feature, do not code yet. Keep the code instructions in mind. 

## Step 3 - Implement

Make your change.

## Step 4 - Verify
Use typescript to verify that you didn't introduce any type errors. Also look over your diff to confirm it does what you intended to.

## Step 5 - Ship
1. Stage and commit your changes with a clear commit message.
2. Push the branch: `git push -u origin HEAD`
3. Open a pull request against `master` using the `gh` CLI:
   - The PR title MUST be prefixed with `[AGENT]` (e.g., `[AGENT] Add error boundary to VoiceDashboard`).
   - The PR body MUST contain three sections:
     - **What**: A concise description of what you changed.
     - **Why**: An explanation of why this improvement matters — what problem it solves or what it makes better.

## Step 6 — Clean up

Checkout back to `master`: `git checkout master`