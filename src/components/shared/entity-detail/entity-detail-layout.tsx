import { cn } from "@/lib/utils";

export function EntityDetailLayout({
  header,
  sidebar,
  children,
  className,
}: {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      {header}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <div className="min-w-0 space-y-6 lg:order-2 xl:order-1">{children}</div>
        <aside className="min-w-0 lg:order-1 xl:order-2 xl:sticky xl:top-6 xl:self-start">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
