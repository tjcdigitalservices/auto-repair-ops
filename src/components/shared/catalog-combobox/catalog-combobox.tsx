"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, Search } from "lucide-react";

import {
  filterCatalogOptions,
  getCatalogKindConfig,
  getCatalogOptionLabel,
  renderCatalogOptionDetails,
  type CatalogComboboxProps,
  type CatalogOption,
} from "@/components/shared/catalog-combobox/catalog-combobox-config";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DROPDOWN_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 16;
const DROPDOWN_PREFERRED_MAX_HEIGHT_PX = 320;
const DROPDOWN_MIN_HEIGHT_PX = 160;

type DropdownPanelLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function CatalogCombobox(props: CatalogComboboxProps) {
  const {
    kind,
    id,
    name,
    options,
    value,
    onValueChange,
    onAfterSelect,
    canCreate = false,
    onCreateNew,
    disabled = false,
    className,
    fallbackLabel,
  } = props;

  const config = getCatalogKindConfig(kind);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelLayout, setPanelLayout] = useState<DropdownPanelLayout | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const selectedOption =
    options.find((option) => option.id === value) ?? null;
  const filteredOptions = filterCatalogOptions(
    kind,
    options as CatalogOption[],
    deferredQuery,
    value,
  );
  const showCreateFooter = canCreate && Boolean(onCreateNew);
  const navigableCount = filteredOptions.length + (showCreateFooter ? 1 : 0);
  const createActionIndex = showCreateFooter ? filteredOptions.length : -1;
  const isCreateActionActive = activeIndex === createActionIndex;
  const activeOption =
    activeIndex >= 0 && activeIndex < filteredOptions.length
      ? filteredOptions[activeIndex]
      : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (containerRef.current?.contains(target)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPanelLayout(null);
      return;
    }

    function updatePanelLayout() {
      const anchor = containerRef.current;

      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const spaceBelow =
        window.innerHeight - rect.bottom - VIEWPORT_PADDING_PX - DROPDOWN_GAP_PX;
      const maxHeight = Math.min(
        DROPDOWN_PREFERRED_MAX_HEIGHT_PX,
        Math.max(DROPDOWN_MIN_HEIGHT_PX, spaceBelow),
      );

      setPanelLayout({
        top: rect.bottom + DROPDOWN_GAP_PX,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    updatePanelLayout();
    window.addEventListener("resize", updatePanelLayout);
    window.addEventListener("scroll", updatePanelLayout, true);

    return () => {
      window.removeEventListener("resize", updatePanelLayout);
      window.removeEventListener("scroll", updatePanelLayout, true);
    };
  }, [isOpen]);

  function openDropdown() {
    if (disabled) {
      return;
    }

    setIsOpen(true);
    setActiveIndex(
      filteredOptions.length > 0 ? 0 : showCreateFooter ? createActionIndex : -1,
    );
  }

  function closeDropdown() {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function handleSelect(option: CatalogOption) {
    onValueChange(option as never);
    closeDropdown();
    onAfterSelect?.();
  }

  function handleCreate() {
    onCreateNew?.(query.trim());
    closeDropdown();
  }

  const displayLabel = selectedOption
    ? getCatalogOptionLabel(kind, selectedOption)
    : fallbackLabel ?? "";
  const inputValue = isOpen ? query : displayLabel;

  const dropdownPanel =
    isOpen && panelLayout ? (
      <div
        ref={panelRef}
        id={listboxId}
        role="listbox"
        style={{
          position: "fixed",
          top: panelLayout.top,
          left: panelLayout.left,
          width: panelLayout.width,
          maxHeight: panelLayout.maxHeight,
          zIndex: 200,
        }}
        className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background shadow-lg shadow-slate-950/10"
      >
        {filteredOptions.length === 0 ? (
          <div className="shrink-0 px-3 py-3 text-sm text-muted-foreground">
            {config.emptyMessage}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {filteredOptions.map((option, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={option.id}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={option.id === value}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-muted/70" : "hover:bg-muted/40",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(option)}
                >
                  {renderCatalogOptionDetails(kind, option)}
                </button>
              );
            })}
          </div>
        )}

        {showCreateFooter ? (
          <div className="shrink-0 border-t border-border/70 bg-muted/10 px-3 py-3">
            {filteredOptions.length > 0 ? (
              <p className="text-xs text-muted-foreground">{config.emptyCreatePrompt}</p>
            ) : null}
            <button
              id={`${listboxId}-create`}
              type="button"
              className={cn(
                "mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-brand-navy transition-colors",
                isCreateActionActive ? "bg-muted/70" : "hover:bg-muted/50",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(createActionIndex)}
              onClick={handleCreate}
            >
              <Plus className="size-4 shrink-0" />
              {filteredOptions.length === 0 && query.trim()
                ? config.createLabelWithQuery(query.trim())
                : config.createLabel}
            </button>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          disabled={disabled}
          placeholder={config.placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            activeOption
              ? `${listboxId}-option-${activeIndex}`
              : isCreateActionActive
                ? `${listboxId}-create`
                : undefined
          }
          className="rounded-xl pr-10 pl-9"
          onFocus={openDropdown}
          onClick={openDropdown}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            const nextFiltered = filterCatalogOptions(
              kind,
              options as CatalogOption[],
              event.target.value,
              value,
            );
            setActiveIndex(
              nextFiltered.length > 0 ? 0 : showCreateFooter ? createActionIndex : -1,
            );
          }}
          onKeyDown={(event) => {
            if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              openDropdown();
              return;
            }

            if (event.key === "Tab") {
              closeDropdown();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              closeDropdown();
              return;
            }

            if (navigableCount === 0) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => {
                const normalized =
                  current >= 0 && current < navigableCount ? current : -1;
                return (normalized + 1) % navigableCount;
              });
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => {
                const normalized =
                  current >= 0 && current < navigableCount ? current : 0;
                return normalized <= 0 ? navigableCount - 1 : normalized - 1;
              });
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (activeOption) {
                handleSelect(activeOption);
                return;
              }

              if (isCreateActionActive) {
                handleCreate();
              }
            }
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {isMounted && dropdownPanel ? createPortal(dropdownPanel, document.body) : null}
    </div>
  );
}
