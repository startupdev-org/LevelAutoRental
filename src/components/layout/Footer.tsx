import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fadeInUp, staggerContainer } from '../../utils/animations';

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();

  const footerSections = [
    {
      title: t("footer.sections.reservations.title"),
      links: [
        { name: t("footer.sections.reservations.links.start"), href: '/booking' },
        { name: t("footer.sections.reservations.links.receipt"), href: '#' },
        { name: t("footer.sections.reservations.links.howTo"), href: '/how-to-rent' },
        { name: t("footer.sections.reservations.links.faq"), href: '/help' }
      ]
    },
    {
      title: t("footer.sections.vehicles.title"),
      links: [
        { name: t("footer.sections.vehicles.links.cars"), href: '/cars' },
        { name: t("footer.sections.vehicles.links.suv"), href: '/cars' },
        { name: t("footer.sections.vehicles.links.vans"), href: '/cars' },
        { name: t("footer.sections.vehicles.links.exotic"), href: '/cars' }
      ]
    },
    {
      title: t("footer.sections.cars.title"),
      links: [
        { name: t("footer.sections.cars.links.audi"), href: '/cars' },
        { name: t("footer.sections.cars.links.bmw"), href: '/cars' },
        { name: t("footer.sections.cars.links.porsche"), href: '/cars' },
        { name: t("footer.sections.cars.links.all"), href: '/cars' }
      ]
    },
    {
      title: t("footer.sections.company.title"),
      links: [
        { name: t("footer.sections.company.links.about"), href: '/about' },
        { name: t("footer.sections.company.links.team"), href: '#' },
        { name: t("footer.sections.company.links.rental-conditions"), href: '/terms' },
        { name: t("footer.sections.company.links.affiliate"), href: '#' }
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' }
  ];

  const contactInfo = [
    { icon: Phone, text: '+373 22 123 456', href: 'tel:+37322123456' },
    { icon: Mail, text: 'info@levelautorental.com', href: 'mailto:info@levelautorental.com' },
    { icon: MapPin, text: 'Chisinau, Moldova', href: '#' }
  ];

  return (
    <footer className="relative bg-gray-900">
      {/* Clean Background Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Main Content */}
        <motion.div
          key={i18n.language}
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-16"
        >
          {/* Company Info */}
          <motion.div
            variants={fadeInUp}
            className="lg:col-span-1 space-y-6"
          >
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/LevelAutoRental/logo.png"
                alt="LevelAutoRental"
                className="h-16 w-auto brightness-0 invert"
              />
            </div>

            {/* Description */}
            <p className="text-gray-300 leading-relaxed text-base max-w-md">
              {t("footer.description")}
            </p>

            {/* Contact Info */}
            <div className="space-y-4">
              {contactInfo.map((contact, index) => (
                <motion.a
                  key={index}
                  href={contact.href}
                  variants={fadeInUp}
                  className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-300 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-theme-500 group-hover:shadow-lg transition-all duration-300">
                    <contact.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {footerSections.map((section) => (
                <motion.div
                  key={section.title}
                  variants={fadeInUp}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-semibold tracking-wider text-theme-500 uppercase">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          to={link.href}
                          className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium group flex items-center"
                        >
                          <span>{link.name}</span>
                          <ArrowRight className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="border-t border-gray-700 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              <p>{t("footer.bottom.copyright")}</p>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm font-medium mr-2">{t("footer.social.follow-us")}:</span>
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-white hover:bg-theme-500 hover:shadow-lg transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};