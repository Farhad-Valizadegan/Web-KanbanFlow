# KanbanFlow interface

The interface is a skeuomorphic workbench: enamel buttons, machined floating chrome, recessed workflow trays, and paper-like task cards. Light mode resembles a daylight desk; dark mode uses graphite materials for evening work. Keep the product blue, supported by mint, violet, amber, and rose for orientation and semantic states. Consistent light from above defines bevels and cast shadows. Texture stays on the desk background; text sits on clean surfaces.

## Visual system

- Light, dark, and system themes share semantic CSS tokens in `frontend/src/index.css`. Preserve all three modes.
- Use the system sans stack for product UI, a restrained heading scale, generous section spacing, and readable secondary text. Do not add uppercase labels above headings.
- Floating navigation and toolbars use beveled material gradients with offset shadows. Blue enamel actions have a visible raised edge and compress when pressed. Focus rings remain distinct.
- Workflow lanes cycle through blue, violet, mint, and amber as orientation colors, independent of column names. Priority colors always retain their text labels; completed state remains explicit.
- Use the shared SVG `Icon` component rather than Unicode symbols as interface icons.
- Fields and segmented-control tracks are recessed; cards and buttons are raised. Keep explicit borders and high contrast so shadows never become the only affordance.

## Interaction and accessibility

- Motion is visible and purposeful: 520–850ms entrances, staggered hero/card arrivals, spring settling, hover lift, press compression, selected-control engagement, form reveals, and animated native overlays with discrete exit transitions where supported. Sortable wrappers retain dnd-kit transform ownership. No perpetual decorative animation.
- Respect `prefers-reduced-motion`. Keep content visible without animation and provide opaque fallbacks without backdrop filtering.
- Preserve native form semantics, keyboard drag controls, dialog focus trapping, error recovery, and server-authoritative permissions.
- Floating chrome must not cover controls at narrow widths. Board lanes scroll horizontally, while the page itself fits the viewport.
- Board specimens on public/auth screens are explicitly illustrative. Dashboard data comes from the API; do not invent metrics or team claims.

## Scope

The redesign changes presentation and recovery clarity. It does not change authentication, membership permissions, persistence, routes, or API contracts. Application database availability remains an operational prerequisite.
