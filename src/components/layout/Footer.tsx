import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const footerSections = [
    {
      title: 'Reservations',
      links: [
        { name: 'Start a reservation', href: '/booking' },
        { name: 'Get a receipt', href: '#' },
        { name: 'How to book', href: '#' },
        { name: 'Help & FAQs', href: '#' }
      ]
    },
    {
      title: 'Vehicles',
      links: [
        { name: 'Cars', href: '/cars' },
        { name: 'SUVs', href: '/cars' },
        { name: 'Minivans & Vans', href: '/cars' },
        { name: 'Exotic Cars', href: '/cars' }
      ]
    },
    {
      title: 'Cars',
      links: [
        { name: 'Audi', href: '/cars' },
        { name: 'BMW', href: '/cars' },
        { name: 'Porsche', href: '/cars' },
        { name: 'All cars', href: '/cars' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About us', href: '/about' },
        { name: 'Career', href: '#' },
        { name: 'Meet our people', href: '#' },
        { name: 'Affiliate Programs', href: '#' }
      ]
    }
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' }
  ];

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section - Four Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            LevelAutoRental
          </div>

          {/* Copyright */}
          <p className="text-white text-sm">
            © 2023 LevelAutoRental. All Rights Reserved
          </p>

          {/* Social Media Icons */}
          <div className="flex space-x-4 mt-4 md:mt-0">
            {socialLinks.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
};