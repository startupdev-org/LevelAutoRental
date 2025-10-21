import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
import { DevOnlyComponent } from "../../utils/devAccess";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, Instagram } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export const Contact: React.FC = () => {

  const { t } = useTranslation();

  // Contact information from footer
  const contactInfo = [
    { icon: Phone, text: '+373 62 000 112', href: 'tel:+37362000112' },
    { icon: Mail, text: 'info@levelautorental.com', href: 'mailto:info@levelautorental.com' },
    { icon: MapPin, text: 'Chisinau, Moldova', href: '#' }
  ];

  // Social media links from footer
  const socialLinks: Array<{ icon: React.FC<any>, href: string, label: string }> = [
    { icon: TikTokIcon as React.FC<any>, href: 'https://www.tiktok.com/@levelautorental', label: t('footer.social.tiktok') },
    { icon: FaFacebookF as React.FC<any>, href: 'https://www.facebook.com/levelautorental', label: t('footer.social.facebook') },
    { icon: Instagram as React.FC<any>, href: 'https://www.instagram.com/level_auto_rental', label: t('footer.social.instagram') }
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <DevOnlyComponent
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">🚧</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Under Development
            </h2>
            <p className="text-gray-600 mb-8">
              This page is currently under development and available only to
              developers.
            </p>
            <button className="w-full py-2.5 bg-theme-600 hover:bg-theme-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md">
              <a href="/">Go Back Home</a>
            </button>
          </div>
        </div>
      }
    >
      <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
        {/* Left side - Image */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="relative h-80 sm:h-[60vh] lg:h-auto"
        >
          <img
            src="/LevelAutoRental/lvl_bg.png"
            alt="Contact visual"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>

        {/* Right side - Form and Info */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="flex items-center justify-center px-6 sm:px-8 lg:px-16 py-4 lg:py-6"
        >
          <div className="w-full max-w-2xl">
            {/* Contact Information */}
            <motion.div variants={fadeInUp} className="mb-6 pt-2 lg:pt-4">
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3 mb-4">
                  {contactInfo.map((contact, index) => (
                    <motion.a
                      key={index}
                      href={contact.href}
                      variants={fadeInUp}
                      className="flex items-center space-x-4 text-gray-700 hover:text-theme-600 transition-colors duration-300 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-theme-50 transition-colors duration-300">
                        <contact.icon className="w-5 h-5 text-gray-600 group-hover:text-theme-600 transition-colors duration-300" />
                      </div>
                      <span className="text-sm font-medium">{contact.text}</span>
                    </motion.a>
                  ))}
                </div>
                
                {/* Social Media */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">{t("footer.social.follow-us")}</h4>
                  <div className="flex space-x-3">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        className="w-10 h-10 rounded-xl bg-white shadow-sm hover:bg-theme-50 flex items-center justify-center text-gray-600 hover:text-theme-600 transition-all duration-300 hover:scale-105"
                        aria-label={social.label}
                      >
                        <social.icon className={social.icon === FaFacebookF ? "w-4 h-4" : "w-5 h-5"} />
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div variants={fadeInUp} className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Send us a message</h3>
              <motion.form
                onSubmit={handleSubmit}
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("pages.contact.form.first-name")} *</span>
                    <input
                      type="text"
                      placeholder={t("pages.contact.form.first-name")}
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                      className="mt-2 px-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-theme-200 focus:border-theme-400 transition"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("pages.contact.form.last-name")} *</span>
                    <input
                      type="text"
                      placeholder={t("pages.contact.form.last-name")}
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                      className="mt-2 px-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-theme-200 focus:border-theme-400 transition"
                    />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("pages.contact.form.email")} *</span>
                    <input
                      type="email"
                      placeholder={t("pages.contact.form.email-example")}
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="mt-2 px-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-theme-200 focus:border-theme-400 transition"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("pages.contact.form.phone-number")}</span>
                    <input
                      type="tel"
                      placeholder="+373 (555) 000-000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="mt-2 px-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-theme-200 focus:border-theme-400 transition"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">{t("pages.contact.form.message")} *</span>
                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                    rows={3}
                    placeholder={t("pages.contact.form.message-cta")}
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className="mt-2 px-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-theme-200 focus:border-theme-400 transition resize-none"
                    required
                  />
                </label>


                <button
                  type="submit"
                  className="w-full py-2 bg-theme-600 hover:bg-theme-700 text-white rounded-lg font-semibold transition-shadow shadow-sm hover:shadow-md"
                >
                  {t("pages.contact.form.start")}
                </button>
              </motion.form>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </DevOnlyComponent>
  );
};
