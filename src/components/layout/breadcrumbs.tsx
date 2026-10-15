import { Fragment } from "react";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { texts } from "@/lib/texts";

export type Crumb = { label: string; href?: string };

/** Migas de pan comunes: los elementos con `href` enlazan; el último es la página actual. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label={texts.nav.breadcrumbs}>
      <ol className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={`${index}-${item.label}`}>
              <li className="min-w-0">
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="hover:text-foreground block truncate transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="text-foreground block max-w-[40ch] truncate"
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!last ? (
                <li aria-hidden className="shrink-0">
                  <ChevronRightIcon className="size-3.5" />
                </li>
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
