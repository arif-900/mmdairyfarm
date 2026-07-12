import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Milk, Instagram, Facebook, Youtube, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      toast({
        title: "Subscribed Successfully",
        description: "Thank you for subscribing to the MM Dairy Farm newsletter!",
      });
      setEmail("");
      setLoading(false);
    }, 800);
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 font-body">
      <div className="container-main px-6 py-20 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="MMVALI Dairy Farm"
                className="w-10 h-10 rounded-xl object-cover border border-slate-800"
              />
              <span className="font-display text-xl font-bold text-white tracking-tight">
                MMVALI Dairy
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Fresh, pure dairy products delivered straight from our farm to your doorstep. Dedicated to providing the purest natural nutrition, rooted in a commitment to quality that spans generations.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com/mmvalidairyfarm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@mmvalidairyfarm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Youtube"
                className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-6">
            <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors duration-200">
                  Our Store
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="hover:text-white transition-colors duration-200">
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors duration-200">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors duration-200">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact details Column */}
          <div className="space-y-6">
            <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">Get In Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <svg className="w-4 h-4 text-primary flex-shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12.012 2C6.48 2 2 6.48 2 12.01c0 1.77.46 3.49 1.34 5.02L2 22l5.12-1.34c1.47.8 3.12 1.22 4.88 1.22 5.53 0 10.01-4.48 10.01-10.01C22.01 6.48 17.54 2 12.012 2zm.04 17.3c-1.53 0-3.04-.41-4.36-1.19l-.31-.19-3.24.85.87-3.16-.21-.33c-.85-1.36-1.3-2.94-1.3-4.57 0-4.73 3.85-8.58 8.58-8.58 4.73 0 8.58 3.85 8.58 8.58 0 4.73-3.85 8.58-8.58 8.58zm4.72-6.43c-.26-.13-1.53-.76-1.77-.84-.23-.09-.4-.13-.57.13-.17.26-.66.84-.81 1.01-.15.17-.3.19-.56.06-.26-.13-1.11-.41-2.11-1.3-1.02-.91-1.71-2.03-1.91-2.37-.2-.34-.02-.53.11-.66.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.5-.4-.43-.57-.44-.15-.01-.32-.01-.49-.01-.17 0-.45.06-.68.32-.23.26-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.53-.62 1.75-1.2.22-.57.22-1.07.15-1.2-.07-.12-.26-.19-.52-.32z"/>
                </svg>
                <a
                  href="https://wa.me/916309835752"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200"
                >
                  +91 63098 35752
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a
                  href="mailto:mmvalidairyfarm@gmail.com"
                  className="hover:text-white transition-colors duration-200 break-all"
                >
                  mmvalidairyfarm@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/X8PvVu5ZBitaye1P9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200 leading-relaxed"
                >
                  MMVALI Dairy Farm,<br />
                  Bhanakacherla, Bhanumukkala,<br />
                  Andhra Pradesh 518422
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-6">
            <h4 className="font-display text-sm font-semibold text-white tracking-wider uppercase">Newsletter</h4>
            <p className="text-sm leading-relaxed">
              Subscribe to get special discounts, recipe ideas, and farm updates.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-800 placeholder:text-slate-600 text-white rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/50 text-sm h-11"
              />
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0" disabled={loading}>
                <Send className="w-4 h-4 text-white" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom copyright area */}
        <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} MMVALI Dairy Farm. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2 text-xs">
            <Link to="/terms" className="hover:text-white transition-colors duration-200">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link to="/refund" className="hover:text-white transition-colors duration-200">
              Refund Policy
            </Link>
            <Link to="/shipping" className="hover:text-white transition-colors duration-200">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
