"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDownIcon,
  KeyboardIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ShortcutsDialog } from "@/components/layout/shortcuts-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { texts } from "@/lib/texts";
import { getInitials } from "@/lib/user";

export function UserMenu({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    toast.success(texts.auth.sessionClosed);
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none">
          <Avatar size="sm">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground block truncate text-xs">
              {user.email}
            </span>
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{texts.nav.userMenu}</DropdownMenuLabel>
            <DropdownMenuItem disabled>
              <UserIcon />
              {texts.nav.profile}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHelpOpen(true)}>
              <KeyboardIcon />
              {texts.shortcuts.open}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOutIcon />
            {texts.auth.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {helpOpen ? (
        <ShortcutsDialog onOpenChange={(open) => !open && setHelpOpen(false)} />
      ) : null}
    </>
  );
}
