import { useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import PillNav from "@/components/ui/PillNav";

const Header = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/products", label: "Store" },
        { href: "/subscriptions", label: "Subscription" },
        { href: "/wallet", label: "Wallet" },
        { href: "/orders", label: "Orders" },
    ];

    const actions = (
        <div className="flex items-center gap-3">
            <CartDrawer />
            <div className="hidden md:block">
                {user ? (
                    <Button
                        onClick={signOut}
                        variant="outline"
                        className="rounded-xl border-slate-200 hover:bg-slate-50 hover:text-red-500 transition-all font-bold text-[10px] uppercase tracking-wider h-10 px-4"
                    >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Logout
                    </Button>
                ) : (
                    <Button 
                        onClick={() => window.location.href = '/auth'}
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20"
                    >
                        Login
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <header className="sticky top-0 z-50">
            <PillNav
                logo="/favicon.png"
                logoAlt="MM Dairy"
                items={navLinks}
                activeHref={location.pathname}
                actions={actions}
                pillColor="#16a34a"
                pillTextColor="#0f172a"
                hoveredPillTextColor="#ffffff"
                baseColor="#ffffff"
            />
        </header>
    );
};

export default Header;
