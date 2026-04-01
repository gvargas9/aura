"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Twitter, Facebook } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/aura", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/aura", label: "Twitter" },
  { icon: Facebook, href: "https://facebook.com/aura", label: "Facebook" },
];

export function Footer() {
  const { t } = useLocale();

  const footerLinks = {
    company: [
      { label: t("footer.aboutUs"), href: "/about" },
      { label: t("nav.howItWorks"), href: "/how-it-works" },
      { label: t("footer.ourStory"), href: "/story" },
      { label: t("footer.careers"), href: "/careers" },
    ],
    products: [
      { label: t("footer.buildYourBox"), href: "/build-box" },
      { label: t("footer.allProducts"), href: "/products" },
      { label: t("footer.subscriptions"), href: "/subscriptions" },
      { label: t("footer.giftCards"), href: "/gift-cards" },
    ],
    business: [
      { label: t("footer.forDealers"), href: "/b2b" },
      { label: t("footer.wholesale"), href: "/wholesale" },
      { label: t("footer.aviationMarine"), href: "/b2b/luxury" },
      { label: t("footer.partnerWithUs"), href: "/partner" },
    ],
    support: [
      { label: t("footer.helpCenter"), href: "/help" },
      { label: t("footer.contact"), href: "/contact" },
      { label: t("footer.shippingInfo"), href: "/shipping" },
      { label: t("footer.returns"), href: "/returns" },
    ],
  };

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
              {t("footer.brandDescription")}
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
            <h4 className="font-semibold mb-4">{t("footer.company")}</h4>
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
            <h4 className="font-semibold mb-4">{t("footer.products")}</h4>
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
            <h4 className="font-semibold mb-4">{t("footer.business")}</h4>
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
            <h4 className="font-semibold mb-4">{t("footer.support")}</h4>
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
            &copy; {new Date().getFullYear()} Aura. {t("footer.rights")}
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="bg-aura-dark/50 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center space-x-6 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-400">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-gray-400">
              {t("footer.terms")}
            </Link>
            <Link href="/cookies" className="hover:text-gray-400">
              {t("footer.cookiePolicy")}
            </Link>
            <Link href="/accessibility" className="hover:text-gray-400">
              {t("footer.accessibility")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
