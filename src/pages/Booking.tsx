import { motion } from 'framer-motion';
import { Calendar, Car, CreditCard, MapPin, User } from 'lucide-react';
import React, { useState } from 'react';
import { useInView } from '../hooks/useInView';
import { fadeInUp, staggerContainer } from '../utils/animations';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export const Booking: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    // Step 1: Rental Details
    pickupLocation: '',
    returnLocation: '',
    pickupDate: '',
    returnDate: '',
    pickupTime: '',
    returnTime: '',
    
    // Step 2: Car Selection
    selectedCar: '',
    
    // Step 3: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    
    // Step 4: Payment
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const { ref, isInView } = useInView();

  const steps = [
    { number: 1, title: 'Rental Details', icon: Calendar },
    { number: 2, title: 'Select Car', icon: Car },
    { number: 3, title: 'Personal Info', icon: User },
    { number: 4, title: 'Payment', icon: CreditCard }
  ];

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Booking submitted:', bookingData);
    // Handle booking submission
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Book Your Car
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600"
            >
              Complete your reservation in just a few simple steps
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                className="flex items-center"
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step {step.number}
                  </p>
                  <p className={`text-sm ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8">
            {/* Step 1: Rental Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Rental Details
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-9 text-gray-400 w-5 h-5" />
                    <Input
                      label="Pickup Location"
                      placeholder="Enter pickup location"
                      value={bookingData.pickupLocation}
                      onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <MapPin className="absolute left-3 top-9 text-gray-400 w-5 h-5" />
                    <Input
                      label="Return Location"
                      placeholder="Enter return location"
                      value={bookingData.returnLocation}
                      onChange={(e) => handleInputChange('returnLocation', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Pickup Date"
                    type="date"
                    value={bookingData.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                  />
                  
                  <Input
                    label="Pickup Time"
                    type="time"
                    value={bookingData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Return Date"
                    type="date"
                    value={bookingData.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  />
                  
                  <Input
                    label="Return Time"
                    type="time"
                    value={bookingData.returnTime}
                    onChange={(e) => handleInputChange('returnTime', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Car Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Select Your Car
                </h2>
                <p className="text-gray-600 mb-6">
                  Choose from our available vehicles for your selected dates.
                </p>
                
                {/* Car selection would go here */}
                <div className="grid md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((car) => (
                    <motion.div
                      key={car}
                      whileHover={{ scale: 1.02 }}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        bookingData.selectedCar === `car-${car}`
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('selectedCar', `car-${car}`)}
                    >
                      <img
                        src={`https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400`}
                        alt="Car"
                        className="w-full h-32 object-cover rounded mb-4"
                      />
                      <h3 className="font-semibold text-gray-900">Toyota Corolla</h3>
                      <p className="text-gray-600 text-sm">Economy • 5 seats • Automatic</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">$35/day</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Personal Info */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Personal Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    placeholder="Enter your first name"
                    value={bookingData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                  
                  <Input
                    label="Last Name"
                    placeholder="Enter your last name"
                    value={bookingData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    value={bookingData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={bookingData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <Input
                  label="Driver's License Number"
                  placeholder="Enter your license number"
                  value={bookingData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                />
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Payment Information
                </h2>
                
                <Input
                  label="Cardholder Name"
                  placeholder="Name on card"
                  value={bookingData.cardName}
                  onChange={(e) => handleInputChange('cardName', e.target.value)}
                />

                <Input
                  label="Card Number"
                  placeholder="1234 5678 9012 3456"
                  value={bookingData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={bookingData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  />
                  
                  <Input
                    label="CVV"
                    placeholder="123"
                    value={bookingData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                  />
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Car Rental (3 days)</span>
                      <span>$105.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance</span>
                      <span>$15.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes & Fees</span>
                      <span>$12.00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>$132.00</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} variant="secondary">
                  Complete Booking
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};