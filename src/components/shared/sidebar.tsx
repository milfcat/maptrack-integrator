'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Plug,
  ScrollText,
  Settings,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/integrations', label: 'Integrations', icon: Plug },
  { href: '/logs', label: 'Event Logs', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[210px] flex-col bg-sidebar">
      {/* Logo area */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Image
          src="/maptrack-logo.svg"
          alt="MapTrack"
          width={28}
          height={28}
          className="shrink-0"
        />
        <Image
          src="/maptrack-wordmark.svg"
          alt="MapTrack"
          width={90}
          height={20}
          className="shrink-0 brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-[11px] text-sidebar-foreground/40">v0.1.0</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
