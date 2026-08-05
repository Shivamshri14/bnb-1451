"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupAction } from "@/actions/auth";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  User,
  Building2,
  Mail,
  Phone,
  Home,
  ArrowLeft,
  Moon,
  Sun,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { indianPhoneMessage, normalizeIndianPhone } from "@/lib/phone";

const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required").trim(),
  email: z.string().email("Invalid email address").trim(),
  phoneNumber: z
    .string()
    .trim()
    .refine((v) => normalizeIndianPhone(v) !== null, { message: indianPhoneMessage }),
  flatName: z.string().optional(),
  flatNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      flatName: "Og Stays",
      flatNumber: "1451",
      password: "",
    },
  });

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const onPhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setPhoneLocal(digits);
    setValue("phoneNumber", digits ? `+91${digits}` : "", { shouldValidate: true });
  };

  const onSubmit = (data: SignupInput) => {
    startTransition(async () => {
      const res = await signupAction({
        ...data,
        phoneNumber: normalizeIndianPhone(data.phoneNumber) || data.phoneNumber,
        flatName: "Og Stays",
        flatNumber: "1451",
      });
      if (!res.success) {
        toast.error(res.error || "Registration failed");
        return;
      }
      toast.success("Account created! Sign in with your email.");
      router.push("/login");
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-xl p-6 sm:p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to login
          </Link>

          <div className="text-center mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-2">
              Owner signup
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Register for Og Stays (1451)
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                  Full name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    {...register("fullName")}
                    className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="John Doe"
                    disabled={isPending}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-500">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                  Gmail / Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="you@gmail.com"
                    disabled={isPending}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                  Phone (+91) *
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-border bg-surface-muted text-sm font-bold text-muted">
                    +91
                  </span>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneLocal}
                      onChange={(e) => onPhoneChange(e.target.value)}
                      className="w-full rounded-r-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="9876543210"
                      disabled={isPending}
                      maxLength={10}
                    />
                  </div>
                </div>
                <input type="hidden" {...register("phoneNumber")} />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-rose-500">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Min 6 characters"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                  Flat
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value="Og Stays"
                    disabled
                    className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pl-10 pr-3 text-sm opacity-80"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase">
                  Room
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value="1451"
                    disabled
                    className="w-full rounded-xl border border-border bg-surface-muted py-2.5 pl-10 pr-3 text-sm opacity-80"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
