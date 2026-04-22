import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
    Menu, 
    X, 
    Home, 
    LogOut, 
    User, 
    ShoppingBag, 
    Coins, 
    CalendarHeart, 
    Package, 
    Smartphone,
    LayoutDashboard,
    ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { user, profile, signOut } = useAuth();
    const { totalItems } = useCart();

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

    const navLinks = [
        { path: "/", label: "Home", icon: Home },
        { path: "/products", label: "Store", icon: ShoppingCart },
        { path: "/subscriptions", label: "Plans", icon: CalendarHeart },
        { path: "/wallet", label: "Wallet", icon: Coins },
        { path: "/orders", label: "Orders", icon: Package },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
            <div className="container-main">
                <div className="flex items-center justify-between h-20 px-4 md:px-8">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
                        <div className="relative">
                            <img
                                src="/favicon.png"
                                alt="MMVALI Dairy Farm"
                                className="w-11 h-11 rounded-2xl object-cover shadow-lg group-hover:rotate-6 transition-transform"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary w-4 h-4 rounded-full border-2 border-white" />
                        </div>
                        <div className="flex flex-col leading-none text-left">
                            <span className="font-display text-xl font-black text-slate-900 tracking-tighter">
                                MMVALI <span className="text-primary italic">Dairy</span>
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Farm Fresh</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "font-black text-[11px] uppercase tracking-widest transition-all hover:text-primary relative group py-2",
                                    isActive(link.path) ? "text-primary" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {link.label}
                                <span className={cn(
                                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-300",
                                    isActive(link.path) ? "w-4" : "w-0 group-hover:w-4"
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
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Logged as</p>
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
                            className={cn(
                                "md:hidden w-11 h-11 flex items-center justify-center rounded-2xl active:scale-90 transition-all z-[60]",
                                isMenuOpen ? "bg-slate-900 text-white" : "bg-slate-50 border border-slate-200 text-slate-900"
                            )}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Modern Mobile Navigation Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 1.1, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, y: -20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-50 md:hidden bg-white/95 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-12 overflow-y-auto"
                        >
                            <div className="flex flex-col gap-10">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2 leading-none">Navigation Center</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {navLinks.map((link, idx) => {
                                            const Icon = link.icon;
                                            return (
                                                <motion.div
                                                    key={link.path}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 + (idx * 0.05) }}
                                                >
                                                    <Link
                                                        to={link.path}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className={cn(
                                                            "h-32 rounded-[32px] p-6 flex flex-col justify-between transition-all active:scale-95 border",
                                                            isActive(link.path) 
                                                                ? "bg-slate-950 text-white border-slate-950 shadow-2xl shadow-slate-950/20" 
                                                                : "bg-slate-50 text-slate-400 border-slate-100"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                                                            isActive(link.path) ? "bg-white/10" : "bg-white border border-slate-200"
                                                        )}>
                                                            <Icon className={cn("w-5 h-5", isActive(link.path) ? "text-primary" : "text-slate-400")} />
                                                        </div>
                                                        <span className="font-black text-xs uppercase tracking-widest">{link.label}</span>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                        
                                        {/* Profile Item (dynamic) */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + (navLinks.length * 0.05) }}
                                        >
                                            <Link
                                                to={user ? "/orders" : "/auth"}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="h-32 rounded-[32px] p-6 flex flex-col justify-between transition-all active:scale-95 border bg-white border-primary/20 shadow-lg shadow-primary/5"
                                            >
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 shadow-inner">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                                <span className="font-black text-xs uppercase tracking-widest text-slate-900">
                                                    {user ? "My Identity" : "Get Started"}
                                                </span>
                                            </Link>
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-6">
                                    <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-slate-950/30 ring-1 ring-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                                <Smartphone className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5 italic">Quick Support</p>
                                                <p className="text-xs font-black">+91 6309835752</p>
                                            </div>
                                        </div>
                                        <Button variant="whatsapp" className="rounded-xl h-10 text-[10px] uppercase font-black px-6 border-b-2 border-emerald-700" asChild>
                                            <a href="https://wa.me/916309835752" target="_blank" rel="noopener noreferrer">CHAT</a>
                                        </Button>
                                    </div>

                                    {user && (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full h-14 rounded-2xl text-rose-500 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-50"
                                            onClick={() => { signOut(); setIsMenuOpen(false); }}
                                        >
                                            <LogOut className="w-4 h-4 mr-3" /> Terminate Session
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Header;
