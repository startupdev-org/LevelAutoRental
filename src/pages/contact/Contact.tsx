import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
import { useTranslation } from "react-i18next";
import { Phone, Mail, MapPin, Send, Clock } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { GrInstagram } from "react-icons/gr";
import { BiSolidPhoneCall } from "react-icons/bi";

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const contactInfo = [
    { icon: Phone, text: '+373 62 000 112', href: 'tel:+37362000112', label: 'Phone' },
    { icon: Mail, text: 'info@levelautorental.com', href: 'mailto:info@levelautorental.com', label: 'Email' },
    { icon: MapPin, text: 'Chisinau, Moldova', href: '#', label: 'Location' }
  ];

  const socialLinks: Array<{ icon: React.FC<any>, href: string, label: string }> = [
    { icon: TikTokIcon as React.FC<any>, href: 'https://www.tiktok.com/@level.auto.rental.md', label: t('footer.social.tiktok') },
    { icon: FaFacebookF as React.FC<any>, href: 'https://www.facebook.com/levelautorental', label: t('footer.social.facebook') },
    { icon: GrInstagram as React.FC<any>, href: 'https://www.instagram.com/level_auto_rental', label: t('footer.social.instagram') }
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
    <div className="min-h-screen">
        {/* Hero Section */}
        <section
          className="relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat pt-36 font-sans text-white"
          style={{
            backgroundImage: isDesktop ? 'url(/LevelAutoRental/lvl_bg.png)' : 'url(/LevelAutoRental/backgrounds/bg10-mobile.jpeg)',
            backgroundPosition: isDesktop ? 'center -400px' : 'center center',
            backgroundSize: isDesktop ? '115%' : 'cover'
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 w-full h-40 
              bg-[linear-gradient(to_top,rgba(15,15,15,1),rgba(15,15,15,0))] 
              z-10 pointer-events-none">
          </div>

          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible relative z-10">
            <div className="flex items-center justify-center h-full pt-16">
              {/* Centered Text Content */}
              <div className="text-center space-y-10 max-w-4xl">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <p className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                      {t('pages.contact.hero.label')}
                    </p>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                      {t('pages.contact.hero.title')}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Content Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Contact Information */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="space-y-8"
              >
                <motion.div variants={fadeInUp}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('pages.contact.contact-info')}
                  </h3>
                  <p className="text-gray-600 mb-8">
                    {t('pages.contact.contact-description')}
                  </p>
                </motion.div>

                {/* Contact Cards */}
                <div className="space-y-4">
                  {contactInfo.map((contact, index) => (
                    <motion.a
                      key={index}
                      href={contact.href}
                      variants={fadeInUp}
                      className="flex items-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <contact.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{contact.text}</p>
                        <p className="text-sm text-gray-500">{contact.label}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {/* Social Media */}
                <motion.div variants={fadeInUp} className="pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('footer.social.follow-us')}
                  </h4>
                  <div className="flex space-x-3">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-xl bg-white shadow-sm hover:shadow-lg flex items-center justify-center text-gray-600 hover:text-red-600 transition-all duration-300 hover:scale-110 border border-gray-100"
                        aria-label={social.label}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <social.icon className={social.icon === FaFacebookF ? "w-5 h-5" : "w-6 h-6"} />
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8"
              >
                <motion.div variants={fadeInUp}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('pages.contact.send-message')}
                  </h3>
                  <p className="text-gray-600 mb-8">
                    {t('pages.contact.form-description')}
                  </p>
                </motion.div>

                <motion.form
                  onSubmit={handleSubmit}
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div variants={fadeInUp}>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-3 block">
                          {t('pages.contact.form.first-name')} *
                        </span>
                        <input
                          type="text"
                          placeholder={t('pages.contact.form.first-name')}
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          required
                          className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 hover:border-gray-300"
                        />
                      </label>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-3 block">
                          {t('pages.contact.form.last-name')} *
                        </span>
                        <input
                          type="text"
                          placeholder={t('pages.contact.form.last-name')}
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          required
                          className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 hover:border-gray-300"
                        />
                      </label>
                    </motion.div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div variants={fadeInUp}>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-3 block">
                          {t('pages.contact.form.email')} *
                        </span>
                        <input
                          type="email"
                          placeholder={t('pages.contact.form.email-example')}
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                          className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 hover:border-gray-300"
                        />
                      </label>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700 mb-3 block">
                          {t('pages.contact.form.phone-number')}
                        </span>
                        <input
                          type="tel"
                          placeholder="+373 (555) 000-000"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 hover:border-gray-300"
                        />
                      </label>
                    </motion.div>
                  </div>

                  <motion.div variants={fadeInUp}>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 mb-3 block">
                        {t('pages.contact.form.message')} *
                      </span>
                      <textarea
                        rows={3}
                        placeholder={t('pages.contact.form.message-cta')}
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 resize-none hover:border-gray-300"
                        required
                      />
                    </label>
                  </motion.div>

                  <motion.button
                    type="submit"
                    variants={fadeInUp}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send className="w-5 h-5" />
                    {t('pages.contact.form.start')}
                  </motion.button>
                </motion.form>
              </motion.div>
            </div>
          </div>
        </section>
    </div>
  );
};