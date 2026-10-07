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
