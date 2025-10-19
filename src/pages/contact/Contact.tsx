import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DevOnlyComponent } from "../../utils/devAccess";

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    services: {
      websiteDesign: false,
      uxDesign: false,
      userResearch: false,
      contentCreation: false,
      strategyConsulting: false,
      other: false,
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (
    field: keyof typeof formData.services,
    checked: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      services: { ...prev.services, [field]: checked },
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
                Let’s level up your brand, together
              </h2>
              <p className="text-gray-600 text-base">
                You can reach us anytime via{" "}
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
                  label="First name *"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
                <Input
                  label="Last name *"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Email *"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Message *
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                  rows={5}
                  id="message"
                  placeholder="Leave us a message..."
                  value={formData.message}
                  onChange={(e) =>
                    handleInputChange("message", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-theme-500 focus:border-theme-500 transition"
                  required
                />
              </div>

              {/* Services */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Services</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { key: "websiteDesign", label: "Website design" },
                    { key: "uxDesign", label: "UX design" },
                    { key: "userResearch", label: "User research" },
                    { key: "contentCreation", label: "Content creation" },
                    { key: "strategyConsulting", label: "Strategy & consulting" },
                    { key: "other", label: "Other" },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className="inline-flex items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-theme-600 focus:ring-theme-500"
                        checked={(formData.services as any)[opt.key]}
                        onChange={(e) =>
                          handleCheckboxChange(opt.key as any, e.target.checked)
                        }
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
                Get started
              </Button>
            </motion.form>
          </div>
        </motion.div>
      </section>
    </DevOnlyComponent>
  );
};
