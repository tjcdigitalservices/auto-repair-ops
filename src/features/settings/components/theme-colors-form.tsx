"use client";

import { useState } from "react";

import {
  FieldError,
  FormStatusMessage,
  fieldErrorId,
} from "@/components/shared/form-status";
import { FormSection } from "@/components/shared/form-section";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveSandboxThemeColorsAction } from "@/features/sandbox/form-actions";
import { useBoundAction } from "@/features/sandbox/use-bound-action";
import { updateThemeColorsSettingsAction } from "@/features/settings/actions/settings-actions";
import type { ThemePalettePreview } from "@/features/settings/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { cn } from "@/lib/utils";

export function ThemeColorsForm({
  themePalette,
}: {
  themePalette: ThemePalettePreview;
}) {
  const [state, formAction] = useBoundAction(
    updateThemeColorsSettingsAction,
    saveSandboxThemeColorsAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [buttonColor, setButtonColor] = useState(themePalette.primaryColor);
  const [accentColor, setAccentColor] = useState(themePalette.accentColor);

  const candidates =
    themePalette.candidates.length > 0
      ? themePalette.candidates
      : [
          { hsl: themePalette.primaryColor, label: "Current buttons" },
          { hsl: themePalette.accentColor, label: "Current accent" },
        ];

  return (
    <FormSection
      title="Theme colors"
      description="Choose which logo colors drive buttons and accent highlights. Upload a logo or brand icon first to scan more colors."
    >
      <form action={formAction} className="space-y-5">
        <FormStatusMessage message={state.message} />
        <input type="hidden" name="buttonColor" value={buttonColor} />
        <input type="hidden" name="accentColor" value={accentColor} />

        <div className="space-y-3">
          <div>
            <Label>Button color</Label>
            <p className="text-xs text-muted-foreground">
              Used for primary buttons, active tabs, and sidebar selection.
            </p>
          </div>
          <ColorSwatchPicker
            name="buttonColorPicker"
            options={candidates}
            selected={buttonColor}
            onSelect={(hsl) => {
              setButtonColor(hsl);
              if (hsl === accentColor) {
                const fallback = candidates.find((item) => item.hsl !== hsl);
                if (fallback) {
                  setAccentColor(fallback.hsl);
                }
              }
            }}
          />
          <FieldError
            errors={state.fieldErrors}
            name="buttonColor"
            id={fieldErrorId("buttonColor")}
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label>Accent color</Label>
            <p className="text-xs text-muted-foreground">
              Secondary brand color for highlights and contrast accents.
            </p>
          </div>
          <ColorSwatchPicker
            name="accentColorPicker"
            options={candidates}
            selected={accentColor}
            onSelect={(hsl) => {
              setAccentColor(hsl);
              if (hsl === buttonColor) {
                const fallback = candidates.find((item) => item.hsl !== hsl);
                if (fallback) {
                  setButtonColor(fallback.hsl);
                }
              }
            }}
          />
          <FieldError
            errors={state.fieldErrors}
            name="accentColor"
            id={fieldErrorId("accentColor")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
          <span className="text-sm font-medium text-foreground">Preview</span>
          <Button
            type="button"
            size="sm"
            tabIndex={-1}
            style={{ backgroundColor: `hsl(${buttonColor})`, color: "#fff" }}
          >
            Sample button
          </Button>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: `hsl(${accentColor})` }}
          >
            Accent
          </span>
        </div>

        <SubmitButton pendingLabel="Saving...">Save theme colors</SubmitButton>
      </form>
    </FormSection>
  );
}

function ColorSwatchPicker({
  name,
  options,
  selected,
  onSelect,
}: {
  name: string;
  options: Array<{ hsl: string; label: string }>;
  selected: string;
  onSelect: (hsl: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
      {options.map((option, index) => {
        const isSelected = option.hsl === selected;
        return (
          <button
            key={`${name}-${option.hsl}-${index}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            title={`${option.label}: ${option.hsl}`}
            onClick={() => onSelect(option.hsl)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              isSelected
                ? "border-brand-navy bg-brand-soft ring-2 ring-brand-navy/30"
                : "border-border/70 bg-background hover:border-brand-navy/40",
            )}
          >
            <span
              className="size-7 rounded-lg shadow-sm ring-1 ring-black/10"
              style={{ backgroundColor: `hsl(${option.hsl})` }}
            />
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{option.label}</span>
              <span className="block text-[11px] text-muted-foreground">{option.hsl}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
