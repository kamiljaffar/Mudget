"use client";

import clsx from "clsx";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  User as UserIcon,
} from "@/components/icons";
import {
  Card,
  CardHeader,
  Chip,
  FadeIn,
  PageHeader,
  btnPrimary,
  btnSecondary,
  btnGhost,
  inputClass,
  labelClass,
} from "@/components/ui";
import { downloadBackup, pickBackup } from "@/lib/backup";
import { useToast } from "@/lib/providers";
import { useAction } from "@/lib/useAction";
import {
  changePassword,
  deleteAccount,
  importBackup,
  resetAllData,
  updateProfile,
} from "@/lib/actions";
import { COLOR_TOKENS, colorStyle } from "@/lib/palette";
import type { Workspace } from "@/lib/types";

const CURRENCIES = ["Rs", "PKR", "₹", "$", "€", "£", "AED", "﷼", "₺", "₦"];

export function ProfileView({ workspace }: { workspace: Workspace }) {
  const { notify } = useToast();
  const profile = workspace.profile;

  const [name, setName] = useState(profile.name);
  const [currency, setCurrency] = useState(profile.currency);
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const save = useAction(updateProfile);
  const passwd = useAction(changePassword);
  const restore = useAction(importBackup);
  const reset = useAction(resetAllData);
  const removeAccount = useAction(deleteAccount);

  const dirty =
    name !== profile.name ||
    currency !== profile.currency ||
    avatarColor !== profile.avatarColor;

  const stats = [
    { label: "Rules", value: workspace.rules.length },
    { label: "Planned items", value: workspace.items.length },
    { label: "Expenses", value: workspace.expenses.length },
    { label: "Months tracked", value: workspace.plans.length },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        subtitle="Account, preferences aur data controls."
      />

      {/* identity */}
      <FadeIn>
        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={clsx(
                "grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-2xl font-black text-white shadow-lg",
                colorStyle(avatarColor).bar,
              )}
            >
              {profile.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "?"}
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
                <Chip className="bg-indigo-50 text-indigo-600 ring-indigo-200">
                  {workspace.activeRule?.name ?? "no rule"}
                </Chip>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center"
              >
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* preferences */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader
              icon={<UserIcon className="h-4 w-4" />}
              title="Preferences"
              subtitle="Naam, currency aur avatar colour."
            />
            <div className="space-y-3.5">
              <label className="block">
                <span className={labelClass}>Display name</span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <label className="block">
                <span className={labelClass}>Currency symbol</span>
                <input
                  className={inputClass}
                  value={currency}
                  maxLength={6}
                  onChange={(event) => setCurrency(event.target.value)}
                  placeholder="Rs"
                />
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {CURRENCIES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      className={clsx(
                        "rounded-lg px-2 py-0.5 text-[11px] font-semibold transition",
                        currency === code
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {code}
                    </button>
                  ))}
                </span>
              </label>

              <div>
                <span className={labelClass}>Avatar colour</span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_TOKENS.map((token) => (
                    <button
                      key={token}
                      type="button"
                      aria-label={token}
                      onClick={() => setAvatarColor(token)}
                      className={clsx(
                        "grid h-9 w-9 place-items-center rounded-xl transition",
                        avatarColor === token
                          ? "ring-2 ring-slate-900 ring-offset-2"
                          : "hover:scale-110",
                      )}
                    >
                      <span
                        className={clsx(
                          "h-7 w-7 rounded-lg",
                          colorStyle(token).bar,
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!dirty || save.busy}
                onClick={() =>
                  save.run({ name, currency, avatarColor })
                }
                className={btnPrimary}
              >
                {save.busy ? "Saving…" : dirty ? "Save changes" : "All saved"}
              </button>
            </div>
          </Card>
        </FadeIn>

        {/* password */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Security"
              subtitle="Password change karein — session re-login nahi mangta."
              action={
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => setShowPasswords((value) => !value)}
                >
                  {showPasswords ? "Hide" : "Show"}
                </button>
              }
            />
            <div className="space-y-3.5">
              <label className="block">
                <span className={labelClass}>Current password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPasswords ? "text" : "password"}
                    className={clsx(inputClass, "pl-10")}
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </label>

              <label className="block">
                <span className={labelClass}>New password</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPasswords ? "text" : "password"}
                    className={clsx(inputClass, "pl-10")}
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                    autoComplete="new-password"
                    placeholder="min 6 characters"
                  />
                </div>
              </label>

              <button
                type="button"
                className={btnPrimary}
                disabled={passwd.busy}
                onClick={async () => {
                  const result = await passwd.run({ current, next });
                  if (result?.ok) {
                    setCurrent("");
                    setNext("");
                  }
                }}
              >
                {passwd.busy ? "Updating…" : "Change password"}
              </button>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* data */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader
            icon={<Database className="h-4 w-4" />}
            title="Your data"
            subtitle="Cloud sync on hai (Neon Postgres). JSON backup se data move ya save kar sakte hain."
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                downloadBackup(workspace);
                notify("Backup download ho gaya", "success");
              }}
            >
              <Download className="h-4 w-4" />
              Export backup
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() =>
                pickBackup((payload) => {
                  if (!payload) {
                    notify("File read nahi ho saki.", "error");
                    return;
                  }
                  void restore.run(payload);
                })
              }
            >
              <Upload className="h-4 w-4" />
              Import backup
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                if (
                  window.confirm(
                    "Saara data delete kar ke default rules wapas la dein?",
                  )
                ) {
                  void reset.run();
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset data
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
            <div className="flex items-start gap-2.5">
              <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-700">Danger zone</p>
                <p className="mt-0.5 text-xs text-rose-600/80">
                  Account delete karne pe saara data permanently remove ho jayega.
                </p>
                <button
                  type="button"
                  className={clsx(btnSecondary, "mt-3 border-rose-200 text-rose-600")}
                  disabled={removeAccount.busy}
                  onClick={() => {
                    const typed = window.prompt(
                      'Confirm: apna email type karein account delete karne ke liye.',
                    );
                    if (typed?.trim().toLowerCase() === profile.email.toLowerCase()) {
                      void removeAccount.run();
                    } else if (typed !== null) {
                      notify("Email match nahi hua — delete cancelled.", "error");
                    }
                  }}
                >
                  {removeAccount.busy ? "Deleting…" : "Delete account"}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}
