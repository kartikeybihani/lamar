"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, Home, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/new", label: "New Care Plan", icon: FileText },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
              Care Plan Generator
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out group overflow-hidden",
                    "backdrop-blur-sm border border-white/10",
                    "hover:shadow-lg hover:shadow-blue-500/10",
                    isActive
                      ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20 text-white"
                      : "bg-white/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 relative z-10 transition-all duration-300",
                      isActive ? "text-white scale-110" : "text-gray-600"
                    )}
                  />
                  <span
                    className={cn(
                      "hidden sm:inline relative z-10 transition-all duration-300",
                      isActive ? "text-white font-semibold" : "text-gray-700"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
