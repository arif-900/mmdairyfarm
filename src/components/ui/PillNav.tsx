import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import './PillNav.css';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  LogOut, 
  User as UserIcon, 
  Home, 
  Store, 
  Calendar, 
  Wallet, 
  ShoppingBag, 
  Phone, 
  Settings, 
  ShieldCheck, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export interface PillNavProps {
  logo: string;
  logoAlt?: string;
  items: PillNavItem[];
  activeHref?: string;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  onMobileMenuClick?: () => void;
  initialLoadAnimation?: boolean;
  actions?: React.ReactNode;
}

const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#fff',
  pillColor = '#16a34a',
  hoveredPillTextColor = '#fff',
  pillTextColor = '#0f172a',
  onMobileMenuClick,
  initialLoadAnimation = true,
  actions
}) => {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  
  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Settings Dialog Form States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"view" | "edit_profile" | "change_password">("view");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLElement | null>(null);

  // Sync profile details once loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Listen for external open signal (e.g. from Header dropdown)
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('open-profile-settings', handleOpenSettings);
    return () => window.removeEventListener('open-profile-settings', handleOpenSettings);
  }, []);

  // Reset dialog inputs when modal opens or closes
  useEffect(() => {
    if (isSettingsOpen) {
      setViewMode("view");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (profile) {
        setFullName(profile.full_name || "");
        setPhone(profile.phone || "");
      }
    }
  }, [isSettingsOpen, profile]);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach(circle => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, x: -320 });
    }

    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;

      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, {
          scale: 1,
          duration: 0.6,
          ease
        });
      }

      if (navItems) {
        // GSAP cannot tween to width:'auto' – use opacity + x slide-in instead
        gsap.set(navItems, { opacity: 0, x: -16 });
        gsap.to(navItems, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease,
          delay: 0.1
        });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, {
      rotate: 360,
      duration: 0.2,
      ease,
      overwrite: 'auto'
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, x: -320 },
          {
            opacity: 1,
            x: 0,
            duration: 0.25,
            ease
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          x: -320,
          duration: 0.25,
          ease,
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }

    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => href && !isExternalLink(href);

  const cssVars = {
    ['--base']: baseColor,
    ['--pill-bg']: pillColor,
    ['--hover-text']: hoveredPillTextColor,
    ['--pill-text']: resolvedPillTextColor
  } as React.CSSProperties;

  const drawerLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Store", icon: Store },
    { href: "/subscriptions", label: "Subscription", icon: Calendar },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/orders", label: "Orders", icon: ShoppingBag },
    { href: "/contact", label: "Contact", icon: Phone },
    { href: "#", label: "Settings", icon: Settings },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await updateProfile({
        full_name: fullName,
        phone: phone,
      });
      
      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully.",
        });
        setViewMode("view");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPassword === newPassword) {
      toast({
        title: "Same Password",
        description: "New password cannot be the same as your current password.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      // Verify Current Password by signing in again
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        toast({
          title: "Incorrect Password",
          description: "The current password you entered is incorrect.",
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }

      // Update password
      const { error: passwordError } = await updatePassword(newPassword);
      if (passwordError) {
        toast({
          title: "Update Failed",
          description: passwordError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password changed successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setViewMode("view");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
        {isRouterLink(items?.[0]?.href) ? (
          <Link
            to="/"
            className="pill-logo"
            ref={logoRef as React.RefObject<HTMLAnchorElement>}
            onMouseEnter={handleLogoEnter}
          >
            <img
              src={logo}
              alt={logoAlt}
              ref={logoImgRef}
            />
            <span className="logo-text">MM Dairy</span>
          </Link>
        ) : (
          <a
            href="/"
            className="pill-logo"
            ref={logoRef as React.RefObject<HTMLAnchorElement>}
            onMouseEnter={handleLogoEnter}
          >
            <img
              src={logo}
              alt={logoAlt}
              ref={logoImgRef}
            />
            <span className="logo-text">MM Dairy</span>
          </a>
        )}

        <div className="pill-nav-items desktop-only" ref={navItemsRef}>
          <ul className="pill-list" role="menubar">
            {items.map((item, i) => {
              const isProfileTab = item.label === "My Profile";
              
              if (isProfileTab) {
                return (
                  <li key={item.href} role="none" className="pill-item" onMouseEnter={() => handleEnter(i)} onMouseLeave={() => handleLeave(i)}>
                    <button
                      role="menuitem"
                      onClick={() => {
                        if (user) {
                          setIsSettingsOpen(true);
                        } else {
                          navigate('/auth');
                        }
                      }}
                      className={`pill${activeHref === item.href ? ' is-active' : ''} bg-transparent border-none cursor-pointer text-left w-full h-full flex items-center justify-center`}
                      style={{
                        color: resolvedPillTextColor,
                        fontFamily: "inherit"
                      }}
                    >
                      <span
                        className="pill-circle"
                        ref={el => {
                          circleRefs.current[i] = el;
                        }}
                      />
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" style={{ color: hoveredPillTextColor }}>
                        <span className="pill-label-hover-inner">
                          {item.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={item.href} role="none">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      to={item.href}
                      className={`pill${activeHref === item.href ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      <span
                        className="pill-circle"
                        ref={el => {
                          circleRefs.current[i] = el;
                        }}
                      />
                      <span className="pill-label">{item.label}</span>
                      <span
                        className="pill-label-hover"
                        style={{ color: hoveredPillTextColor }}
                      >
                        <span className="pill-label-hover-inner">
                          {item.label}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={`pill${activeHref === item.href ? ' is-active' : ''}`}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                    >
                      <span
                        className="pill-circle"
                        ref={el => {
                          circleRefs.current[i] = el;
                        }}
                      />
                      <span className="pill-label">{item.label}</span>
                      <span
                        className="pill-label-hover"
                        style={{ color: hoveredPillTextColor }}
                      >
                        <span className="pill-label-hover-inner">
                          {item.label}
                        </span>
                      </span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pill-nav-actions">
          {actions}
          <button
            className="mobile-menu-button mobile-only"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            ref={hamburgerRef}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[50] transition-opacity duration-250 animate-in fade-in"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Redesigned Side Drawer Container */}
      <div 
        className="mobile-menu-popover mobile-only fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] h-full bg-white z-[60] flex flex-col shadow-[4px_0_25px_rgba(0,0,0,0.06)] border-r border-[#E5E7EB] font-sans" 
        ref={mobileMenuRef} 
        style={{ ...cssVars, fontFamily: "'Roboto', sans-serif" }}
      >
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />

        {/* Profile Header */}
        <div className="p-6 bg-slate-50 border-b border-[#E5E7EB] flex flex-col gap-4 relative">
          <button 
            onClick={toggleMobileMenu} 
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/50 hover:text-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mt-2">
            {/* Circular avatar */}
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-base shrink-0 border border-emerald-600/10 shadow-sm">
              {user ? (
                profile?.full_name 
                  ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() 
                  : (user.email ? user.email[0].toUpperCase() : 'U')
              ) : 'G'}
            </div>

            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-base leading-tight truncate">
                {user ? (profile?.full_name || user.email?.split('@')[0]) : "Guest User"}
              </p>
              <p className="text-xs font-normal text-slate-400 truncate mt-0.5">
                {user ? user.email : "Please sign in to order freshness"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            {user ? (
              <>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Account Active
                </span>
                <button 
                  onClick={() => { 
                    toggleMobileMenu(); 
                    setIsSettingsOpen(true); 
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  View Profile
                </button>
              </>
            ) : (
              <Button 
                onClick={() => { toggleMobileMenu(); navigate('/auth'); }}
                size="sm"
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-[10px] h-9"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Group Navigation Items Container */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2 space-y-1">
            {drawerLinks.map(linkItem => {
              const Icon = linkItem.icon;
              const isActive = activeHref === linkItem.href;
              const isSettings = linkItem.label === "Settings";

              const content = (
                <div 
                  className={cn(
                    "w-full h-[52px] min-h-[52px] rounded-xl flex items-center gap-4 px-4 transition-all duration-200 ease-in-out cursor-pointer select-none",
                    isActive 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600")} />
                  <span className="text-sm font-medium tracking-normal text-left">{linkItem.label}</span>
                </div>
              );

              return (
                <div key={linkItem.label}>
                  {isSettings ? (
                    <div 
                      onClick={() => { 
                        toggleMobileMenu(); 
                        if (user) {
                          setIsSettingsOpen(true); 
                        } else {
                          navigate('/auth');
                        }
                      }} 
                      className="group"
                    >
                      {content}
                    </div>
                  ) : isRouterLink(linkItem.href) ? (
                    <Link to={linkItem.href} onClick={toggleMobileMenu} className="group block">
                      {content}
                    </Link>
                  ) : (
                    <a href={linkItem.href} onClick={toggleMobileMenu} className="group block">
                      {content}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Logout Section at the Bottom */}
        {user && (
          <div className="p-4 border-t border-[#E5E7EB] bg-slate-50">
            <button 
              onClick={() => {
                signOut();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 h-12 min-h-[48px] rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all font-bold text-xs uppercase tracking-widest border border-rose-100/50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Profile & Settings Dialog Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-6 bg-white border border-slate-100 shadow-xl font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          
          {viewMode === "view" && (
            <>
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-xl font-bold text-slate-900">Account Details</DialogTitle>
                <DialogDescription className="text-sm text-slate-400 font-normal">
                  Your registered profile information.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 mt-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Full Name</span>
                  <p className="text-sm font-semibold text-slate-800">{profile?.full_name || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Phone Number</span>
                  <p className="text-sm font-semibold text-slate-800">{profile?.phone || "Not set"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400">Email Address</span>
                  <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 mt-4">
                <Button 
                  onClick={() => setViewMode("edit_profile")}
                  className="w-full rounded-xl h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setViewMode("change_password")}
                  className="w-full rounded-xl h-11 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Change Password
                </Button>
              </div>
            </>
          )}

          {viewMode === "edit_profile" && (
            <>
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-xl font-bold text-slate-900">Edit Profile</DialogTitle>
                <DialogDescription className="text-sm text-slate-400 font-normal">
                  Update your contact details below.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveProfile} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-slate-500">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 transition-all bg-white"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-slate-500">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 transition-all bg-white"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewMode("view")}
                    className="flex-1 rounded-xl h-11 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {updating ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </form>
            </>
          )}

          {viewMode === "change_password" && (
            <>
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-xl font-bold text-slate-900">Change Password</DialogTitle>
                <DialogDescription className="text-sm text-slate-400 font-normal">
                  Provide your current password to choose a new one.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSavePassword} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <label htmlFor="currentPassword" className="text-xs font-semibold text-slate-500">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 transition-all bg-white"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-xs font-semibold text-slate-500">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 transition-all bg-white"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-500">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800 transition-all bg-white"
                    placeholder="Verify new password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewMode("view")}
                    className="flex-1 rounded-xl h-11 border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {updating ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </>
          )}

        </DialogContent>
      </Dialog>

    </>
  );
};

export default PillNav;
