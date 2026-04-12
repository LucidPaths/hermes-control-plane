---
type: person
title: Priya Patel
tags:
  - technical
  - ai-research
---

# Priya Patel

CTO and co-founder of NovaMind. Stanford CS PhD (2022), where her dissertation focused
on emergent communication in multi-agent systems. Before Stanford, she did her
undergraduate CS degree at IIT Bombay. After her PhD she joined Google Brain as a
research scientist (2022-2024), publishing several papers on multi-agent coordination
and task decomposition.

Priya designed NovaMind's core multi-agent coordination layer. Her academic work at
Stanford on emergent communication protocols directly informs how NovaMind agents
negotiate task handoffs and share intermediate state. She is the technical counterpart
to Sarah Chen's product and business vision.

## Research Background

- Stanford CS PhD dissertation: "Emergent Communication Protocols in Cooperative
  Multi-Agent Systems" (2022)
- Google Brain publications on learned task decomposition and agent specialization
- Key insight from her research: agents that develop their own communication protocols
  outperform those using human-designed message schemas

## Technical Contributions at NovaMind

- Designed the supervisor agent architecture that handles error recovery and re-planning
- Built the "compiled procedures" system where agents learn reusable sub-routines
- Developed the evaluation framework that measures task completion reliability (94%
  completion rate on 47-step workflows)

---

## Timeline

### 2025-03-22 — Technical Deep Dive (via Sarah)

Sarah Chen described Priya's architecture during our follow-up call. The multi-agent
coordination layer uses a learned protocol rather than hardcoded message passing.
Agents can recruit specialist sub-agents dynamically based on task requirements. Priya
apparently benchmarked this against LangGraph and CrewAI, showing 3x better error
recovery on complex workflows.
