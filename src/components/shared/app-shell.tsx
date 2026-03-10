'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile header + sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 bg-sidebar px-4">
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="text-sidebar-foreground hover:bg-sidebar-accent" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <Image src="/maptrack-logo.svg" alt="MapTrack" width={22} height={22} />
          <span className="font-semibold text-sm text-sidebar-foreground">MapTrack Integrator</span>
        </div>

        <SheetContent side="left" className="w-[210px] p-0 bg-sidebar border-sidebar-border" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area with gray background */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-5 md:p-8 pt-18 md:pt-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
