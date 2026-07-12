import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import PillNav from "@/components/ui/PillNav";
import { useState } from "react";

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, signOut } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/products", label: "Store" },
        { href: "/subscriptions", label: "Subscription" },
        { href: "/wallet", label: "Wallet" },
        { href: "/orders", label: "Orders" },
        ...(user ? [{ href: "#profile", label: "My Profile" }] : []),
    ];

    // Initials from name or email
    const initials = profile?.full_name
        ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email
            ? user.email[0].toUpperCase()
            : "U";

    const displayName = profile?.full_name || user?.email?.split("@")[0] || "Account";

    const actions = (
        <div className="flex items-center gap-3">
            <CartDrawer />

            {user ? (
                <div className="relative">
                    {/* Premium profile chip */}
                    <button
                        onClick={() => setProfileOpen(prev => !prev)}
                        className="hidden md:flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                        style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                        {/* Avatar circle */}
                        <span className="w-8 h-8 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                            {initials}
                        </span>

                        {/* Name + badge */}
                        <span className="flex flex-col items-start min-w-0">
                            <span className="text-[13px] font-medium text-slate-800 leading-tight truncate max-w-[100px]">
                                {displayName}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 leading-tight">
                                Account Active
                            </span>
                        </span>

                        {/* Dropdown arrow */}
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                    </button>

                    {/* Dropdown menu */}
                    {profileOpen && (
                        <>
                            {/* Click-away overlay */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setProfileOpen(false)}
                            />
                            <div
                                className="absolute right-0 top-[calc(100%+8px)] z-50 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-150"
                                style={{ fontFamily: "'Roboto', sans-serif" }}
                            >
                                <button
                                    onClick={() => {
                                        setProfileOpen(false);
                                        window.dispatchEvent(new CustomEvent('open-profile-settings'));
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    <UserIcon className="w-4 h-4 text-slate-400" />
                                    My Profile
                                </button>
                                <div className="h-px bg-slate-100 mx-3 my-1" />
                                <button
                                    onClick={() => { setProfileOpen(false); signOut(); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <Button
                    onClick={() => navigate('/auth')}
                    className="hidden md:flex rounded-full font-bold text-[13px] h-10 px-6 shadow-md shadow-primary/20"
                    style={{ fontFamily: "'Roboto', sans-serif" }}
                >
                    Sign In
                </Button>
            )}
        </div>
    );

    return (
        <header>
            <PillNav
                logo="/favicon.png"
                logoAlt="MM Dairy"
                items={navLinks}
                activeHref={location.pathname}
                actions={actions}
                pillColor="#16a34a"
                pillTextColor="#374151"
                hoveredPillTextColor="#ffffff"
                baseColor="#ffffff"
            />
        </header>
    );
};

export default Header;
