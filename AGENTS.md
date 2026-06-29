<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# UI & Typography Consistency Rules
- **Standardized Page Headers**: Every main dashboard or module page header must use a consistent size, weight, and casing to maintain premium visual cohesion.
  - Heading wrapper classes: `font-heading font-bold tracking-wider text-dash-text uppercase headline-lg` (or standard `32px` font sizing via custom typography systems).
  - Main headings must not use ad-hoc inline font sizes (like `text-4xl` or manual `font-size: 24px` overrides) that conflict with the centralized design system tokens.
