import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { texts } from "@/lib/texts";
import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: texts.app.name,
    template: `%s · ${texts.app.name}`,
  },
  description: texts.app.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes añade la clase del tema antes de hidratar.
    <html
      lang="es"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
