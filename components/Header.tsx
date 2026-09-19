"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, LogOut, User as UserIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { t, locale, setLocale } = useTranslation();
  const { data: session } = useSession();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  const navLinks = [
    { href: "/", label: t("nav.dashboard") },
    { href: "/transactions", label: t("nav.transactions") },
    { href: "/lending", label: t("nav.lending") },
    { href: "/chat", label: t("nav.chat") },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="bg-[#0f2044] border-b border-blue-900 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-semibold">
            <Wallet size={20} className="text-teal-400" />
            <span>BudgetMitra</span>
          </Link>

          {/* Nav for authenticated users */}
          {session && !isAuthPage && (
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-teal-600 text-white"
                      : "text-blue-100 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {/* Locale toggle */}
            <button
              onClick={() => setLocale(locale === "en" ? "hi" : "en")}
              className="text-xs font-medium text-blue-200 hover:text-white border border-blue-700 hover:border-blue-500 px-2.5 py-1 rounded-md transition-colors"
            >
              {locale === "en" ? "हिंदी" : "English"}
            </button>

            {/* Auth actions */}
            {session ? (
              <div className="flex items-center gap-2 ml-2">
                <span
                  className="hidden md:flex items-center gap-1 text-xs text-blue-200 max-w-[150px] truncate"
                  title={session.user?.email || ""}
                >
                  <UserIcon size={13} className="text-teal-400 shrink-0" />
                  <span className="truncate">{session.user?.email}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs font-medium text-blue-200 hover:text-white bg-white/5 hover:bg-[#f4614d] border border-blue-800 hover:border-transparent px-2.5 py-1 rounded-md transition-all"
                  title="Log out"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            ) : !isAuthPage ? (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="text-xs font-medium text-blue-200 hover:text-white px-2.5 py-1 rounded-md transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md transition-colors"
                >
                  Sign up
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile nav for authenticated users */}
        {session && !isAuthPage && (
          <div className="flex sm:hidden gap-1 pb-2 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-teal-600 text-white"
                    : "text-blue-200 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
