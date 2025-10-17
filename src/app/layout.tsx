import { ReactNode, Suspense } from 'react';
import { Inter } from 'next/font/google';
import { cn } from '@src/shared/lib/utils';
import { SettingsProvider } from '@src/shared/providers/settings-provider';
import { TooltipsProvider } from '@src/shared/providers/tooltips-provider';
import { Toaster } from '@src/shared/components/ui/sonner';
import { Metadata } from 'next';
import { AuthProvider } from '@src/shared/providers/auth-provider';
import { I18nProvider } from '@src/shared/providers/i18n-provider';
// import { ModulesProvider } from '@src/shared/providers/modules-provider';
import { QueryProvider } from '@src/shared/providers/query-provider';
import { ThemeProvider } from '@src/shared/providers/theme-provider';

const inter = Inter({ subsets: ['latin'] });

import '@src/shared/css/styles.css';
import '@src/shared/components/keenicons/assets/styles.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Metronic',
    default: 'Metronic', // a default is required when creating a template
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className="h-full" suppressHydrationWarning>
      <body
        className={cn(
          'antialiased flex h-full text-base text-foreground bg-background',
          inter.className,
        )}
      >
        <QueryProvider>
          <AuthProvider>
            <SettingsProvider>
              <ThemeProvider>
                <I18nProvider>
                  <TooltipsProvider>
                    {/* <ModulesProvider> */}
                      <Suspense>{children}</Suspense>
                      <Toaster />
                    {/* </ModulesProvider> */}
                  </TooltipsProvider>
                </I18nProvider>
              </ThemeProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
