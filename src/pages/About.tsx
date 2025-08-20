import { motion } from 'framer-motion';
import { Award, Car, Clock, Shield, Users } from 'lucide-react';
import React from 'react';
import { useInView } from '../hooks/useInView';
import { fadeInUp, staggerContainer } from '../utils/animations';
import { Card } from '../components/ui/Card';

export const About: React.FC = () => {
  const { ref, isInView } = useInView();

  const stats = [
    { icon: Car, label: 'Vehicles', value: '500+' },
    { icon: Users, label: 'Happy Customers', value: '10,000+' },
    { icon: Clock, label: 'Years Experience', value: '15+' },
    { icon: Award, label: 'Awards Won', value: '25+' }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Safety First',
      description: 'All our vehicles undergo rigorous safety inspections and maintenance to ensure your peace of mind on the road.'
    },
    {
      icon: Users,
      title: 'Customer Focus',
      description: 'We prioritize customer satisfaction with 24/7 support and personalized service tailored to your needs.'
    },
    {
      icon: Award,
      title: 'Quality Service',
      description: 'Our commitment to excellence has earned us industry recognition and the trust of thousands of customers.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              About CarRental
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl max-w-3xl mx-auto"
            >
              Your trusted partner for reliable, affordable, and premium car rental services since 2009
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={ref}
            variants={staggerContainer}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </motion.div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Our Story
              </h2>
              <p className="text-lg text-gray-600">
                Founded in 2009, CarRental began as a small family business with a simple mission: 
                to provide reliable, affordable transportation solutions for everyone. What started 
                with just five vehicles has grown into one of the region's most trusted car rental services.
              </p>
              <p className="text-lg text-gray-600">
                Over the years, we've expanded our fleet to include over 500 vehicles ranging from 
                economy cars to luxury sedans and SUVs. Our commitment to customer satisfaction and 
                quality service has remained unchanged, earning us the loyalty of thousands of customers 
                and numerous industry awards.
              </p>
              <p className="text-lg text-gray-600">
                Today, we continue to innovate and improve our services, embracing new technologies 
                and sustainable practices to better serve our customers and protect the environment 
                for future generations.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Our story"
                className="rounded-lg shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Our Values
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              The principles that guide everything we do
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {values.map((value, index) => (
              <motion.div key={value.title} variants={fadeInUp}>
                <Card className="p-8 text-center h-full">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                    className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <value.icon className="w-8 h-8 text-blue-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Meet Our Team
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              The dedicated professionals behind our success
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                name: 'Sarah Johnson',
                role: 'CEO & Founder',
                image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Michael Chen',
                role: 'Operations Manager',
                image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
              },
              {
                name: 'Emily Rodriguez',
                role: 'Customer Service Director',
                image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
              }
            ].map((member, index) => (
              <motion.div key={member.name} variants={fadeInUp}>
                <Card className="p-6 text-center">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-gray-600">{member.role}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};