Title: trAIde UI Security, Code Quality, and UX Review

Scope
- App: apps/traide-ui (Next.js, client-heavy)
- Focus: security risks, code quality, UX/perf, accessibility

Top Risks (Prioritized)
- XSS in Rich Text: `dangerouslySetInnerHTML` renders unsanitized HTML from `localStorage` inside a contentEditable panel.
  - File: apps/traide-ui/src/components/panels/RichTextPanel.tsx
  - Risk: Persistent DOM XSS via pasted HTML or crafted payload. Scripts/handlers can execute in-app.
  - Action: Sanitize on save/load with a strict allowlist (e.g., DOMPurify). Strip `script`, event handlers, and `style`. Whitelist tags: p, b, i, strong, em, ul, li, h1–h3, a[href|target|rel]. Force `rel="noopener noreferrer"` for links; block data/javascript URLs.
- SSRF via Proxy Base: `/api/mcp` proxy resolves target from a user-controlled cookie (`mcp`).
  - File: apps/traide-ui/src/app/api/mcp/[...path]/route.ts, apps/traide-ui/src/lib/config.tsx
  - Risk: If deployed server-side with network reachability, an attacker setting `mcp` could proxy requests to internal services.
  - Action: Validate base URL strictly server-side: allow only http/https, enforce host allowlist/regex, deny private CIDRs unless explicitly enabled by env var. Cap redirect depth and response size. Consider pinning to configured `NEXT_PUBLIC_MCP_BASE_URL` in prod builds.
- Missing CSP/Headers: No Content Security Policy or clickjacking protections.
  - Risk: Increases blast radius for any injection.
  - Action: Add a basic CSP via Next middleware or headers and `X-Frame-Options: DENY` (or frame-ancestors 'none') where appropriate.

High-Impact UX/Perf
- Drag Grid Focus: Arrow-key movement handler on `TileCanvas` won’t fire because the container isn’t focusable.
  - File: apps/traide-ui/src/components/canvas/TileCanvas.tsx
  - Action: Add `tabIndex={0}` and visible focus outline for accessibility; ensure `onKeyDown` attaches to that focusable element.
- Drag Feedback Consistency: Drag has a ghost overlay and semi-transparent tile; ensure no initial-frame jump.
  - File: TileCanvas.tsx
  - Action: Set initial ghost transform immediately on drag start using the tile’s current grid position.
- Resize Feedback: Resizing tiles applies changes on mouseup only.
  - Action: Optional: Add a resize ghost with live preview using the same `autoArrange` approach for consistency.
- Metrics Reactivity: Column width calculation is tied to `canvasRef.current?.clientWidth` in a `useMemo`, which won’t trigger updates on container resizes alone.
  - File: TileCanvas.tsx
  - Action: Use `ResizeObserver` on the canvas to recompute metrics (cols/colW) and re-render when width changes.
- rAF Compute Throttle: Preview layout is computed on each mousemove before rAF.
  - File: TileCanvas.tsx
  - Action: Move compute into the rAF callback with a latest-pointer ref to reduce CPU on rapid mousemove.

Security Review (Details)
- Rich Text (Critical):
  - `dangerouslySetInnerHTML` and `contentEditable` store/render arbitrary HTML.
  - Recommendations:
    - Sanitize with DOMPurify on both `onInput` and when loading from storage.
    - Keep a plain-text or Markdown storage option for safer persistence.
    - Disable paste of images/iframes; normalize links to safe protocols.
- Proxy/MCP Base (High):
  - Client sets cookie `mcp` that the server uses to route upstream; this is a classic SSRF vector.
  - Recommendations:
    - Server: Accept base only from an allowlist (env-configured). Fallback to default in dev. Reject unknown hosts.
    - Validate: `new URL(base)`, scheme http(s), length limits; reject credentials (`user:pass@host`).
    - Consider not proxying arbitrary paths; explicitly map allowed endpoints.
    - Set a timeout and maximum response bytes; avoid streaming blind to client for non-SSE.
- SSE Usage:
  - `useSSE` includes backoff and visibility pause; good cleanup on unmount. Ensure `withCredentials: false` remains.
  - Recommendation: Add a maximum retry cap or user notification if repeat failures persist.
- LocalStorage Use:
  - Layouts and prefs are stored with try/catch; fine. Consider versioning keys and bounds-checking numbers.
- Error Handling:
  - Global error page logs to console; OK for dev. In prod, integrate Sentry (or disable verbose logs) to avoid leaking details.

Code Quality
- Centralize Layout Engine:
  - `autoArrange` lives in `TileCanvas` while `moveElement/compactVertical/ensureNoOverlap` are in `engine.ts`.
  - Action: Move `autoArrange` into `engine.ts` for consistency and easier testing.
- Event Listener Hygiene: Most overlays clean up listeners appropriately; keep this pattern.
- Type Safety:
  - Prefer explicit return types on public hooks/components (already largely present). Avoid `any` in render props where possible.
- Imports and Dynamic Load:
  - `OverlayChart` dynamic import with `ssr: false` is appropriate. Verify tree-shaking and bundle size if charts grow.

Performance
- Charts:
  - `OverlayChart` removes and recreates overlay series on overlay changes; acceptable for small counts. If overlays grow, consider diffing series.
- Market Cache:
  - Simple LRU cap at 200 entries; good. Consider exposing metrics (hit/miss) for debugging.
- Concurrency Limiter:
  - Simple queue; OK. Consider abort signals on scheduled fetches when components unmount.

Accessibility
- Focus Management:
  - Make `TileCanvas` container focusable (`tabIndex={0}`) and indicate focus visibly. Ensure keyboard move is discoverable (tooltip/help?).
- Tables:
  - `DataTable` uses roles/aria-sort and button-based sorting; good. Consider `scope="col"` on headers and `aria-live` for sort changes if needed.
- Buttons and Labels:
  - Many buttons include `aria-label`/`title`; continue consistency.

Networking/Headers
- Add security headers via Next config or middleware:
  - `Content-Security-Policy` (script-src 'self'; connect-src 'self' MCP_BASE; img-src 'self' data:; style-src 'self' 'unsafe-inline' if Tailwind needs it)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: no-referrer-when-downgrade` or stricter
  - `Permissions-Policy` minimal
  - `X-Frame-Options` or `frame-ancestors` in CSP

Testing/Observability
- Tests cover layout engine and key UI helpers. Add:
  - Sanitization tests for `RichTextPanel` once DOMPurify is integrated.
  - Proxy base validation unit tests (server route) for allow/deny cases.
  - A11y smoke checks (e.g., `tabIndex` presence on canvas; `aria-sort` changes on sort).

Concrete Fix List (Suggested Order)
- [Critical] Sanitize RichTextPanel content on load/save; enforce safe link attributes.
- [High] Harden `/api/mcp` proxy base resolution with allowlist and scheme validation; gate internal CIDRs unless explicitly allowed.
- [High] Add `tabIndex={0}` and visible focus to `TileCanvas`; init ghost transform at drag start.
- [Medium] Add `ResizeObserver` for metrics; rAF-queue preview compute.
- [Medium] Add minimal CSP and security headers.
- [Nice] Centralize `autoArrange` in `engine.ts`; consider live resize preview.

