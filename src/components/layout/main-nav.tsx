"use client";

import { ArchiveIcon, ClockIcon, HouseIcon, StarIcon } from "lucide-react";

import { texts } from "@/lib/texts";

import { NavLink } from "./nav-link";

/** Navegación principal de la sidebar (cliente: los iconos no cruzan la frontera RSC). */
export function MainNav({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <>
      <NavLink
        href="/"
        icon={HouseIcon}
        label={texts.nav.home}
        collapsed={collapsed}
      />
      <NavLink
        href="/favorites"
        icon={StarIcon}
        label={texts.nav.favorites}
        collapsed={collapsed}
      />
      <NavLink
        href="/recent"
        icon={ClockIcon}
        label={texts.nav.recent}
        collapsed={collapsed}
      />
      <NavLink
        href="/archived"
        icon={ArchiveIcon}
        label={texts.nav.archived}
        collapsed={collapsed}
      />
    </>
  );
}
