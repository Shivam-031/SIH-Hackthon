import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import type { Notification } from '@/types';
import {
  Home, Plus, User, LogOut, Sun, Moon, MapPin, Award,
  Bell, Map, Menu, X, ChevronRight, LayoutDashboard,
} from 'lucide-react';

// Inline CivicConnect logo mark
const LogoMark = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lmg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb"/>
        <stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#lmg)"/>
    <path d="M16 4C11.6 4 8 7.6 8 12C8 17.5 14.4 23.6 15.5 24.6C15.8 24.9 16.2 24.9 16.5 24.6C17.6 23.6 24 17.5 24 12C24 7.6 20.4 4 16 4Z" fill="white" opacity="0.95"/>
    <circle cx="16" cy="12" r="4.5" fill="#2563eb"/>
    <polyline points="13.5,12 15,13.5 18.5,10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <ellipse cx="16" cy="26.5" rx="3" ry="1.2" fill="black" opacity="0.15"/>
  </svg>
);

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiService.getNotifications()
      .then(res => {
        setNotifications(res.data.notifications.slice(0, 5));
        setUnread(res.data.unreadCount);
      })
      .catch(() => {});
  }, [user, location.pathname]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const dashLink = user?.role === 'official' || user?.role === 'admin'
    ? '/official-dashboard' : '/citizen-dashboard';

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const markAllRead = async () => {
    await apiService.markAllNotificationsRead().catch(() => {});
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const NAV_LINKS = user ? [
    { to: dashLink, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map',   label: 'Map',       icon: Map },
    ...(user.role === 'citizen' ? [{ to: '/report-issue', label: 'Report Issue', icon: Plus }] : []),
    { to: '/profile', label: 'Profile', icon: User },
  ] : [];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center px-3 md:px-4 gap-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <LogoMark size={30} />
          <span className="text-lg md:text-xl font-bold text-foreground hidden xs:block">CivicConnect</span>
        </Link>

        {/* Desktop nav links */}
        {user && (
          <nav className="hidden md:flex items-center gap-5 ml-4 flex-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(to) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto">

          {/* Theme toggle */}
          <Button
            variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <>
              {/* Points badge — desktop only */}
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-xs">
                <Award className="h-3 w-3" />
                {user.points ?? user.civicScore ?? 0}
              </Badge>

              {/* Notification bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-9 md:w-9">
                    <Bell className="h-4 w-4" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 md:w-80" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between py-2">
                    <span className="font-semibold">Notifications</span>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                        Mark all read
                      </button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <DropdownMenuItem
                        key={n._id}
                        className={`flex flex-col items-start gap-0.5 py-2.5 px-3 cursor-default ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                          <span className="font-medium text-sm leading-tight">{n.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground leading-snug pl-3.5">{n.message}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Avatar dropdown — desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full p-0 hidden md:flex">
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
                      <AvatarImage src={user.profileImage?.url || user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <Badge variant="outline" className="w-fit text-xs mt-1 capitalize">{user.role}</Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} asChild>
                      <Link to={to} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive gap-2">
                    <LogOut className="h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 flex flex-col">
                  {/* Mobile menu header */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImage?.url || user.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 shrink-0 text-xs">
                      <Award className="h-3 w-3" />
                      {user.points ?? 0}
                    </Badge>
                  </div>

                  {/* Mobile nav links */}
                  <nav className="flex-1 overflow-y-auto py-2">
                    {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted ${
                          isActive(to) ? 'text-primary bg-primary/5' : 'text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {label}
                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile bottom actions */}
                  <div className="border-t p-4 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark'
                        ? <><Sun className="h-4 w-4" /> Light mode</>
                        : <><Moon className="h-4 w-4" /> Dark mode</>
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register" className="text-xs sm:text-sm">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
