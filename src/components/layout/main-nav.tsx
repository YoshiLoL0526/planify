"use client";

import { ArchiveIcon, ClockIcon, HouseIcon, StarIcon } from "lucide-react";

import { texts } from "@/lib/texts";

import { NavLink } from "./nav-link";

/** Navegación principal de la sidebar (cliente: los iconos no cruzan la frontera RSC). */
export function MainNav() {
  return (
    <>
      <NavLink href="/" icon={HouseIcon} label={texts.nav.home} />
      <NavLink href="/favorites" icon={StarIcon} label={texts.nav.favorites} />
      <NavLink href="/recent" icon={ClockIcon} label={texts.nav.recent} />
      <NavLink href="/archived" icon={ArchiveIcon} label={texts.nav.archived} />
    </>
  );
}
