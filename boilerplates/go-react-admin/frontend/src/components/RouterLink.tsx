import { Link, type LinkProps } from "react-router-dom";

export type RouterLinkProps = Omit<LinkProps, "to"> & { href?: string; to?: string };

/**
 * Bridges Astryx's `href`-based navigation to react-router's `to`.
 *
 * Astryx hands `href` to the component it renders links with; react-router's
 * Link only understands `to`. This adapter is what `LinkProvider` receives in
 * main.tsx, so every Astryx link (SideNavItem, Button href, ...) becomes a
 * client-side navigation.
 */
export function RouterLink({ href, to, ...rest }: RouterLinkProps) {
  return <Link to={to ?? href ?? "/"} {...rest} />;
}
