import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/src/components/theme/theme-provider";
import { SessionProvider } from "@/src/components/providers/session-provider";
import ErrorBoundary from "@/src/components/ui/error-boundary";
import NetworkStatusBanner from "@/src/components/ui/network-status-banner";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Script minimo executado antes da primeira pintura para evitar flash branco no modo escuro
const themeInitScript = `
(function(){try{var t=localStorage.getItem('nero_theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;r.setAttribute('data-theme',t);if(t==='dark'){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){}})();
`;

export const metadata: Metadata = {
  title: "NERO | Moda & Streetwear Moderno",
  description: "Minimalismo Moderno de Alto Contraste",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white dark:bg-[#121212] text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <ThemeProvider>
          <SessionProvider>
            <ErrorBoundary scope="global">
              {children}
            </ErrorBoundary>
            <NetworkStatusBanner />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
