/**
 * lucide-react ships per-icon JS modules (`lucide-react/icons/<name>`) but no type
 * declarations for them, so we declare the shape ourselves. Each module has a single
 * default export: the icon component.
 */
declare module "lucide-react/icons/*" {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

  type LucideIcon = ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> & RefAttributes<SVGSVGElement>
  >;

  const Icon: LucideIcon;
  export default Icon;
}
