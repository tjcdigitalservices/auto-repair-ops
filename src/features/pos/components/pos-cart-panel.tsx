"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PosCartItem, PosCustomerOption, PosTerminalConfig } from "@/features/pos/types";
import {
  decrementCartItem,
  incrementCartItem,
  removeCartItem,
} from "@/features/pos/utils";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/features/invoices/types";
import {
  formatCurrency,
  formatMoneyInputValue,
  MONEY_INPUT_STEP,
} from "@/lib/currency";
import { cn } from "@/lib/utils";

type PosCartPanelProps = {
  config: PosTerminalConfig;
  customers: PosCustomerOption[];
  items: PosCartItem[];
  customerId: string;
  discount: string;
  paymentMethod: PaymentMethod;
  paymentAmount: string;
  paymentTouched: boolean;
  subtotal: number;
  discountValue: number;
  tax: number;
  total: number;
  statusMessage?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  onCustomerChange: (customerId: string) => void;
  onDiscountChange: (value: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPaymentAmountChange: (value: string) => void;
  onItemsChange: (items: PosCartItem[]) => void;
};

export function PosCartPanel({
  config,
  customers,
  items,
  customerId,
  discount,
  paymentMethod,
  paymentAmount,
  paymentTouched,
  subtotal,
  discountValue,
  tax,
  total,
  statusMessage,
  fieldErrors,
  onCustomerChange,
  onDiscountChange,
  onPaymentMethodChange,
  onPaymentAmountChange,
  onItemsChange,
}: PosCartPanelProps) {
  const resolvedPaymentAmount =
    config.allowPartialPayments && paymentTouched
      ? paymentAmount
      : formatMoneyInputValue(total);

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col rounded-xl border border-border/70 bg-card shadow-sm lg:sticky lg:top-4 lg:w-[35%] lg:max-w-[420px] lg:self-start lg:max-h-[calc(100dvh-7rem)]">
      <div className="border-b border-border/60 px-3 py-2.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Current sale
        </p>
        <div className="mt-2 space-y-1.5">
          <Label htmlFor="customerId" className="sr-only">
            Customer
          </Label>
          <select
            id="customerId"
            name="customerId"
            value={customerId}
            onChange={(event) => onCustomerChange(event.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Walk-in customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.label}
              </option>
            ))}
          </select>
          <FieldError errors={fieldErrors} name="customerId" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <FormStatusMessage message={statusMessage} />

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
            Tap a product to add it to the sale.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.productId}
                className="rounded-lg border border-border/60 bg-muted/15 px-2.5 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku ?? "No SKU"} · {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onItemsChange(removeCartItem(items, item.productId))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7"
                      aria-label={`Decrease quantity for ${item.name}`}
                      onClick={() => onItemsChange(decrementCartItem(items, item.productId))}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="min-w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7"
                      aria-label={`Increase quantity for ${item.name}`}
                      disabled={item.quantity >= item.availableQuantity}
                      onClick={() => onItemsChange(incrementCartItem(items, item.productId))}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <FieldError errors={fieldErrors} name="items" />
      </div>

      <div className="mt-auto border-t border-border/60 bg-card p-3">
        <div className="space-y-1.5 text-sm">
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="discount" className="text-muted-foreground">
              Discount
            </Label>
            <Input
              id="discount"
              name="discount"
              inputMode="decimal"
              type="number"
              step={MONEY_INPUT_STEP}
              value={discount}
              onChange={(event) => onDiscountChange(event.target.value)}
              className="h-8 w-28 text-right tabular-nums"
            />
          </div>
          <FieldError errors={fieldErrors} name="discount" />
          <SummaryRow
            label={`Tax (${config.defaultTaxRate}%)`}
            value={formatCurrency(tax)}
          />
          <SummaryRow label="Total" value={formatCurrency(total)} emphasized />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="paymentMethod" className="text-xs text-muted-foreground">
              Payment method
            </Label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError errors={fieldErrors} name="paymentMethod" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="paymentAmount" className="text-xs text-muted-foreground">
              Payment amount
            </Label>
            <Input
              id="paymentAmount"
              name="paymentAmount"
              inputMode="decimal"
              type="number"
              step={MONEY_INPUT_STEP}
              value={resolvedPaymentAmount}
              readOnly={!config.allowPartialPayments}
              onChange={(event) => onPaymentAmountChange(event.target.value)}
              className="h-9 tabular-nums"
            />
            <FieldError errors={fieldErrors} name="paymentAmount" />
          </div>
        </div>

        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            More checkout options
          </summary>
          <div className="mt-2 space-y-2">
            <div className="space-y-1">
              <Label htmlFor="referenceNumber" optional className="text-xs">
                Reference number
              </Label>
              <Input id="referenceNumber" name="referenceNumber" className="h-9" />
              <FieldError errors={fieldErrors} name="referenceNumber" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes" optional className="text-xs">
                Sale notes
              </Label>
              <Textarea id="notes" name="notes" rows={2} className="min-h-[72px] resize-none" />
              <FieldError errors={fieldErrors} name="notes" />
            </div>
          </div>
        </details>

        <SubmitButton
          className="mt-3 h-11 w-full text-base"
          pendingLabel="Completing sale..."
          disabled={items.length === 0 || total <= 0}
        >
          Checkout · {formatCurrency(total)}
        </SubmitButton>
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className={cn(emphasized ? "font-medium text-foreground" : "text-muted-foreground")}>
        {label}
      </p>
      <p className={cn("tabular-nums", emphasized ? "text-lg font-semibold text-foreground" : "font-medium")}>
        {value}
      </p>
    </div>
  );
}
