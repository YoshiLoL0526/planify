"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronsUpDownIcon,
  KeyboardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { ShortcutsDialog } from "@/components/layout/shortcuts-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/lib/auth-client";
import { texts } from "@/lib/texts";
import { getInitials } from "@/lib/user";
import { cn } from "@/lib/utils";

export function UserMenu({
  user,
  collapsed = false,
}: {
  user: { name: string; email: string };
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    await signOut();
    toast.success(texts.auth.sessionClosed);
    router.push("/login");
    router.refresh();
  }

  const trigger = (
    <DropdownMenuTrigger
      aria-label={collapsed ? user.name : undefined}
      className={cn(
        "hover:bg-sidebar-accent flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none",
        collapsed && "justify-center",
      )}
    >
      <Avatar size="sm">
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground block truncate text-xs">
              {user.email}
            </span>
          </span>
          <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <>
      <DropdownMenu>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={trigger} />
            <TooltipContent side="right">{user.name}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{texts.nav.userMenu}</DropdownMenuLabel>
            <DropdownMenuItem render={<Link href="/settings/profile" />}>
              <UserIcon />
              {texts.profile.title}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setHelpOpen(true)}>
              <KeyboardIcon />
              {texts.shortcuts.open}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SunMoonIcon />
                {texts.theme.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-40">
                <DropdownMenuRadioGroup
                  value={theme ?? "system"}
                  onValueChange={(value) => setTheme(value as string)}
                >
                  <DropdownMenuRadioItem value="light">
                    <SunIcon />
                    {texts.theme.light}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <MoonIcon />
                    {texts.theme.dark}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <MonitorIcon />
                    {texts.theme.system}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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
