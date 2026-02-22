'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { LogOut, User, Menu, X, Trophy, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { uiTokens } from '@/lib/uiTokens';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="relative z-20 border-b border-border/70 bg-card/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pitch-lines">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 lg:gap-4 shrink-0">
            <div className="relative">
              <div className="relative rounded-xl bg-card p-1.5 border border-border/70 shadow-lg">
                <Image
                  src="https://ik.imagekit.io/s0kb1s3cx3/PWIOI/yello-Photoroom.png?updatedAt=1764439890622"
                  alt="Auction Logo"
                  width={56}
                  height={42}
                  className="w-10 h-10 sm:w-11 sm:h-11 lg:w-14 lg:h-11 object-contain"
                  priority
                />
              </div>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[1.6rem] lg:text-[2rem] text-shine">Premier League</span>
              <span className="font-medium text-xs tracking-[0.2em] uppercase text-muted-foreground">
                Cricket Auction Control
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-xs tracking-wide uppercase text-muted-foreground border border-border rounded-full px-3 py-1 bg-secondary/70">
              <Trophy className="h-3.5 w-3.5 text-primary" />
              Live Draft Arena
            </div>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="w-12 h-12 p-0 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200"
                    aria-label="Open user menu"
                  >
                    <User className="h-5 w-5 text-primary-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-popover border-border text-popover-foreground"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {user?.name || user.role}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/20 focus:text-destructive cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/admin/login">
                <Button
                  className={`${uiTokens.adminPrimaryButton} px-6 py-2 text-sm font-semibold`}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-2 p-2 -mr-1 rounded-full hover:bg-muted hover:shadow-lg w-10 h-10"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'max-h-96 opacity-100 visible'
              : 'max-h-0 opacity-0 invisible'
          } overflow-hidden`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 bg-card/90 backdrop-blur-xl border-t border-border/70">
            {isAuthenticated && user ? (
              <div className="px-3 py-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.name || user.role}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/20 hover:text-destructive px-4 py-2 text-left font-medium"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link
                href="/auth/admin/login"
                className="block px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted rounded-lg mx-2 mt-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
