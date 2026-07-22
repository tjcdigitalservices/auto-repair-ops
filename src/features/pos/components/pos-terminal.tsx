"use client";

import { useActionState, useState } from "react";

import { completePosSaleAction } from "@/features/pos/actions/pos-actions";
import { PosCartPanel } from "@/features/pos/components/pos-cart-panel";
import { PosProductCatalog } from "@/features/pos/components/pos-product-catalog";
import type { PosCartItem, PosTerminalData } from "@/features/pos/types";
import {
  addProductToCart,
  calculatePosSubtotal,
  calculatePosTax,
  calculatePosTotal,
  serializePosItems,
  toNumericInput,
} from "@/features/pos/utils";
import type { PaymentMethod } from "@/features/invoices/types";
import { formatMoneyInputValue } from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";

export function PosTerminal({ terminal }: { terminal: PosTerminalData }) {
  const [state, formAction] = useActionState(completePosSaleAction, INITIAL_FORM_ACTION_STATE);
  const [productCatalog, setProductCatalog] = useState(terminal.products);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(formatMoneyInputValue(0));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [items, setItems] = useState<PosCartItem[]>([]);

  const subtotal = calculatePosSubtotal(items);
  const discountValue = toNumericInput(discount);
  const tax = calculatePosTax({
    subtotal,
    discount: discountValue,
    taxRate: terminal.config.defaultTaxRate,
  });
  const total = calculatePosTotal({ subtotal, discount: discountValue, tax });

  function handleAddProduct(productId: PosCartItem["productId"]) {
    const product = productCatalog.find((entry) => entry.id === productId);
    if (!product) {
      return;
    }

    setItems((current) => addProductToCart(current, product));
  }

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="itemsJson" value={serializePosItems(items)} />

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:items-start">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:w-[65%] lg:max-h-[calc(100dvh-7rem)]">
          <PosProductCatalog
            config={terminal.config}
            products={productCatalog}
            items={items}
            canCreateProducts={terminal.permissions.canCreateProducts}
            onProductsChange={setProductCatalog}
            onAddProduct={(product) => handleAddProduct(product.id)}
          />
        </div>

        <PosCartPanel
          config={terminal.config}
          customers={terminal.customers}
          items={items}
          customerId={customerId}
          discount={discount}
          paymentMethod={paymentMethod}
          paymentAmount={paymentAmount}
          paymentTouched={paymentTouched}
          subtotal={subtotal}
          discountValue={discountValue}
          tax={tax}
          total={total}
          statusMessage={state.message}
          fieldErrors={state.fieldErrors}
          onCustomerChange={setCustomerId}
          onDiscountChange={setDiscount}
          onPaymentMethodChange={setPaymentMethod}
          onPaymentAmountChange={(value) => {
            setPaymentTouched(true);
            setPaymentAmount(value);
          }}
          onItemsChange={setItems}
        />
      </div>
    </form>
  );
}
