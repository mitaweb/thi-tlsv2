<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:karpathy-guidelines -->
# Karpathy Behavioral Guidelines

**Tradeoff:** Bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding
- State assumptions explicitly. Ask if uncertain.
- Present multiple interpretations instead of picking silently.
- Push back when a simpler approach exists.

## 2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No features/abstractions beyond what was asked.
- Rewrite if 200 lines could be 50.

## 3. Surgical Changes
- Touch only what you must.
- Don't improve/refactor unrelated code.
- Remove only what YOUR changes made unused.

## 4. Goal-Driven Execution
- Define verifiable success criteria.
- State brief plan for multi-step tasks.
- Loop until verified.

**Working if:** fewer unnecessary changes, fewer rewrites, clarifying questions come before implementation.
<!-- END:karpathy-guidelines -->
