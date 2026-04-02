<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# Project Guardrails (MUST FOLLOW)

## 1. Scope Discipline
- ONLY work on the scope defined in the assigned issue.
- DO NOT implement features outside the issue.
- DO NOT "anticipate" or "add extra improvements".

## 2. Frontend vs Backend Separation
- If the issue is frontend-only:
  - DO NOT create or modify API routes
  - DO NOT modify database schema or Prisma files
  - DO NOT introduce backend logic of any kind

- Backend work will be handled separately.

## 3. Authentication Rules
- DO NOT implement or modify authentication unless explicitly assigned.
- DO NOT introduce custom auth logic.
- Auth must follow the defined Auth.js + Prisma approach only.

## 4. No AI Overreach
- DO NOT generate large blocks of unrelated code.
- DO NOT scaffold entire systems (API, auth, DB) unless explicitly required.
- Keep changes minimal, focused, and relevant.

## 5. UI Consistency (VERY IMPORTANT)
- ALWAYS prefer components from `@/components/ui`
- DO NOT create new UI components unless absolutely necessary
- Reuse existing components for consistency

## 6. Styling & Frameworks
- Tailwind CSS v4 is used in this project.
- DO NOT assume Tailwind syntax from memory.
- Before writing any Tailwind classes, you MUST verify them against:
  - Official Tailwind docs, OR
  - Project dependencies and configuration
- DO NOT use deprecated or outdated Tailwind patterns.

## 7. Icons
- `lucide-react` does NOT include brand icons (GitHub, LinkedIn, etc.)
- DO NOT try to import them from lucide-react
- Use alternatives if needed (e.g. custom SVGs)

## 8. Mock Data Only (Frontend Phase)
- For UI issues:
  - Use mock data only
  - DO NOT connect to APIs
  - DO NOT attempt data fetching

## 9. Read Before You Write
- Always check:
  - Existing codebase patterns
  - Installed library docs
- Do NOT assume older patterns still apply

## 10. Keep It Small
- Prefer small, incremental changes
- Avoid massive commits or sweeping rewrites

---

# Summary

Stay within scope.  
Do not touch backend unless asked.  
Do not reinvent components.  
Do not over-engineer.

When in doubt: do LESS, not more.
<!-- END:nextjs-agent-rules -->
