# Entity detail design patterns

Reference implementations:
- **Customer details** — `src/features/customers/components/customer-detail-page-content.tsx`
- **Vehicle details** — `src/features/vehicles/components/vehicle-detail-page-content.tsx`
- **Quotation details** — `src/features/quotations/components/quotation-detail-page-content.tsx`
- **Job order details** — `src/features/job-orders/components/job-order-detail-page.tsx`
- **Invoice details** — `src/features/invoices/components/invoice-detail-page-content.tsx`
- **Payment details** — `src/features/invoices/components/payment-detail-page-content.tsx`

Use this guide when building or refactoring other entity detail screens (job orders, invoices, quotations, etc.). Shared primitives live under `src/components/shared/entity-detail/`.

---

## 1. Page anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  Header (full width)                                        │
│  [←] Title + description + metadata pills     [⋯ actions]   │
├──────────────────────────────────┬──────────────────────────┤
│  Main (tabs + tables)            │  Overview sidebar        │
│  Tabs → FilterBar → Table        │  Sectioned label/value   │
└──────────────────────────────────┴──────────────────────────┘
```

### Layout rules

- Use `EntityDetailLayout` with three slots: `header`, `sidebar`, `children` (main).
- **Do not** add a third content column solely for a back button. Back navigation belongs in the header.
- On large screens the main column is primary (records/tabs); the sidebar is sticky and narrower (`~280–320px`).
- Header spans the full content width above the two-column body.

### Shared building blocks

| Concern | Primitive |
|--------|-----------|
| Page shell | `EntityDetailLayout` |
| Title / back / pills / actions | `EntityDetailHeader`, `EntityDetailActions` |
| Right panel card | `EntityDetailSidebar` |
| Sidebar sections / fields | `EntityDetailSection`, `EntityDetailField` |
| Tabs | `EntityDetailTabs`, `EntityDetailTabPanel` |
| Tables | `EntityDataTable*` |
| Status chips in header | `MetadataPill` |
| Overflow actions | `TableRowActionsMenu*` |

---

## 2. Header

### Structure (left → right)

1. **Back control** (optional but required when the page is reached from a listing)
2. **Identity block**: title, short description, metadata pills
3. **Actions**: overflow menu only (`...`)

### Back navigation

- Pass `backHref` (and `backLabel`) to `EntityDetailHeader`.
- Render as a **circular outline chevron** to the left of the title (same row), not a text link above the title and not a dedicated layout column.
- Target the parent listing (e.g. `/customers`), not `router.back()`, so navigation is predictable.

### Metadata pills

- Put high-signal identity facts in the header: status, type, member-since / created date, special flags (e.g. “Fleet customer”).
- These must **not** be repeated in the overview sidebar.

### Header actions

- Do **not** place Edit / Add / Send as standalone primary buttons in the header.
- Collapse all header actions into `TableRowActionsMenu` (`MoreHorizontal`).
- Use `TableRowActionsMenuLink` / `TableRowActionsMenuButton` / confirm variants as needed.

```tsx
<EntityDetailHeader
  title={entity.displayName}
  description="…"
  backHref="/customers"
  backLabel="Back to customers"
  metadata={<>…MetadataPill…</>}
  actions={
    <EntityDetailActions>
      <TableRowActionsMenu label="Customer actions">
        <TableRowActionsMenuLink href="…" label="Edit customer" icon={Pencil} />
        <TableRowActionsMenuLink href="…" label="Add vehicle" icon={Car} />
      </TableRowActionsMenu>
    </EntityDetailActions>
  }
