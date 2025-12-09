import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Our Story", href: "/story" },
    { label: "Careers", href: "/careers" },
  ],
  products: [
    { label: "Build Your Box", href: "/build-box" },
    { label: "All Products", href: "/products" },
    { label: "Subscriptions", href: "/subscriptions" },
    { label: "Gift Cards", href: "/gift-cards" },
  ],
  business: [
    { label: "For Dealers", href: "/b2b" },
    { label: "Wholesale", href: "/wholesale" },
    { label: "Aviation & Marine", href: "/b2b/luxury" },
    { label: "Partner With Us", href: "/partner" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping Info", href: "/shipping" },
    { label: "Returns", href: "/returns" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/aura", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/aura", label: "Twitter" },
  { icon: Facebook, href: "https://facebook.com/aura", label: "Facebook" },
];

export function Footer() {
  return (
    <footer className="bg-aura-dark text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="text-3xl font-bold text-aura-primary">
              Aura
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              Premium shelf-stable food that tastes like it was cooked today.
              Build your perfect box and enjoy gourmet meals anywhere.
            </p>
            {/* Contact Info */}
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>hello@aura.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>1-800-AURA-NOW</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Austin, Texas</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-aura-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-aura-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Business</h4>
            <ul className="space-y-2">
              {footerLinks.business.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-aura-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-aura-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-6 mb-4 md:mb-0">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-aura-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>

          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Aura. All rights reserved.
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="bg-aura-dark/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center space-x-6 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-400">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-400">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-gray-400">
              Cookie Policy
            </Link>
            <Link href="/accessibility" className="hover:text-gray-400">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
