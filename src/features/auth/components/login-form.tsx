"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import {
  FieldError,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
} from "@/components/shared/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useFormValues } from "@/lib/use-form-values";
import { signInSchema } from "@/features/auth/schemas/sign-in-schema";
import { OPERABLE_TENANT_STATUSES } from "@/lib/tenants/status";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined> | undefined
  >();
  const { values, updateFormValue } = useFormValues({
    email: "",
    password: "",
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    setFieldErrors(undefined);

    const parsed = signInSchema.safeParse({
      email: values.email.trim(),
      password: values.password,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setMessage("Please correct the highlighted fields and try again.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        const userId = data.user?.id;
        if (!userId) {
          setMessage("Unable to start a session. Please try again.");
          return;
        }

        // Ensure the browser session cookie is applied before RLS-scoped queries.
        await supabase.auth.getSession();

        const { data: platformAdmin, error: platformError } = await supabase
          .from("platform_admins")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (platformError) {
          setMessage(`Could not verify platform access: ${platformError.message}`);
          await supabase.auth.signOut();
          return;
        }

        if (platformAdmin) {
          router.replace("/platform");
          router.refresh();
          return;
        }

        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("role, tenant_id, status")
          .eq("linked_user_id", userId)
          .maybeSingle();

        if (staffError) {
          setMessage(staffError.message);
          await supabase.auth.signOut();
          return;
        }

        if (!staff || staff.status !== "active") {
          await supabase.auth.signOut();
          setMessage("This account is not set up for active staff access.");
          return;
        }

        const { data: tenant } = await supabase
          .from("tenants")
          .select("status")
          .eq("id", staff.tenant_id)
          .maybeSingle();

        if (
          !tenant ||
          !(OPERABLE_TENANT_STATUSES as readonly string[]).includes(tenant.status)
        ) {
          await supabase.auth.signOut();
          setMessage("This shop subscription is suspended or inactive.");
          return;
        }

        router.replace(
          staff.role === "mechanic" ? "/portal/attendance" : "/dashboard",
        );
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to sign in. Check your connection and try again.",
        );
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <FormStatusMessage message={message} />

      <div className="grid gap-2.5">
        <Label
          htmlFor="email"
          required
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="Enter your email"
            value={values.email}
            onChange={(event) => updateFormValue("email", event.target.value)}
            className={fieldControlClassName(
              fieldErrors,
              "email",
              "h-12 rounded-xl border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-red focus-visible:ring-brand-red/20",
            )}
            {...fieldAriaProps({
              errors: fieldErrors,
              name: "email",
              required: true,
              errorId: fieldErrorId("email"),
            })}
          />
        </div>
        <FieldError errors={fieldErrors} name="email" id={fieldErrorId("email")} />
      </div>

      <div className="grid gap-2.5">
        <Label
          htmlFor="password"
          required
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Password
        </Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={values.password}
            onChange={(event) => updateFormValue("password", event.target.value)}
            className={fieldControlClassName(
              fieldErrors,
              "password",
              "h-12 rounded-xl border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-brand-red focus-visible:ring-brand-red/20",
            )}
            {...fieldAriaProps({
              errors: fieldErrors,
              name: "password",
              required: true,
              errorId: fieldErrorId("password"),
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/20"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FieldError errors={fieldErrors} name="password" id={fieldErrorId("password")} />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        variant="yellowPrimary"
        className="mt-1 h-12 w-full rounded-xl text-sm font-semibold uppercase tracking-[0.18em]"
      >
        {isPending ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
