import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Milk, Instagram, Facebook, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-forest-dark text-cream py-12">
      <div className="container-main px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/favicon.png"
                alt="MMVALI Dairy Farm"
                className="w-10 h-10 rounded-full object-cover border-2 border-cream"
              />
              <span className="font-display text-xl font-bold">
                MMVALI Dairy
              </span>
            </div>
            <p className="text-cream/80 text-sm leading-relaxed">
              Fresh, pure dairy products delivered straight from our farm to your doorstep.
              Trusted by families for generations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-cream/80 hover:text-cream transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-cream/80 hover:text-cream transition-colors">
                  Our Products
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-cream/80 hover:text-cream transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-cream/80 hover:text-cream transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-cream/80">
                <Phone className="w-5 h-5 text-golden flex-shrink-0" />
                <a
                  href="tel:+916309835752"
                  className="hover:text-cream transition-colors"
                >
                  +91 63098 35752
                </a>
              </li>
              <li className="flex items-center gap-3 text-cream/80">
                <Mail className="w-5 h-5 text-golden flex-shrink-0" />
                <a
                  href="mailto:mmvalidairyfarm@gmail.com"
                  className="hover:text-cream transition-colors"
                >
                  mmvalidairyfarm@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-cream/80">
                <MapPin className="w-5 h-5 text-golden flex-shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/X8PvVu5ZBitaye1P9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cream transition-colors"
                >
                  MMVALI Dairy Farm, Bhanakacherla, Bhanumukkala, Andhra Pradesh 518422
                </a>
              </li>
            </ul>

            {/* Social Media */}
            <div className="mt-6">
              <h5 className="font-semibold mb-3">Follow Us</h5>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/mmvalidairyfarm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-golden/20 rounded-full flex items-center justify-center hover:bg-golden/30 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-golden" />
                </a>
                <a
                  href="https://youtube.com/@mmvalidairyfarm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-golden/20 rounded-full flex items-center justify-center hover:bg-golden/30 transition-colors"
                >
                  <Youtube className="w-5 h-5 text-golden" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-golden/20 rounded-full flex items-center justify-center hover:bg-golden/30 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-golden" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cream/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-center text-cream/60 text-sm">
              © {new Date().getFullYear()} MMVALI Dairy Farm. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 text-sm">
              <Link to="/terms" className="text-cream/60 hover:text-cream transition-colors">
                Terms & Conditions
              </Link>
              <Link to="/privacy" className="text-cream/60 hover:text-cream transition-colors">
                Privacy Policy
              </Link>
              <Link to="/refund" className="text-cream/60 hover:text-cream transition-colors">
                Refund Policy
              </Link>
              <Link to="/shipping" className="text-cream/60 hover:text-cream transition-colors">
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
