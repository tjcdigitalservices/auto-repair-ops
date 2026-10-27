import { ProductsPageView } from "@/features/products/components/products-page-view";
import { listProducts } from "@/features/products/queries/product-queries";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    pageSize?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { search = "", page, pageSize } = await searchParams;
  const products = await listProducts(search);

  return (
    <ProductsPageView
      products={products}
      search={search}
      page={page}
      pageSize={pageSize}
    />
  );
}
