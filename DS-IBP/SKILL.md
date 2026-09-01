---
name: ibp-design
description: Use this skill to generate well-branded interfaces and assets for IBP (Investment Banking Platform), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and vanilla HTML/CSS UI components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

This design system is vanilla HTML/CSS (no React). Components live as documentation pages under `pages/` and as CSS classes in `styles/`; the single style entry point is `styles.css` (mirror `ds.css` for screens). Detailed working rules, checklists, and constraints are in `CLAUDE.md`; a one-file overview of every component for screen assembly is `specs/_cheatsheet.md`.
