import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Youtube, Facebook, Send, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
        description: "Thank you for subscribing to MMVALI Dairy Farm updates!",
      });
      setEmail("");
      setLoading(false);
    }, 600);
  };

  return (
    <footer className="bg-[#061A13] text-[#AAB8B0] border-t border-white/10 font-sans relative overflow-hidden">
      {/* Subtle organic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#082D20]/20 to-black/50 pointer-events-none" />
      
      <div className="container-main px-6 py-16 md:px-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          
          {/* Brand & Trust Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="MM Dairy Farm"
                className="w-11 h-11 rounded-2xl object-cover border border-white/10 shadow-soft"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#F5F3EC] tracking-tight leading-none">
                  MM Dairy Farm
                </span>
                <span className="text-[11px] font-semibold text-[#C98A24] tracking-wider uppercase mt-1">
                  100% Pure & Fresh
                </span>
              </div>
            </div>
            <p className="text-[#AAB8B0] text-sm leading-relaxed max-w-sm">
              Delivering unadulterated, nutrient-rich fresh farm milk and organic dairy products directly from our farm to your home every morning.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-3 pt-2">
              <a
                href="https://instagram.com/mmvalidairyfarm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 bg-[#0B2118] border border-white/10 rounded-xl flex items-center justify-center text-[#AAB8B0] hover:bg-[#10291F] hover:text-[#C98A24] hover:border-[#C98A24]/40 transition-all duration-200 shadow-sm"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@mmvalidairyfarm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Youtube"
                className="w-10 h-10 bg-[#0B2118] border border-white/10 rounded-xl flex items-center justify-center text-[#AAB8B0] hover:bg-[#10291F] hover:text-[#C98A24] hover:border-[#C98A24]/40 transition-all duration-200 shadow-sm"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/916309835752"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 bg-[#0B2118] border border-white/10 rounded-xl flex items-center justify-center text-[#AAB8B0] hover:bg-[#10291F] hover:text-[#C98A24] hover:border-[#C98A24]/40 transition-all duration-200 shadow-sm"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Navigation Column */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-[#C98A24] tracking-widest uppercase">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8A5F]" /> Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8A5F]" /> Dairy Store
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C98A24]" /> Subscription Plans
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8A5F]" /> Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8A5F]" /> Customer Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-[#C98A24] tracking-widest uppercase">Get In Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#C98A24] shrink-0 mt-0.5" />
                <a
                  href="https://wa.me/916309835752"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 font-medium"
                >
                  +91 63098 35752
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#C98A24] shrink-0 mt-0.5" />
                <a
                  href="mailto:mmvalidairyfarm@gmail.com"
                  className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 break-all"
                >
                  mmvalidairyfarm@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C98A24] shrink-0 mt-1" />
                <a
                  href="https://maps.app.goo.gl/X8PvVu5ZBitaye1P9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#AAB8B0] hover:text-[#F5F3EC] transition-colors duration-200 leading-relaxed text-xs"
                >
                  MM Dairy Farm, Bhanakacherla, Bhanumukkala, Andhra Pradesh 518422
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-[#C98A24] tracking-widest uppercase">Fresh Updates</h4>
            <p className="text-xs text-[#AAB8B0] leading-relaxed">
              Subscribe for exclusive morning delivery slots, seasonal farm news, and special subscriber discounts.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0B2118] border-white/10 placeholder:text-[#718078] text-[#F5F3EC] rounded-xl text-xs h-10 focus-visible:ring-[#C98A24]"
              />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-xl bg-[#C98A24] hover:bg-[#D9A441] text-[#061A13] shrink-0" disabled={loading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#AAB8B0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F8A5F]" /> Safe & Spam-Free Guarantee
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#718078]">
          <p>© {new Date().getFullYear()} MM Dairy Farm. Pure Dairy Goodness, Straight From Our Farm.</p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2">
            <Link to="/terms" className="hover:text-[#F5F3EC] transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="hover:text-[#F5F3EC] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/refund" className="hover:text-[#F5F3EC] transition-colors">
              Refund Policy
            </Link>
            <Link to="/shipping" className="hover:text-[#F5F3EC] transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

