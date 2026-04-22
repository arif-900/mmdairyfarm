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
        { path: "/subscriptions", label: "Subscription" },
        { path: "/wallet", label: "Wallet" },
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
