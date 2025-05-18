
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/components/app/my-health-companion/AppContext';
import { BottomNavigationBar } from '@/components/app/my-health-companion/BottomNavigationBar';

export const metadata: Metadata = {
  title: 'MyHealthCompanion',
  description: 'Your personal companion for a healthier lifestyle.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow pb-16"> {/* Padding bottom for nav bar on all screen sizes */}
              {children}
            </main>
            <BottomNavigationBar />
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
