User: /sandbox policy

GitHub Copilot: I’m checking the repo and the current request context to identify exactly what “/sandbox policy” applies here and then I’ll complete it.

## Sandbox policy

I operate within the workspace sandbox only. That means:

- I can read and modify files in the current project/workspace.
- I cannot access or alter files outside the sandbox unless the user explicitly provides a valid in-scope path.
- I should avoid actions that reach beyond the workspace, system files, or unrelated environments.
- Any command or file operation should be limited to the project context and be justified by the task.

If you want, I can continue with a specific repo task next.

User: /init 

GitHub Copilot: I’m exploring the repo conventions and the existing docs first so I can add the right chat customization files without duplicating project guidance.

Read [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA)

Searched for files matching `**/{AGENTS.md,AGENT.md,.github/copilot-instructions.md,CLAUDE.md,.cursorrules,.windsurfrules,.clinerules,README.md,docs/**/*.md}`, 6 matches

Read skill [agent-customization](file:///c%3A/Users/202401498/.vscode/extensions/github.copilot-chat-0.48.1/assets/prompts/skills/agent-customization/SKILL.md?vscodeLinkType%3Dskill)

Read [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA/BINV32202-groupe-05/README.md)

Read [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA/BINV32202-groupe-05/package.json)

Read [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA/BINV32202-groupe-05/backend/package.json)

Read [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA/BINV32202-groupe-05/frontend/package.json)

I’ve confirmed the project’s conventions and I’m writing a repo-level instruction file that links to the existing docs rather than duplicating them.

Created [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA/BINV32202-groupe-05/AGENTS.md)

Read [](file:///c%3A/Users/202401498/OneDrive%20-%20Haute%20Ecole%20L%C3%A9onard%20de%20Vinci/BAC3/IA/projet_IA/BINV32202-groupe-05/AGENTS.md)

## ✅ Project guidance file added

I created AGENTS.md and verified the file contents after creation.

| File | Why it helps AI coding agents |
|---|---|
| AGENTS.md | Gives repo-wide context for the stack, root commands, architecture boundaries, and validation expectations, while linking to the existing project docs instead of duplicating them. |

This keeps the guidance lightweight but immediately useful for future coding work in this repo.

### Suggested next customization
A strong follow-up would be a backend-focused skill for migration/auth workflows, for example a `/create-skill backend-workflow` instruction set. It would be useful for tasks involving database changes, permissions, and API validation without forcing the agent to rediscover project conventions each time.

Made changes.