import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    Home,
    LogOut,
    User,
    Coins,
    CalendarHeart,
    Package,
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
    const { user, signOut } = useAuth();
    const { totalItems } = useCart();

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "";
    }, [isMenuOpen]);

    const navLinks = [
        { path: "/", label: "Home", icon: Home },
        { path: "/products", label: "Store", icon: ShoppingCart },
        { path: "/subscriptions", label: "Subscription", icon: CalendarHeart },
        { path: "/wallet", label: "Wallet", icon: Coins },
        { path: "/orders", label: "Orders", icon: Package },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
            <div className="container-main">
                <div className="flex items-center justify-between h-20 px-4 md:px-8">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/favicon.png" className="w-10 h-10 rounded-xl" />
                        <span className="font-black text-lg">MM Dairy</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "font-bold text-sm uppercase",
                                    isActive(link.path) ? "text-primary" : "text-gray-500"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">

                        <CartDrawer />

                        {/* Desktop Auth Button */}
                        <div className="hidden md:block">
                            {user ? (
                                <Button
                                    onClick={signOut}
                                    variant="outline"
                                    className="rounded-xl border-slate-200 hover:bg-slate-50 hover:text-red-500 transition-all font-bold text-xs uppercase tracking-wider h-10 px-5"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </Button>
                            ) : (
                                <Link to="/auth">
                                    <Button className="rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5 shadow-sm">
                                        Login
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="md:hidden w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl"
                        >
                            <Menu />
                        </button>
                    </div>
                </div>

                {/* MOBILE MENU */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <>
                            {/* BACKDROP */}
                            <motion.div
                                className="fixed inset-0 bg-black/40 z-[998]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMenuOpen(false)}
                            />

                            {/* DRAWER */}
                            <motion.div
                                className="fixed top-0 right-0 h-screen w-[85%] max-w-sm bg-white z-[999] flex flex-col"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                            >

                                {/* HEADER (FIXED) */}
                                <div className="flex items-center justify-between p-5 border-b">
                                    <h2 className="font-bold text-sm uppercase">Menu</h2>
                                    <button onClick={() => setIsMenuOpen(false)}>
                                        <X />
                                    </button>
                                </div>

                                {/* SCROLLABLE CONTENT */}
                                <div className="flex-1 overflow-y-auto px-5 py-6">

                                    {/* NAV LINKS */}
                                    <div className="flex flex-col gap-6">
                                        {navLinks.map((link) => (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={cn(
                                                    "text-lg font-bold",
                                                    isActive(link.path)
                                                        ? "text-primary"
                                                        : "text-gray-800"
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* USER SECTION */}
                                    <div className="mt-10 pt-6 border-t">
                                        {user ? (
                                            <>
                                                <p className="text-sm mb-3 break-all">{user.email}</p>
                                                <Button onClick={signOut} className="w-full">
                                                    Logout
                                                </Button>
                                            </>
                                        ) : (
                                            <Link
                                                to="/auth"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="text-lg font-bold"
                                            >
                                                Sign In
                                            </Link>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </header>
    );
};

export default Header;