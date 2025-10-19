import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DevOnlyComponent } from "../../utils/devAccess";
import { useTranslation } from "react-i18next";

export const Contact: React.FC = () => {

  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    discoveryChannels: [
      { id: 1, label: "Instagram", checked: false },
      { id: 2, label: "Website", checked: false },
      { id: 3, label: "TikTok", checked: false },
      { id: 4, label: "Facebook", checked: false },
      { id: 5, label: "Friend", checked: false },
      { id: 6, label: "Other", checked: false },
    ],
  });


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (
    field: keyof typeof formData.discoveryChannels,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      discoveryChannels: { ...prev.discoveryChannels, [field]: checked },
    }));
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
            <Button className="w-full">
              <a href="/">Go Back Home</a>
            </Button>
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
          className="relative h-64 sm:h-[50vh] lg:h-auto"
        >
          <img
            src="/LevelAutoRental/lvl_bg.png"
            alt="Contact visual"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10 lg:bg-transparent" />
        </motion.div>

        {/* Right side - Form */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="flex items-center justify-center px-6 sm:px-8 lg:px-16 py-12 lg:py-20"
        >
          <div className="w-full max-w-lg">
            {/* Heading */}
            <motion.div variants={fadeInUp} className="mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                {t("contact.hero")}
              </h2>
              <p className="text-gray-600 text-base">
                {t("contact.smallLabel")}{" "}
                <a
                  href="mailto:hi@levelautorental.com"
                  className="text-theme-600 underline"
                >
                  hi@levelautorental.com
                </a>
              </p>
            </motion.div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={`${t("contact.form.first-name")} *`}
                  placeholder={t("contact.form.first-name")}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
                <Input
                  label={`${t("contact.form.last-name")} *`}
                  placeholder={t("contact.form.last-name")}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label={`${t("contact.form.email")} *`}
                  type="email"
                  placeholder={t("contact.form.email-example")}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
                <Input
                  label={`${t("contact.form.phone-number")} `}
                  type="tel"
                  placeholder="+373 (555) 000-000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {`${t("contact.form.message")} *`}
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  rows={5}
                  id="message"
                  placeholder={t("contact.form.message-cta")}
                  value={formData.message}
                  onChange={(e) =>
                    handleInputChange("message", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-theme-500 transition"
                  required
                />
              </div>

              {/* Where you heard about us */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">{t("contact.form.question")} ?</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {formData.discoveryChannels.map((opt, index) => (
                    <label
                      key={opt.id}
                      className="inline-flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-theme-600 focus:ring-theme-500"
                        checked={opt.checked}
                        onChange={(e) => {
                          const updated = [...formData.discoveryChannels];
                          updated[index].checked = e.target.checked;
                          setFormData({ ...formData, discoveryChannels: updated });
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>


              <Button
                type="submit"
                size="lg"
                className="w-full bg-theme-600 hover:bg-theme-700 text-white"
              >
                {t("contact.form.start")}
              </Button>
            </motion.form>
          </div>
        </motion.div>
      </section>
    </DevOnlyComponent>
  );
};
