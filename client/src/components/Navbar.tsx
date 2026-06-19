import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import type { Notification } from '@/types';
import {
  Home, Plus, User, LogOut, Sun, Moon, MapPin, Award, Bell, Map
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    apiService.getNotifications()
      .then(res => {
        setNotifications(res.data.notifications.slice(0, 5));
        setUnread(res.data.unreadCount);
      })
      .catch(() => {});
  }, [user, location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const dashLink = user?.role === 'official' || user?.role === 'admin'
    ? '/official-dashboard' : '/citizen-dashboard';

  const isActive = (path: string) => location.pathname === path;

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        isActive(to) ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {label}
    </Link>
  );

  const markAllRead = async () => {
    await apiService.markAllNotificationsRead().catch(() => {});
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="flex items-center space-x-2 mr-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">CivicConnect</span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center space-x-6 flex-1">
            {navLink(dashLink, 'Dashboard')}
            {navLink('/map', 'Map')}
            {user.role === 'citizen' && navLink('/report-issue', 'Report Issue')}
          </nav>
        )}

        <div className="flex items-center space-x-2 ml-auto">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {user ? (
            <div className="flex items-center space-x-2">
              {/* Civic score / points badge */}
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                <Award className="h-3 w-3" />
                <span>{user.points ?? user.civicScore ?? 0}</span>
              </Badge>

              {/* Notifications bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
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
                      <DropdownMenuItem key={n._id} className={`flex flex-col items-start gap-0.5 py-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                        <span className="font-medium text-sm">{n.title}</span>
                        <span className="text-xs text-muted-foreground leading-snug">{n.message}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImage?.url || user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="outline" className="w-fit text-xs capitalize">{user.role}</Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashLink} className="flex items-center">
                      <Home className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/map" className="flex items-center">
                      <Map className="mr-2 h-4 w-4" /> Map View
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'citizen' && (
                    <DropdownMenuItem asChild>
                      <Link to="/report-issue" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" /> Report Issue
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
              <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
