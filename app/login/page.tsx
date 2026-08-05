"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendResetOtpAction,
  verifyResetOtpAction,
  resetPasswordAction,
} from "@/actions/auth";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  User,
  Building2,
  Key,
  Mail,
  ArrowLeft,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authView, setAuthView] = useState<"login" | "forgot" | "otp" | "reset">("login");
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
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

  const onSubmit = (data: LoginInput) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const response = await signIn("credentials", {
          username: data.username,
          password: data.password,
          redirect: false,
        });
        if (!response || response.error) {
          const msg = "Invalid email/username or password.";
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }
        toast.success("Welcome back");
        router.replace("/dashboard");
        router.refresh();
      } catch (err) {
        console.error(err);
        setErrorMsg("An unexpected error occurred.");
        toast.error("An unexpected error occurred.");
      }
    });
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await sendResetOtpAction(emailInput);
      if (!res.success) {
        toast.error(res.error || "Failed to send OTP");
        return;
      }
      setDemoOtp(res.otp || null);
      toast.success(res.message || "OTP sent");
      if (res.otp) toast.message(`Your OTP is ${res.otp}`, { duration: 12000 });
      setAuthView("otp");
    });
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await verifyResetOtpAction(emailInput, otpCode);
      if (!res.success) {
        toast.error(res.error || "Invalid OTP");
        return;
      }
      toast.success("OTP verified");
      setAuthView("reset");
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await resetPasswordAction(emailInput, otpCode, newPassword);
      if (!res.success) {
        toast.error(res.error || "Failed to reset password");
        return;
      }
      toast.success("Password updated — you can sign in now");
      setAuthView("login");
      setEmailInput("");
      setOtpCode("");
      setNewPassword("");
      setDemoOtp(null);
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

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-xl p-6 sm:p-8">
          {authView === "login" && (
            <div>
              <div className="text-center mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-2">
                  Og Stays · 1451
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-foreground">
                  Flat Owner Portal
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Sign in with Gmail / email or username + password
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 text-sm rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email or username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="text"
                      {...register("username")}
                      className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="owner@gmail.com or admin"
                      disabled={isPending}
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-xs text-rose-500">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthView("forgot")}
                      className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="password"
                      {...register("password")}
                      className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="••••••••"
                      disabled={isPending}
                      autoComplete="current-password"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                New flat owner?{" "}
                <Link href="/signup" className="font-bold text-brand hover:underline">
                  Register
                </Link>
              </p>
            </div>
          )}

          {authView === "forgot" && (
            <div>
              <button
                type="button"
                onClick={() => setAuthView("login")}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-1">
                Reset via Gmail OTP
              </h1>
              <p className="text-xs text-muted mb-5">
                Enter your registered Gmail — we&apos;ll show a 4-digit OTP to verify ownership.
              </p>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="owner@gmail.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </button>
              </form>
            </div>
          )}

          {authView === "otp" && (
            <div>
              <button
                type="button"
                onClick={() => setAuthView("forgot")}
                className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-5 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Change email
              </button>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-1">
                Enter OTP
              </h1>
              <p className="text-xs text-muted mb-4">
                Code for <strong>{emailInput}</strong>
              </p>
              {demoOtp && (
                <div className="mb-4 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2 text-sm">
                  Your OTP: <strong className="tracking-widest text-brand">{demoOtp}</strong>
                </div>
              )}
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="block w-36 mx-auto rounded-xl border border-border bg-surface-muted/50 py-3 text-center text-lg font-black tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="••••"
                  required
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                >
                  Verify OTP
                </button>
              </form>
            </div>
          )}

          {authView === "reset" && (
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold mb-1">
                Set new password
              </h1>
              <p className="text-xs text-muted mb-5">Choose a new password for your owner portal.</p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface-muted/50 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                >
                  Update password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
