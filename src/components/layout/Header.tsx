import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Milk, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/products", label: "Products" },
    { path: "/faq", label: "FAQ" },
    { path: "/orders", label: "My Orders" },
    { path: "/privacy", label: "Privacy" },
    { path: "/terms", label: "Terms" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 px-4 md:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="https://i.ibb.co/s96b0wbK/IMG-20260308-WA0000.jpg"
              alt="MMVALI Dairy Farm"
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="font-display text-xl font-bold text-foreground">
              MMVALI Dairy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors hover:text-primary ${isActive(link.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {user.email || 'No email'}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Login</Link>
              </Button>
            )}
            <Button variant="whatsapp" size="lg" asChild>
              <a
                href="https://wa.me/919876543210?text=Hi, I'm interested in your dairy products!"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat with Us
              </a>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 px-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium py-2 transition-colors ${isActive(link.path)
                      ? "text-primary"
                      : "text-muted-foreground"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user.email || 'No email'}
                  </span>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Login</Link>
                </Button>
              )}
              <Button variant="whatsapp" className="mt-2" asChild>
                <a
                  href="https://wa.me/919876543210?text=Hi, I'm interested in your dairy products!"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chat with Us
                </a>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
