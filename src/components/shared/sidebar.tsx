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
import { Separator } from '@/components/ui/separator';

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
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Branding */}
      <div className="flex h-14 items-center gap-3 px-5">
        <Image
          src="/maptrack-logo.svg"
          alt="MapTrack"
          width={28}
          height={28}
          className="shrink-0"
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm leading-tight tracking-tight">MapTrack</span>
          <span className="text-[10px] text-muted-foreground leading-tight">Integrator</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive && 'text-primary')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="flex items-center justify-between p-3 px-5">
        <p className="text-[11px] text-muted-foreground">v0.1.0</p>
        <ThemeToggle />
      </div>
    </aside>
  );
}
