export type InventoryMovementType =
  | "stock_in"
  | "stock_out"
  | "service_usage"
  | "pos_sale"
  | "adjustment"
  | "return"
  | "damaged";

export type InventoryMovementAdminMode = "stock_in" | "recount" | "damaged";

export type InventoryStockFilterState = "all" | "in_stock" | "low" | "out" | "missing";

export type InventoryStockItem = {
  stockId: string | null;
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  categoryName: string | null;
  productType: "part" | "fluid" | "consumable" | "accessory" | "tool";
  unitLabel: string;
  costPrice: number;
  sellingPrice: number;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number | null;
  shelfLocation: string | null;
  hasStockRecord: boolean;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
};

export type InventoryProductOption = {
  id: string;
  label: string;
  sku: string | null;
  quantityOnHand: number;
  availableQuantity: number;
  reorderLevel: number | null;
  shelfLocation: string | null;
  hasStockRecord: boolean;
};

export type InventoryMovementItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  movementType: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: string;
  notes: string | null;
  movementDate: string;
  createdAt: string;
};

export type InventorySummary = {
  allItemsCount: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalOnHandQuantity: number;
  totalStockValue: number;
};

export type InventoryDashboardData = {
  branchName: string;
  summary: InventorySummary;
  stocks: InventoryStockItem[];
  movements: InventoryMovementItem[];
  productOptions: InventoryProductOption[];
  branches: Array<{ id: string; name: string; code: string }>;
  selectedBranchId: string | null;
  canSwitch: boolean;
  permissions: {
    canCreateProducts: boolean;
  };
};
