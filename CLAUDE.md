# CLAUDE.md

Project context for any Claude Code session working in this repo. See [PROJECT.md](PROJECT.md) for the mission/SDG framing and [README.md](README.md) for technical setup, architecture, and the data pipeline.

## Course context

This is a graded university team project (TUM). Deliverables include:

- The website itself (this repo)
- A separate graded **"Organization Dossier"** written deliverable — not part of this codebase — covering:
  - **Template A (org selection form)**: organization name, organization type, real-world mandate, main SDG focus, crisis/development issue, initial AI-powered project idea, possible partners, one ethical concern, team roles
  - **Organization Overview** (deeper narrative section): the org's real mandate, organization type, why it's the right actor to lead/co-lead, what it can offer, what success looks like after one year, what would make the project fail

The organization referenced throughout (Template A, Organization Overview, and the site's own "inspired by Oxfam" framing in `PROJECT.md`) is **Oxfam** — confirm this is still correct before finalizing the dossier.

## Team

- Xaver Obermaier — frontend architecture/build; author of the Organization Overview dossier section
- A teammate — built the data pipeline (`pipeline/fetch_worldbank_data.py`), working via her own separate Claude session

## Working style

- Coding work and dossier/writing work are kept in separate sessions on purpose, to avoid mixing contexts
- Vanilla HTML/CSS/JS only, no build step, no frameworks — see README.md for the reasoning
