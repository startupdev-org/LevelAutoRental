import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { FaFacebookF } from 'react-icons/fa';
import { GrInstagram } from 'react-icons/gr';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fadeInUp, staggerContainer } from '../../utils/animations';

import { hiddenPaths } from '../../data';

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const shouldReturnFooter = !hiddenPaths.some(path => location.pathname.startsWith(path));

  if (!shouldReturnFooter) return null;


  const footerSections = [
    {
      title: t("footer.sections.vehicles.title"),
      links: [
        { name: t("footer.sections.vehicles.links.suv"), href: '/cars' },
        { name: t("footer.sections.vehicles.links.sports"), href: '/cars' },
        { name: t("footer.sections.vehicles.links.luxury"), href: '/cars' },
        { name: t("footer.sections.vehicles.links.all"), href: '/cars' }
      ]
    },
    {
      title: t("footer.sections.reservations.title"),
      links: [
        { name: t("footer.sections.reservations.links.start"), href: '/' },
        { name: t("footer.sections.reservations.links.howTo"), href: '/how-to-rent' },
        { name: t("footer.sections.reservations.links.faq"), href: '/help' }
      ]
    },
    {
      title: t("footer.sections.company.title"),
      links: [
        { name: t("footer.sections.company.links.about"), href: '/about' },
        { name: t("footer.sections.company.links.reviews"), href: '/reviews' },
        { name: t("footer.sections.company.links.rental-conditions"), href: '/terms' }
      ]
    }
  ];

  const socialLinks: Array<{ icon: React.FC<any>, href: string, label: string }> = [
    { icon: TikTokIcon as React.FC<any>, href: 'https://www.tiktok.com/@level.auto.rental.md', label: t('footer.social.tiktok') },
    { icon: FaFacebookF as React.FC<any>, href: 'https://www.facebook.com/levelautorental', label: t('footer.social.facebook') },
    { icon: GrInstagram as React.FC<any>, href: 'https://www.instagram.com/level_auto_rental', label: t('footer.social.instagram') }
  ];

  const contactInfo = [
    { icon: Phone, text: '+373 62 000 112', href: 'tel:+37362000112' },
    { icon: Mail, text: 'info@levelautorental.com', href: 'mailto:info@levelautorental.com' },
    { icon: MapPin, text: 'Chisinau, Moldova', href: '#' }
  ];

  return (
    <footer className="border-t border-[#0f0f0f]" style={{ background: 'linear-gradient(to bottom, #0f0f0f, #1a0f0f)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <motion.div
          key={i18n.language}
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <motion.div
              variants={fadeInUp}
              className="lg:col-span-2 space-y-6"
            >
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <img
                  src="/LevelAutoRental/logo-footer.png"
                  alt="LevelAutoRental"
                  className="h-12 w-auto brightness-0 invert"
                />
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed max-w-md">
                {t("footer.description")}
              </p>

              {/* Contact Info */}
              <div className="space-y-4">
                {contactInfo.map((contact, index) => (
                  <motion.a
                    key={index}
                    href={contact.href}
                    variants={fadeInUp}
                    className="flex items-center space-x-4 text-gray-300 hover:text-white transition-colors duration-500 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700/20 to-gray-600/20 flex items-center justify-center group-hover:from-gray-600 group-hover:to-gray-500 transition-all duration-500">
                      <contact.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-500" />
                    </div>
                    <span className="text-sm font-medium">{contact.text}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Navigation Links */}
            <motion.div
              variants={fadeInUp}
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
                {footerSections.map((section) => (
                  <motion.div
                    key={section.title}
                    variants={fadeInUp}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <ul className="space-y-3">
                      {section.links.map((link) => (
                        <li key={link.name}>
                          <Link
                            to={link.href}
                            className="text-sm text-gray-300 hover:text-white transition-colors duration-500 group flex items-center"
                          >
                            <span>{link.name}</span>
                            <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="border-t border-gray-800 py-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              <p>{t("footer.bottom.copyright")}</p>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm font-medium">{t("footer.social.follow-us")}:</span>
              <div className="flex space-x-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700/20 to-gray-600/20 hover:from-gray-600 hover:to-gray-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-500"
                    aria-label={social.label}
                  >
                    <social.icon className={social.icon === FaFacebookF ? "w-4 h-4" : "w-5 h-5"} />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};