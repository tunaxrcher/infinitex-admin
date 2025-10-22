import { ReactNode, Suspense } from 'react';
import { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import { Toaster } from '@src/shared/components/ui/sonner';
import { cn } from '@src/shared/lib/utils';
import { AuthProvider } from '@src/shared/providers/auth-provider';
import { I18nProvider } from '@src/shared/providers/i18n-provider';
import { ModulesProvider } from '@src/shared/providers/modules-provider';
import { QueryProvider } from '@src/shared/providers/query-provider';
import { SettingsProvider } from '@src/shared/providers/settings-provider';
import { ThemeProvider } from '@src/shared/providers/theme-provider';
import { TooltipsProvider } from '@src/shared/providers/tooltips-provider';
import '@src/shared/css/styles.css';
import '@src/shared/components/keenicons/assets/styles.css';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-kanit',
});

export const metadata: Metadata = {
  title: {
    template: '%s | InfiniteX',
    default: 'InfiniteX Admin', // a default is required when creating a template
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
          kanit.className,
        )}
      >
        <QueryProvider>
          <AuthProvider>
            <SettingsProvider>
              <ThemeProvider>
                <I18nProvider>
                  <TooltipsProvider>
                    <ModulesProvider>
                      <Suspense>{children}</Suspense>
                      <Toaster />
                    </ModulesProvider>
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