/>
```

---

## 3. Overview sidebar

### Visual pattern

- Card: `EntityDetailSidebar` (rounded border, padded).
- Sections: uppercase muted titles + top rule (`EntityDetailSection`).
- Fields: **2-column row** — label left (`text-muted-foreground`), value right (`text-slate-600 font-medium`), not stacked label-above-value.
- Empty / unset values: **`-`** (built into `EntityDetailField` when children are null/undefined/blank).

### Content rules (critical)

1. **Only real data** — fields that exist on the entity (editable on the form, or real system values once they are generated). No placeholder rows (advisor, secondary phone, messenger, tags, reminders) until the product supports them.
2. **No header duplication** — if it appears as a metadata pill, omit it from the sidebar.
3. **No tab duplication** — don’t show “linked vehicle count” when a Vehicles tab already lists them.
4. **Hide empty sections** when the whole section has nothing useful (e.g. hide “Customer overview” if there is no company name).
5. **Align labels with the edit form** where possible (`Contact number`, `Notes`, not invented synonyms).

### Typography

- Values use **solid slate gray** (`text-slate-600`), not pure black / heavy semibold — overview should not overpower the main column.
- Labels stay quieter (`text-muted-foreground`).

---

## 4. Tabs and record tables

### Tabs

- Use `EntityDetailTabs` + `EntityDetailTabPanel`.
- Sync active tab to the URL (`?tab=…`) when useful; default tab can omit the param.
- One job per tab: related records of a single kind (vehicles, service history, documents).

### Every record list is a table

- No card stacks or free-form lists for scannable records.
- Use `EntityDataTable` / `EntityDataTableHead` (sortable) / etc.
- Keep **equal horizontal padding** on all columns (including first and last). Do not zero out edge padding — tables must not look “cut off.”

### Lean columns

Aim for **4–6 columns**. Prefer scanning over completeness.

| Keep | Drop or fold |
|------|----------------|
| Primary identifier | Separate “type” column → subtitle under identifier |
| Date, status, key amount | Fields only useful on the destination page (linked records) |
| One contextual column (vehicle) | View-only Actions column |

**Fold secondary text** into the primary cell:

```
JO-MAIN-0001
Job order          ← muted caption, not its own column
```

### Search + filters on every table

Above every detail-tab table:

1. `FilterBar`
2. `SearchInput` (client-side)
3. Relevant `NativeSelect` filters (date / status / vehicle / year / …)

Pattern: local React state + `useMemo` filter/sort (Documents / Vehicles / Service history tabs).

Empty states:

- No data at all → “No … yet”
- Filters match nothing → “No … match your filters”

### Row interaction

| Case | Pattern |
|------|---------|
| Only action is view/open | **Clickable row** (`router.push`); no Actions column |
| Multiple actions (edit, delete, …) | Keep `TableRowActionsMenu` in an Actions column |
| Row needs nested detail | **Collapsible table row**: toggle expand; second row with `colSpan` for detail panel (Service history) |

For expandable rows, stop propagation on inner links so expand and navigate don’t fight.

---

## 5. Empty-value convention

Across overview **and** table cells:

- Missing scalar → `-`
- Do not use “Not set”, “No plate”, “No vehicle”, em dashes (`—`) inconsistently
- `EntityDetailField` handles overview empties automatically

---

## 6. Information architecture checklist

Before shipping a new detail screen, verify:

- [ ] Header has back to listing (if applicable)
- [ ] Header actions are in `...` menu
- [ ] Status / type / dates that identify the entity are pills in the header
- [ ] Sidebar only shows editable or real system fields; no placeholders
- [ ] Sidebar does not repeat header pills
- [ ] Each related-record tab is a table with search + filters
- [ ] Tables are lean (≤ ~6 columns); secondary labels folded
- [ ] View-only rows are clickable (no eye-icon Actions column)
- [ ] Nested detail uses expandable table rows, not a separate list UI
- [ ] Empty values are `-`
- [ ] Table edge padding is intact (not flush to the container)

---

## 7. Applying to other screens

Suggested mapping:

| Screen | Listing back | Tabs (examples) | Sidebar |
|--------|--------------|-----------------|---------|
| Customer | `/customers` | Vehicles, Service history, Documents | Contact, address, notes, company |
| Vehicle | `/vehicles` | Service history, Documents | Specs, customer link, notes |
| Job order | `/job-orders` | Line items, payments, documents | Customer, vehicle, dates, totals |
| Quotation | `/quotations` | Line items, Related documents | Party, amounts, status meta |
| Invoice | `/invoices` | Line items, Payments | Customer/vehicle/source, totals, cancel/release meta |
| Payment | `/payments` | None (leaf: balance impact + notes in main) | Customer/vehicle, invoice, source, receipt meta |

Reuse the same primitives; do not invent a parallel layout kit per feature.

---

## 8. Reference files

### Customer
- Page: `src/features/customers/components/customer-detail-page-content.tsx`
- Sidebar: `src/features/customers/components/customer-detail-sidebar.tsx`
- Tabs: `customer-vehicles-tab.tsx`, `customer-service-history-tab.tsx`, `customer-documents-tab.tsx`

### Quotation
- Page: `src/features/quotations/components/quotation-detail-page-content.tsx`
- Sidebar: `src/features/quotations/components/quotation-detail-sidebar.tsx`
- Tabs: `quotation-line-items-tab.tsx`, `quotation-related-documents-tab.tsx`

### Job order
- Page: `src/features/job-orders/components/job-order-detail-page.tsx`
- Sidebar: `src/features/job-orders/components/job-order-detail-sidebar.tsx`
- Tabs: Overview (workflow + notes), Billing, Work items (FilterBar table), Parts usage, Mechanics (FilterBar table)

### Invoice
- Page: `src/features/invoices/components/invoice-detail-page-content.tsx`
- Sidebar: `src/features/invoices/components/invoice-detail-sidebar.tsx`
- Tabs: `invoice-line-items-tab.tsx`, `invoice-payments-tab.tsx` (payments table + record/release/cancel forms when gated)

### Payment
- Page: `src/features/invoices/components/payment-detail-page-content.tsx`
- Sidebar: `src/features/invoices/components/payment-detail-sidebar.tsx`
- Main: balance impact + notes (no related-record tabs; payment is a leaf entity)

### Shared kit
- `src/components/shared/entity-detail/`
- Agent rule: `.cursor/rules/entity-detail-patterns.mdc`
