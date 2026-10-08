/**
 * Icon re-exports.
 *
 * Every icon is imported from its deep `lucide-react/icons/<name>` path instead of the
 * `lucide-react` barrel file on purpose. Next.js auto-enables `optimizePackageImports`
 * for lucide-react, and that barrel optimizer has a known bug where certain import sets
 * make the React Client Manifest lookup fail during `next build` with:
 *   "Could not find the module ...#default in the React Client Manifest"
 * Deep imports bypass the optimizer entirely (and bundle less code).
 * See https://github.com/vercel/next.js/issues/54967
 */

export { default as LayoutDashboard } from "lucide-react/icons/layout-dashboard";
export { default as ListPlus } from "lucide-react/icons/list-plus";
export { default as BarChart3 } from "lucide-react/icons/bar-chart-3";
export { default as Wallet } from "lucide-react/icons/wallet";
export { default as ChevronLeft } from "lucide-react/icons/chevron-left";
export { default as ChevronRight } from "lucide-react/icons/chevron-right";
export { default as CalendarDays } from "lucide-react/icons/calendar-days";
export { default as Calendar } from "lucide-react/icons/calendar";
export { default as AlertTriangle } from "lucide-react/icons/alert-triangle";
export { default as ArrowRight } from "lucide-react/icons/arrow-right";
export { default as PieChart } from "lucide-react/icons/pie-chart";
export { default as Plus } from "lucide-react/icons/plus";
export { default as TrendingUp } from "lucide-react/icons/trending-up";
export { default as Check } from "lucide-react/icons/check";
export { default as Download } from "lucide-react/icons/download";
export { default as Pencil } from "lucide-react/icons/pencil";
export { default as RotateCcw } from "lucide-react/icons/rotate-ccw";
export { default as Trash2 } from "lucide-react/icons/trash-2";
export { default as Upload } from "lucide-react/icons/upload";
export { default as Search } from "lucide-react/icons/search";
export { default as X } from "lucide-react/icons/x";
export { default as PackageSearch } from "lucide-react/icons/package-search";
export { default as User } from "lucide-react/icons/user";
export { default as LogOut } from "lucide-react/icons/log-out";
export { default as Sparkles } from "lucide-react/icons/sparkles";
export { default as CheckCircle2 } from "lucide-react/icons/circle-check";
export { default as XCircle } from "lucide-react/icons/circle-x";
export { default as CirclePlus } from "lucide-react/icons/circle-plus";
export { default as Clock } from "lucide-react/icons/clock";
export { default as Layers } from "lucide-react/icons/layers";
export { default as Percent } from "lucide-react/icons/percent";
export { default as Database } from "lucide-react/icons/database";
export { default as Eye } from "lucide-react/icons/eye";
export { default as EyeOff } from "lucide-react/icons/eye-off";
export { default as Mail } from "lucide-react/icons/mail";
export { default as Lock } from "lucide-react/icons/lock";
export { default as LoaderCircle } from "lucide-react/icons/loader-circle";
export { default as ChevronDown } from "lucide-react/icons/chevron-down";
export { default as EllipsisVertical } from "lucide-react/icons/ellipsis-vertical";
export { default as Target } from "lucide-react/icons/target";
export { default as Receipt } from "lucide-react/icons/receipt";
export { default as TrendingDown } from "lucide-react/icons/trending-down";
export { default as ShieldCheck } from "lucide-react/icons/shield-check";
export { default as KeyRound } from "lucide-react/icons/key-round";
export { default as Palette } from "lucide-react/icons/palette";
export { default as FileText } from "lucide-react/icons/file-text";
export { default as ArrowUpRight } from "lucide-react/icons/arrow-up-right";
export { default as Zap } from "lucide-react/icons/zap";
export { default as Info } from "lucide-react/icons/info";
export { default as PiggyBank } from "lucide-react/icons/piggy-bank";
export { default as Filter } from "lucide-react/icons/filter";
export { default as Save } from "lucide-react/icons/save";
export { default as CalendarCheck } from "lucide-react/icons/calendar-check";
