"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "How It Works", href: "#how-it-works" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
];

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-lg shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">bx</span>
            </div>
            <span className="text-xl font-bold text-dark-900">
              boo<span className="text-primary-600">.x</span>.eat
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 text-dark-600 hover:text-primary-700 font-medium transition-colors rounded-lg hover:bg-primary-50"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-dark-600 hover:text-primary-700 font-medium transition-colors rounded-lg hover:bg-primary-50"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400 rounded-full shadow-lg hover:shadow-glow transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-dark-700" />
            ) : (
              <Menu className="w-6 h-6 text-dark-700" />
            )}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block px-4 py-3 text-dark-700 hover:text-primary-700 font-medium rounded-lg hover:bg-primary-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-2 border-t mt-4">
                <Link
                  href="/login"
                  className="block w-full text-center px-6 py-3 text-dark-800 bg-white border-2 border-gray-200 hover:border-primary-300 hover:text-primary-700 font-semibold rounded-full transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center px-6 py-3 text-white font-semibold bg-gradient-to-r from-primary-700 to-primary-500 rounded-full shadow-lg transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
