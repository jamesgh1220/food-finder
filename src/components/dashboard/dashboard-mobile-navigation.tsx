"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { messages } from "@/lib/i18n/messages";

interface DashboardMobileNavigationProps {
  email: string;
}

const navigationItems = [
  { href: "/dashboard/pantry", label: messages.dashboard.pantryNav },
  { href: "/dashboard/recipes", label: messages.dashboard.recipesNav },
  { href: "/dashboard/favorites", label: messages.favorites.nav },
];

export function DashboardMobileNavigation({
  email,
}: DashboardMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="dashboard-mobile-menu"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        >
          {isOpen ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {isOpen ? (
        <div
          id="dashboard-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-border bg-card px-6 py-5"
        >
          <nav aria-label="Navegación principal" className="flex flex-col">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="border-b border-border py-3 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {email}
            </span>
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </div>
  );
}
