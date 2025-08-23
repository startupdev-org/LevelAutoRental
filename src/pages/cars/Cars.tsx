import { motion } from 'framer-motion';
import { Filter, Fuel, Search, Star, Users } from 'lucide-react';
import React, { useState } from 'react';
import { cars } from '../../data/cars';
import { useCounter } from '../../hooks/useCounter';
import { useInView } from '../../hooks/useInView';
import { Car } from '../../types';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { CarCard } from './CarCard';
import RangeSlider from './RangeSlider';



export const Cars: React.FC = () => {

  const CURRENT_YEAR = new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState("");
  const [rentalType, setRentalType] = useState("any");
  const [priceRange, setPriceRange] = useState<[number, number]>([100, 6000]);
  const [seatRange, setSeatRange] = useState<[number, number]>([2, 9]);

  const [yearRange, setYearRange] = useState<[number, number]>([2010, CURRENT_YEAR]);
  const [transmission, setTransmission] = useState("any");
  const [fuelType, setFuelType] = useState("any");
  const [seats, setSeats] = useState(2);
  const [vehicleCondition, setVehicleCondition] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { ref, isInView } = useInView();

  // aplica filtre
  const filteredCars = cars.filter((car) => {
    const matchesSearch = car.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPrice =
      car.pricePerDay >= priceRange[0] && car.pricePerDay <= priceRange[1];
    const matchesYear = car.year >= yearRange[0] && car.year <= yearRange[1];
    const matchesTransmission =
      transmission === "any" ||
      car.transmission.toLowerCase() === transmission.toLowerCase();
    const matchesFuel =
      fuelType === "any" || car.fuelType.toLowerCase() === fuelType.toLowerCase();
    // const matchesSeats =
    // seats === "any" || car.seats.toString() === seats.replace(" Seater", "");
    const matchesCondition = true
    // vehicleCondition === "all" ||
    // (vehicleCondition === "brand new" ? car. === "new" : car.condition === "used");
    // rentalType poate fi ignorat momentan dacă toate sunt /day
    // return (
    //   matchesSearch &&
    //   matchesPrice &&
    //   matchesYear &&
    //   matchesTransmission &&
    //   matchesFuel &&
    //   matchesSeats &&
    //   matchesCondition
    // );
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Results header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex justify-between items-center"
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Showing Search Results ({filteredCars.length} found)
          </h2>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex gap-8">
        {/* Filters */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`lg:w-72 ${showFilters ? "block" : "hidden lg:block"}`}
        >
          <Card className="p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setRentalType("any");
                  setPriceRange([100, 60000]);
                  setYearRange([2010, CURRENT_YEAR]);
                  setTransmission("any");
                  setFuelType("any");
                  setSeatRange([2, 9]);
                }}
                className="text-theme-500 hover:text-theme-700"
              >
                Reset All
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search cars..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Rental Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rental Type
              </label>
              <div className="flex gap-2">
                {["any", "per day", "per hour"].map((type) => (
                  <Button
                    key={type}
                    variant={rentalType === type ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setRentalType(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className='p-6 max-w-xl mx-auto'>
              <RangeSlider
                min={100}
                max={60000}
                step={100}
                value={priceRange}
                onChange={setPriceRange}
                label="Price Range ($)" />

              <RangeSlider
                min={2010}
                max={CURRENT_YEAR}
                step={1}
                value={yearRange}
                onChange={setYearRange}
                label="Year"
              />

              <RangeSlider
                min={2}
                max={9}
                step={1}
                value={seatRange}
                onChange={setSeatRange}
                label="Seats"
              />

            </div>


            {/* Transmission */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transmission
              </label>
              <div className="flex gap-2 flex-wrap">
                {["any", "Manual", "Automatic"].map((t) => (
                  <Button
                    key={t}
                    variant={transmission === t ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTransmission(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fuel Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {["any", "Petrol", "Electric", "Gasoline", "Hybrid"].map((f) => (
                  <Button
                    key={f}
                    variant={fuelType === f ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setFuelType(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            {/* Seats */}
            {/* <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seats
              </label>
              <div className="flex gap-2">
                {["any", "2 Seater", "4 Seater"].map((s) => (
                  <Button
                    key={s}
                    variant={seats === s ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSeats(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div> */}

          </Card>
        </motion.div>

        {/* Cars Grid */}
        <div className="flex-1">
          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Cars Grid */}
          <motion.div
            ref={ref}
            variants={staggerContainer}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredCars.map((car, index) => (
              <CarCard key={car.id} car={car} index={index} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
