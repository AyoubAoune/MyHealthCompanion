
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardPlus, Lightbulb, LineChart, Settings } from 'lucide-react'; // Added Settings icon
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log', label: 'Log Food', icon: ClipboardPlus },
  { href: '/ideas', label: 'Meal Ideas', icon: Lightbulb },
  { href: '/stats', label: 'Statistics', icon: LineChart },
  { href: '/settings', label: 'Settings', icon: Settings }, // Added Settings item
];

export function BottomNavigationBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs p-2 rounded-md transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
