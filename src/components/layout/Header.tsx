import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Milk, LogOut, User, ShoppingBag, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { user, profile, signOut } = useAuth();
    const { totalItems } = useCart();

    const navLinks = [
        { path: "/", label: "Home" },
        { path: "/products", label: "Products" },
        { path: "/faq", label: "FAQ" },
        { path: "/orders", label: "My Orders" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
            <div className="container-main">
                <div className="flex items-center justify-between h-20 px-4 md:px-8">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
                        <div className="relative">
                            <img
                                src="/favicon.png"
                                alt="MMVALI Dairy Farm"
                                className="w-12 h-12 rounded-2xl object-cover shadow-lg group-hover:rotate-6 transition-transform"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary w-4 h-4 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex flex-col leading-none text-left">
                            <span className="font-display text-xl font-black text-slate-900 tracking-tighter">
                                MMVALI <span className="text-primary italic">Dairy</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Farm Fresh</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "font-black text-xs uppercase tracking-widest transition-all hover:text-primary relative group",
                                    isActive(link.path) ? "text-primary" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {link.label}
                                <span className={cn(
                                    "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                                    isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                                )} />
                            </Link>
                        ))}
                    </nav>

                    {/* CTA Actions */}
                    <div className="flex items-center gap-4">
                        <CartDrawer />

                        {user ? (
                            <div className="hidden md:flex items-center gap-4 border-l border-slate-200 pl-4 ml-2">
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Logged as</p>
                                    <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{user.email}</p>
                                    {profile !== null && (
                                        <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-lg shadow-amber-200/50 group/coin cursor-help transition-all hover:scale-105 active:scale-95">
                                            <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/40 shadow-inner">
                                                <img 
                                                    src="/favicon.png" 
                                                    className="w-full h-full object-cover animate-spin-slow group-hover/coin:animate-none" 
                                                    alt="Coin"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent" />
                                            </div>
                                            <span className="text-[10px] font-black tracking-wider text-white drop-shadow-sm">
                                                {profile.reward_coins || 0} <span className="opacity-80">COINS</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100">
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" asChild className="hidden md:flex rounded-xl font-black text-[11px] uppercase tracking-widest border-slate-200">
                                <Link to="/auth">Sign In</Link>
                            </Button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-900 active:scale-95 transition-transform"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <nav className="md:hidden py-8 px-6 bg-white border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`text-2xl font-black tracking-tighter flex items-center justify-between ${isActive(link.path)
                                        ? "text-primary"
                                        : "text-slate-400"
                                        }`}
                                >
                                    {link.label}
                                    {isActive(link.path) && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </Link>
                            ))}
                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                {user && profile && (
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-amber-500 p-0.5 shadow-lg shadow-amber-200 relative overflow-hidden">
                                                <img 
                                                    src="/favicon.png" 
                                                    className="w-full h-full object-cover rounded-full" 
                                                    alt="Reward Coin"
                                                />
                                                <div className="absolute inset-0 border-2 border-amber-400/50 rounded-full shadow-inner" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Your Rewards</p>
                                                <p className="text-lg font-black text-slate-900 leading-none mt-1">{profile.reward_coins || 0} Coins</p>
                                            </div>
                                        </div>
                                        <Link to="/orders" onClick={() => setIsMenuOpen(false)}>
                                            <Button size="sm" variant="ghost" className="text-amber-700 font-bold hover:bg-amber-100">View History</Button>
                                        </Link>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    {user ? (
                                        <Button variant="outline" className="rounded-2xl h-14 font-black text-xs uppercase" onClick={signOut}>
                                            Sign Out
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="rounded-2xl h-14 font-black text-xs uppercase" asChild>
                                            <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                                        </Button>
                                    )}
                                    <Button variant="whatsapp" className="rounded-2xl h-14 font-black text-xs uppercase" asChild>
                                        <a
                                            href="https://wa.me/916309835752"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            WhatsApp
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;
