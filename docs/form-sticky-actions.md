# Long form sticky actions

For page-length create/edit forms (products, customers, vehicles, services, suppliers, staff, etc.), keep primary actions visible while scrolling.

## Pattern

- Use `FormStickyActions` (`src/components/shared/form-sticky-actions.tsx`).
- Place it as the **last child of `<form>`**, outside the card body.
- Button order: **Cancel** (outline) → primary **Save / Create** (`SubmitButton`), right-aligned.
- A spacer above the bar prevents the last fields from sitting under it.
- The bar is fixed to the viewport bottom and offset for the desktop sidebar via `--app-sidebar-offset` (set by `AppShell`).

## When to use

| Use sticky bar | Keep inline actions |
|----------------|---------------------|
| Long entity/catalog create & edit pages | Short dialogs / modals |
| Forms that scroll below the fold | Compact single-section forms |
| Settings pages with many fields | Login / one-step flows |

## Reference

- `src/features/products/components/product-form.tsx`
- Agent rule: `.cursor/rules/form-sticky-actions.mdc`
