
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
  manifest: '/manifest.json', // Added manifest link
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="MyHealthCompanion" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MyHealthCompanion" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" /> 
        <meta name="msapplication-TileColor" content="#64B5F6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#64B5F6" /> 
        
        {/* Add more PWA related tags if needed, e.g. for specific icons for Apple */}
        {/* 
        <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-iphone-retina.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-ipad-retina.png" />
        */}
      </head>
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
