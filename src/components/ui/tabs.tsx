"use client";

import * as React from "react";

import { PageTabPanel, PageTabs, type PageTabDefinition } from "@/components/shared/page-tabs";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const baseId = React.useId();
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue, baseId }}>
      <div className={cn("space-y-0", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = useTabsContext();
  const tabs = React.useMemo((): PageTabDefinition[] => {
    return React.Children.toArray(children)
      .filter(React.isValidElement)
      .flatMap((child) => {
        if (!React.isValidElement<TabsTriggerProps>(child)) {
          return [];
        }

        return [
          {
            id: child.props.value,
            label: getTabLabel(child.props.children),
            count: child.props.count,
          },
        ];
      });
  }, [children]);

  return (
    <PageTabs
      tabs={tabs}
      activeTab={context.value}
      onTabChange={context.setValue}
      className={className}
      {...props}
    />
  );
}

type TabsTriggerProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string;
  count?: number;
};

export function TabsTrigger(_props: TabsTriggerProps) {
  return null;
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
}) {
  const context = useTabsContext();

  return (
    <PageTabPanel activeTab={context.value} tabId={value} className={className} {...props}>
      {children}
    </PageTabPanel>
  );
}

function getTabLabel(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getTabLabel).join("");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return getTabLabel(children.props.children);
  }

  return "";
}

function useTabsContext() {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within <Tabs />");
  }

  return context;
}
