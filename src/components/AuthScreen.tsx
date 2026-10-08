"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
  XCircle,
} from "@/components/icons";
import { login, signup } from "@/lib/actions";
import { AppProviders, useToast } from "@/lib/providers";
import { btnPrimary, EASE, inputClass, labelClass } from "./ui";

const HIGHLIGHTS = [
  "Synced to your Neon Postgres account — phone, laptop, sab jagah.",
  "Apna rule banayein: 60/25/15 ya koi bhi split.",
  "Budget item par tick = expense khud add ho jati hai.",
];

function AuthInner({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { notify } = useToast();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = isSignup
      ? await signup({ name, email, password })
      : await login({ email, password });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (isSignup) notify(result.message ?? "Account ban gaya!", "success");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-50 lg:flex-row">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          className="absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-300/40 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.15, ease: EASE }}
          className="absolute -right-24 top-1/3 h-[24rem] w-[24rem] rounded-full bg-violet-300/40 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
          className="absolute -bottom-32 left-1/4 h-[22rem] w-[22rem] rounded-full bg-sky-300/40 blur-3xl"
        />
      </div>

      {/* brand / highlights */}
      <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-10 sm:px-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto w-full max-w-md lg:max-w-lg"
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-500/30">
              M
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              Mudget
            </span>
          </Link>

          <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {isSignup ? (
              <>
                Naya account,
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {" "}
                  nayi planning
                </span>
                .
              </>
            ) : (
              <>
                Wapas aaye?
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  {" "}
                  Budget ready hai.
                </span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
            Monthly income, daily expenses aur apna custom budget rule — sab ek hi
            jagah, har device pe.
          </p>

          <ul className="mt-7 hidden space-y-3 sm:block">
            {HIGHLIGHTS.map((text, index) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + index * 0.1, ease: EASE }}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* form card */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-2 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isSignup ? "Create your account" : "Sign in"}
              </h2>
              <p className="text-xs text-slate-500">
                {isSignup
                  ? "Kuch second mein sab set ho jayega."
                  : "Apna data kisi bhi device pe dekhein."}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <AnimatePresence initial={false}>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false} mode="popLayout">
              {isSignup ? (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden"
                >
                  <label className="block">
                    <span className={labelClass}>Your name</span>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className={clsx(inputClass, "pl-10")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Kamil Jaffar"
                        autoComplete="name"
                      />
                    </div>
                  </label>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <label className="block">
              <span className={labelClass}>Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className={clsx(inputClass, "pl-10")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className={labelClass}>Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={clsx(inputClass, "pl-10 pr-11")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignup ? (
                <span className="mt-1 block text-[11px] text-slate-400">
                  Kam se kam 6 characters.
                </span>
              ) : null}
            </label>

            <button
              type="submit"
              disabled={busy}
              className={clsx(btnPrimary, "w-full py-3")}
            >
              {busy ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                    className="block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                  />
                  Please wait…
                </>
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            {isSignup ? "Pehle se account hai?" : "Naya user hain?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-indigo-600 transition hover:text-indigo-500 hover:underline"
            >
              {isSignup ? "Sign in" : "Create account"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/** Public entry — wraps the form in providers so toasts work on /login & /signup. */
export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  return (
    <AppProviders>
      <AuthInner mode={mode} />
    </AppProviders>
  );
}
