"use client";

import { useMemo, useState, useActionState } from "react";
import {
  Eye,
  EyeOff,
  Link2,
  Lock,
  Mail,
  Plus,
  Store,
  User,
} from "lucide-react";

import { createTenantAction } from "@/features/platform/actions/platform-actions";
import {
  INITIAL_FORM_ACTION_STATE,
  type FormActionState,
} from "@/lib/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugifyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function CreateTenantForm({
  existingSlugs,
  compact = false,
}: {
  existingSlugs: string[];
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState<FormActionState, FormData>(
    createTenantAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const reservedSlugs = useMemo(
    () => new Set(existingSlugs.map((value) => value.toLowerCase())),
    [existingSlugs],
  );

  const slugStatus = useMemo(() => {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      return {
        tone: "neutral" as const,
        message: "Used in /t/acme and optional subdomain (e.g. acme.yourdomain.com).",
      };
    }
    if (normalized.length < 2) {
      return { tone: "error" as const, message: "Slug must be at least 2 characters." };
    }
    if (!SLUG_PATTERN.test(normalized)) {
      return {
        tone: "error" as const,
        message: "Use lowercase letters, numbers, and hyphens only.",
      };
    }
    if (reservedSlugs.has(normalized)) {
      return { tone: "error" as const, message: "This slug is already taken." };
    }
    return { tone: "success" as const, message: `Available · /t/${normalized}` };
  }, [reservedSlugs, slug]);

  const canSubmit = slugStatus.tone !== "error" && slug.trim().length >= 2;

  return (
    <form action={action} className={cn("space-y-4", !compact && "space-y-5")}>
      <IconField
        id="tenant-name"
        label="Shop name"
        required
        icon={Store}
        name="name"
        value={name}
        placeholder="Acme Auto Care"
        onChange={(next) => {
          setName(next);
          if (!slugTouched) setSlug(slugifyName(next));
        }}
      />

      <div className="space-y-2">
        <IconField
          id="tenant-slug"
          label="Slug"
          required
          icon={Link2}
          name="slug"
          value={slug}
          placeholder="acme"
          className={cn(
            slugStatus.tone === "error" && "border-destructive focus-visible:ring-destructive/25",
            slugStatus.tone === "success" && "border-emerald-500/60 focus-visible:ring-emerald-500/20",
          )}
          onChange={(next) => {
            setSlugTouched(true);
            setSlug(next.toLowerCase());
          }}
        />
        <p
          className={cn(
            "text-xs",
            slugStatus.tone === "error" && "text-destructive",
            slugStatus.tone === "success" && "text-emerald-700",
            slugStatus.tone === "neutral" && "text-slate-500",
          )}
        >
          {slugStatus.message}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <IconField
          id="owner-first-name"
          label="Owner first name"
          icon={User}
          name="ownerFirstName"
          placeholder="Owner"
        />
        <IconField
          id="owner-last-name"
          label="Owner last name"
          icon={User}
          name="ownerLastName"
          placeholder="Account"
        />
      </div>

      <IconField
        id="owner-email"
        label="Owner email"
        icon={Mail}
        name="ownerEmail"
        type="email"
        placeholder="owner@acme.com"
      />

      <div className="space-y-2">
        <Label htmlFor="owner-password">Owner password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="owner-password"
            name="ownerPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Min 8 characters"
            autoComplete="new-password"
            className="h-11 rounded-xl border-slate-200 pl-9 pr-10"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Temporary password for first sign-in. Leave blank to create the shop without an owner login.
        </p>
      </div>

      {state.status === "error" ? (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="navyPrimary"
        className="h-11 w-full rounded-xl"
        disabled={pending || !canSubmit}
      >
        <Plus className="size-4" />
        {pending ? "Creating…" : "Create tenant"}
      </Button>
    </form>
  );
}

function IconField({
  id,
  label,
  required,
  icon: Icon,
  name,
  value,
  placeholder,
  type = "text",
  className,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  value?: string;
  placeholder?: string;
  type?: string;
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          name={name}
          type={type}
          required={required}
          {...(onChange
            ? {
                value: value ?? "",
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(event.target.value),
              }
            : {})}
          placeholder={placeholder}
          className={cn("h-11 rounded-xl border-slate-200 pl-9", className)}
        />
      </div>
    </div>
  );
}
