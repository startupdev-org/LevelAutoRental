import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { staggerContainer } from '../../utils/animations';
import { CarCard } from '../../components/car/CarCard';
import { fetchCars, CarFilters, fetchCarsMake, fetchFilteredCarsWithPhotos, fetchBookedCarIds } from '../../lib/db/cars/cars-page/cars';
import { Car as CarType } from '../../types';
import { BudgetField, DateRangeField, SearchMode, SearchModeTabs } from '../../components/search/SearchFields';
import { useExchangeRates } from '../../hooks/useExchangeRates';

import { RentalOptionsSection } from './sections/RentalOptionsSection'
import { ContractSection } from './sections/ContractSection';
import { FUEL_TYPE_MAP, FuelTypeUI } from '../../constants';

// Display Car type for CarCard component
interface DisplayCar extends CarType {
  name: string;
  image: string;
  pricePerDay: number;
  photoGallery?: string[];
  fuelType?: string;
  availability?: string;
}

interface SidebarFilters {
  transmission: 'Any' | 'Automatic' | 'Manual';
  fuelType: FuelTypeUI;
  make?: string;
  model?: string;
  priceRange: [number, number];
  yearRange: [number, number];
  seats?: number;
  status?: string;
}

type SortKey = 'price-low' | 'price-high' | 'year-new' | 'year-old';

interface SearchFilters {
  make: string;
  model: string;
  startDate: string;
  endDate: string;
  budget: string;
  currency: 'EUR';
}

function isSafeText(param: string | null): param is string {
  return !!(param !== null &&
    param.trim() !== '' &&
    param.length < 100 &&
    !param.includes('~') &&
    !param.includes('<') &&
    !param.includes('>') &&
    !param.includes('&') &&
    !param.includes('%'));
}

function isIsoDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readSearchFilters(params: URLSearchParams): SearchFilters {
  const startDate = isIsoDate(params.get('startDate')) ? params.get('startDate')! : '';
  const endDate = isIsoDate(params.get('endDate')) ? params.get('endDate')! : '';
  const budgetParam = params.get('budget');
  const budget = budgetParam && /^\d+$/.test(budgetParam) && budgetParam.length < 10 ? budgetParam : '';

  return {
    make: isSafeText(params.get('make')) ? params.get('make')! : '',
    model: isSafeText(params.get('model')) ? params.get('model')! : '',
    startDate,
    endDate: startDate && endDate && endDate >= startDate ? endDate : '',
    budget,
    currency: 'EUR',
  };
}

function hasMakeModel(filters: Pick<SearchFilters, 'make' | 'model'>) {
  return Boolean(filters.make || filters.model);
}

function hasDateRange(filters: Pick<SearchFilters, 'startDate' | 'endDate'>) {
  return Boolean(filters.startDate && filters.endDate && filters.endDate >= filters.startDate);
}

function hasBudget(filters: Pick<SearchFilters, 'budget'>) {
  const amount = Number(filters.budget);
  return Boolean(filters.budget) && Number.isFinite(amount) && amount > 0;
}

function hasSearchCriteria(filters: SearchFilters) {
  return hasMakeModel(filters) || hasDateRange(filters) || hasBudget(filters);
}

function searchModeFor(filters: SearchFilters): SearchMode {
  if (hasMakeModel(filters)) return 'make';
  if (hasDateRange(filters) || hasBudget(filters)) return 'budget';
  return 'make';
}

function filtersForMode(filters: SearchFilters, mode: SearchMode): SearchFilters {
  if (mode === 'make') {
    return { ...filters, startDate: '', endDate: '', budget: '', currency: 'EUR' };
  }
  return { ...filters, make: '', model: '' };
}

function displayedDailyRateMdl(car: CarType): number {
  const base = Number(car.price_over_30_days || car.price_2_4_days) || 0;
  const discount = Number((car as CarType & { discount?: number }).discount_percentage ?? (car as CarType & { discount?: number }).discount ?? 0);
  if (discount > 0 && discount < 100) return base * (1 - discount / 100);
  return base;
}

function budgetToMdl(amount: number, eur: number) {
  return amount * (eur > 1 ? eur : 1);
}

export const Cars: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { eur } = useExchangeRates();
  const dataFetchedRef = React.useRef(false);
  const rawSearchFilters = readSearchFilters(searchParams);
  const initialSearchMode = searchModeFor(rawSearchFilters);
  const initialSearchFilters = filtersForMode(rawSearchFilters, initialSearchMode);

  // URL sanitization - prevent infinite loops from malformed GitHub Pages URLs
  useEffect(() => {
    const currentUrl = window.location.href;
    const searchString = window.location.search;

    // Check for malformed URLs that GitHub Pages creates
    const hasMalformedParams = (
      searchString.includes('~and~') ||
      searchString.includes('~') ||
      searchString.includes('&/') ||
      searchString.includes('/&') ||
      (searchString.match(/&/g) || []).length > 10 // Too many & parameters
    );

    // If URL is malformed, redirect to clean URL immediately
    if (hasMalformedParams) {
      navigate('/cars', { replace: true });
      return;
    }
  }, []); // Only run once on mount

  const [cars, setCars] = useState<CarType[]>([]);
  const [allCars, setAllCars] = useState<CarType[]>([]); // Keep full dataset for model lookups
  const [loading, setLoading] = useState(true);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [sortBy, setSortBy] = useState<SortKey | ''>('');

  async function handleFetchCarsWithPhotos(updateVisible = true) {
    if (updateVisible) setLoading(true);
    try {
      const fetchedCars = await fetchCars();
      const carsWithDiscount = fetchedCars.map(car => ({
        ...car,
        discount_percentage: car.discount_percentage ?? (car as CarType & { discount?: number }).discount
      }));
      if (updateVisible) {
        setCars(carsWithDiscount);
      }
      setAllCars(carsWithDiscount);

      // Extract unique makes (same logic as hero searchbar)
      const makes = fetchedCars.map(car => {
        const make = car.make || '';
        const normalizedMake = make.includes('-') ? make.split('-')[0] : make;
        return normalizedMake.trim().toLowerCase();
      });
      const uniqueNormalizedMakes = Array.from(new Set(makes)).filter(Boolean);

      // Convert back to title case for display
      const uniqueMakes = uniqueNormalizedMakes.map(make =>
        make.charAt(0).toUpperCase() + make.slice(1).toLowerCase()
      );
      setMakes(uniqueMakes);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      if (updateVisible) setLoading(false);
    }
  }


  async function handleFetchCarsModel(make: string) {
    // Get models for the selected make from ALL cars (not filtered)
    setLoadingModels(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      const normalizedMake = make.trim().toLowerCase();
      const modelsForMake = allCars
        .filter(car => {
          const carMake = car.make || '';
          const carNormalizedMake = carMake.includes('-') ? carMake.split('-')[0] : carMake;
          return carNormalizedMake.trim().toLowerCase() === normalizedMake;
        })
        .map(car => car.model)
        .filter((model): model is string => model !== null && model !== undefined && model.trim() !== '')
        .filter((model, index, self) => self.indexOf(model) === index); // Remove duplicates

      setModels(modelsForMake);
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleFetchCars() {
    setLoading(true);
    try {
      const fetchedCars = await fetchCars();
      // Map discount field to discount_percentage for compatibility
      const carsWithDiscount = fetchedCars.map(car => ({
        ...car,
        discount_percentage: car.discount_percentage
      }));
      setCars(carsWithDiscount);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchCarsMake() {
    try {
      const fetchedCarsMake = await fetchCarsMake();
      setMakes(fetchedCarsMake);
    } catch (error) {
      console.error('Error fetching cars make:', error);
    }
  }

  async function handleFetchFilteredCars(basicFilters: typeof filters) {
    setLoading(true);
    try {
      // Build filter object from applied filters and sidebar filters
      const filters: CarFilters = {
        make: basicFilters.make || undefined,
        model: basicFilters.model || undefined,
        minPrice: sidebarFilters.priceRange[0],
        maxPrice: sidebarFilters.priceRange[1],
        minYear: sidebarFilters.yearRange[0],
        maxYear: sidebarFilters.yearRange[1],
        fuelType: sidebarFilters.fuelType !== 'Any'
          ? FUEL_TYPE_MAP[sidebarFilters.fuelType as keyof typeof FUEL_TYPE_MAP]
          : undefined,
        transmission: sidebarFilters.transmission !== 'Any' ? sidebarFilters.transmission as 'Automatic' | 'Manual' : undefined,
        seats: sidebarFilters.seats !== undefined ? sidebarFilters.seats : undefined,
      };

      const fetchedCars = await fetchFilteredCarsWithPhotos(filters);
      setCars(fetchedCars);

      // For filtered results, we don't need to update mappings anymore
      // Models will be calculated dynamically from the current cars array
    } catch (error) {
      console.error('Error fetching filtered cars:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    const shouldFilterOnServer = hasMakeModel(initialSearchFilters);
    handleFetchCarsWithPhotos(!shouldFilterOnServer);
    if (shouldFilterOnServer) {
      handleFetchFilteredCars(initialSearchFilters);
    }
  }, []);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>(initialSearchFilters);
  const [searchMode, setSearchMode] = useState<SearchMode>(initialSearchMode);

  // Applied filters state (what's actually used for filtering)
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(initialSearchFilters);
  const [bookedCarIds, setBookedCarIds] = useState<Set<string> | null>(null);

  // Dropdown states
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [pendingSort, setPendingSort] = useState<SortKey | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Update itemsPerPage based on screen size
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 8 : 12);
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowMakeDropdown(false);
    setShowModelDropdown(false);
    setShowDateCalendar(false);
    setShowSortDropdown(false);
  };

  // Close sidebar and apply filters
  const closeSidebarAndApply = () => {
    setShowAdvancedFilters(false);
    setCurrentPage(1); // Reset to first page when applying filters
    // Apply the current sidebar filters automatically when closing
    handleFetchFilteredCars({
      make: filters.make,
      model: filters.model
    });
  };

  // Handle opening a specific dropdown and closing others
  const openDropdown = (dropdownType: 'make' | 'model' | 'date') => {
    if ((dropdownType === 'make' && showMakeDropdown) ||
      (dropdownType === 'model' && showModelDropdown) ||
      (dropdownType === 'date' && showDateCalendar)) {
      closeAllDropdowns();
      return;
    }

    closeAllDropdowns();
    if (dropdownType === 'make') {
      setShowMakeDropdown(true);
    } else if (dropdownType === 'model') {
      setShowModelDropdown(true);
    } else if (dropdownType === 'date') {
      setShowDateCalendar(true);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    if (showMakeDropdown || showModelDropdown || showDateCalendar || showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMakeDropdown, showModelDropdown, showDateCalendar, showSortDropdown]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (showAdvancedFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdvancedFilters]);


  const defaultSidebarFilters: SidebarFilters = {
    priceRange: [0, 10000],
    yearRange: [new Date().getFullYear() - 10, new Date().getFullYear()],
    transmission: 'Any',
    fuelType: 'Any',
    seats: undefined,
  };

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(defaultSidebarFilters);

  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    if (!hasDateRange(appliedFilters)) {
      setBookedCarIds(null);
      return;
    }

    let cancelled = false;
    setBookedCarIds(null);
    fetchBookedCarIds(appliedFilters.startDate, appliedFilters.endDate).then((ids) => {
      if (!cancelled) setBookedCarIds(ids);
    });

    return () => {
      cancelled = true;
    };
  }, [appliedFilters.startDate, appliedFilters.endDate]);

  useEffect(() => {
    if (filters.make && allCars.length > 0) {
      handleFetchCarsModel(filters.make);
    }
  }, [allCars]);

  // Reset page when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy]);

  // Get unique makes from fetched makes array
  const uniqueMakes = useMemo(() => {
    return makes.map(make => {
      const parts = make.split(' ');
      const firstPart = parts[0];
      // Handle hyphenated makes like "Mercedes-AMG" -> extract "Mercedes"
      return firstPart.includes('-') ? firstPart.split('-')[0] : firstPart;
    }).filter((value, index, self) => self.indexOf(value) === index);
  }, [makes]);

  // Sort visible cars based on selected algorithm
  const sortedCars = useMemo(() => {
    const visibleCars = cars.filter((car) => {
      const status = car.status?.toLowerCase() || '';
      if (status === 'ascuns' || status === 'hidden') return false;

      if (hasDateRange(appliedFilters) && bookedCarIds?.has(String(car.id))) return false;

      if (hasBudget(appliedFilters)) {
        const maxMdl = budgetToMdl(Number(appliedFilters.budget), eur);
        const rate = displayedDailyRateMdl(car);
        if (!(rate > 0 && rate <= maxMdl)) return false;
      }

      return true;
    });

    const getPrice = (car: CarType) => displayedDailyRateMdl(car);

    if (!sortBy) return visibleCars;

    return [...visibleCars].sort((a, b) => {
      if (sortBy === 'price-low') return getPrice(a) - getPrice(b);
      if (sortBy === 'price-high') return getPrice(b) - getPrice(a);
      if (sortBy === 'year-new') return Number(b.year || 0) - Number(a.year || 0);
      return Number(a.year || 0) - Number(b.year || 0);
    });
  }, [cars, sortBy, appliedFilters, bookedCarIds, eur]);

  const availabilityLoading = hasDateRange(appliedFilters) && bookedCarIds === null;

  // Calculate pagination
  const totalPages = Math.ceil(sortedCars.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCars = sortedCars.slice(startIndex, endIndex);

  // Get car make logo path
  const getMakeLogo = (make: string): string | null => {
    const makeLower = make.toLowerCase();
    const logoMap: { [key: string]: string } = {
      'mercedes': '/logos/merc.svg',
      'mercedes-benz': '/logos/merc.svg',
      'bmw': '/logos/bmw.webp',
      'audi': '/logos/audi.png',
      'hyundai': '/logos/hyundai.png',
      'maserati': '/logos/maserati.png',
      'volkswagen': '/logos/volkswagen-1-logo-black-and-white.png',
      'vw': '/logos/volkswagen-1-logo-black-and-white.png',
      'lincoln': '/logos/lincoln.png',
      'porsche': '/logos/porsche.png',
      'renault': '/logos/renault.png',
    };
    return logoMap[makeLower] || null;
  };

  // Get logo size class based on make
  const getLogoSizeClass = (make: string): string => {
    const makeLower = make.toLowerCase();
    if (makeLower === 'renault') {
      return 'w-[15px] h-[15px] -ml-[2px]';
    }
    if (makeLower === 'audi' || makeLower === 'maserati' || makeLower === 'lincoln') {
      return 'w-6 h-6';
    }
    return 'w-4 h-4';
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };

    // If make is being changed, reset model if it's not valid for the new make
    if (key === 'make') {
      const newMake = value as string;
      if (newMake && filters.model) {
        // Check if current model is available for the new make in all cars
        const normalizedNewMake = newMake.trim().toLowerCase();
        const modelsForNewMake = allCars
          .filter(car => {
            const carMake = car.make || '';
            const carNormalizedMake = carMake.includes('-') ? carMake.split('-')[0] : carMake;
            return carNormalizedMake.trim().toLowerCase() === normalizedNewMake;
          })
          .map(car => car.model)
          .filter((model): model is string => model !== null && model !== undefined && model.trim() !== '');

        const currentModelValid = modelsForNewMake.some(model =>
          model.toLowerCase() === filters.model.toLowerCase()
        );
        if (!currentModelValid) {
          newFilters.model = '';
        }
      } else if (!newMake) {
        // If make is cleared, also clear model
        newFilters.model = '';
      }

      // Load models locally when make changes
      if (newMake) {
        handleFetchCarsModel(newMake);
      } else {
        setModels([]);
      }
    }

    const exclusive = filtersForMode(newFilters, searchMode);
    setFilters(exclusive);
    setApplyError('');

    if (hasSearchCriteria(exclusive)) {
      applyFilters(exclusive);
    } else {
      setAppliedFilters(exclusive);
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/cars') {
        navigate('/cars', { replace: true });
      }
      handleFetchCarsWithPhotos();
    }
  };

  const resetFilters = () => {
    const cleared = {
      make: '',
      model: '',
      startDate: '',
      endDate: '',
      budget: '',
      currency: 'EUR' as const,
    };
    setFilters(cleared);
    setAppliedFilters(cleared);
    setSidebarFilters(prev => ({ ...prev, ...defaultSidebarFilters }));
    setCurrentPage(1); // Reset to first page
    // Clear URL params - only if we're not already on the clean URL
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/cars') {
      navigate('/cars', { replace: true });
    }

    handleFetchCarsWithPhotos()
  };

  const otherFiltersActive =
    hasSearchCriteria(filters) ||
    hasSearchCriteria(appliedFilters) ||
    sidebarFilters.transmission !== defaultSidebarFilters.transmission ||
    sidebarFilters.fuelType !== defaultSidebarFilters.fuelType ||
    sidebarFilters.seats !== undefined ||
    sidebarFilters.priceRange[0] !== defaultSidebarFilters.priceRange[0] ||
    sidebarFilters.priceRange[1] !== defaultSidebarFilters.priceRange[1] ||
    sidebarFilters.yearRange[0] !== defaultSidebarFilters.yearRange[0] ||
    sidebarFilters.yearRange[1] !== defaultSidebarFilters.yearRange[1];

  const requestSort = (key: SortKey) => {
    setShowSortDropdown(false);
    if (key === sortBy) return;
    if (otherFiltersActive) {
      setPendingSort(key);
      return;
    }
    setSortBy(key);
  };

  const confirmSortReset = () => {
    if (!pendingSort) return;
    const nextSort = pendingSort;
    setPendingSort(null);
    resetFilters();
    setSortBy(nextSort);
  };

  const switchSearchMode = (mode: SearchMode) => {
    if (mode === searchMode) return;
    closeAllDropdowns();
    setSearchMode(mode);
    const next = filtersForMode(filters, mode);
    setFilters(next);

    if (hasSearchCriteria(next)) {
      applyFilters(next);
      return;
    }

    setAppliedFilters(next);
    setApplyError('');
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/cars') {
      navigate('/cars', { replace: true });
    }
    if (hasMakeModel(appliedFilters)) {
      handleFetchCarsWithPhotos();
    }
  };

  const handleSidebarFilterChange = (key: string, value: any) => {
    if (value === 'Any')
      value = undefined
    setSidebarFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = (liveFilters: SearchFilters) => {
    const next = filtersForMode({ ...liveFilters, currency: 'EUR' }, searchMode);

    if (!hasSearchCriteria(next)) {
      setApplyError('Vă rugăm să selectați cel puțin un filtru pentru căutare.');
      setTimeout(() => setApplyError(''), 3000);
      return;
    }

    setApplyError('');
    setAppliedFilters(next);
    setCurrentPage(1);

    closeAllDropdowns();

    if ((next.make && !isSafeText(next.make)) || (next.model && !isSafeText(next.model))) {
      setApplyError('Filtrele conțin caractere nevalide.');
      setTimeout(() => setApplyError(''), 3000);
      return;
    }

    const params = new URLSearchParams();

    if (next.make && isSafeText(next.make)) {
      params.set('make', next.make);
    }
    if (next.model && isSafeText(next.model)) {
      params.set('model', next.model);
    }
    if (next.startDate && isIsoDate(next.startDate)) {
      params.set('startDate', next.startDate);
    }
    if (next.endDate && isIsoDate(next.endDate)) {
      params.set('endDate', next.endDate);
    }
    if (hasBudget(next)) {
      params.set('budget', next.budget);
      params.set('currency', next.currency);
    }

    const queryString = params.toString();
    const newUrl = `/cars${queryString ? `?${queryString}` : ''}`;
    const currentPath = window.location.pathname + window.location.search;

    if (currentPath !== newUrl) {
      navigate(newUrl, { replace: true });
    }

    if (hasMakeModel(next)) {
      handleFetchFilteredCars(next);
    } else if (hasMakeModel(appliedFilters)) {
      handleFetchCarsWithPhotos();
    }
  };

  const handleDateRangeChange = (range: { startDate: string; endDate: string }) => {
    const next = filtersForMode({ ...filters, startDate: range.startDate, endDate: range.endDate }, searchMode);
    setFilters(next);

    const completed = Boolean(range.startDate && range.endDate);
    const cleared = !range.startDate && !range.endDate;
    if (!completed && !cleared) return;

    if (hasSearchCriteria(next)) {
      applyFilters(next);
      return;
    }

    setAppliedFilters(next);
    setApplyError('');
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/cars') {
      navigate('/cars', { replace: true });
    }
    if (hasMakeModel(appliedFilters)) {
      handleFetchCarsWithPhotos();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Top Filter Section - Full Width */}
        <div className="mt-8 mb-10 relative">
          <div
            className="rounded-3xl overflow-visible flex flex-col relative"
          >
            {/* Background Image Container - Clipped */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden bg-cover bg-center md:bg-[center_-400px] z-0"
              style={{ backgroundImage: 'url(/backgrounds/bg10-mobile.jpeg)' }}
            >
              {/* Black Overlay */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            </div>

            {/* Advanced Filters Button - Top Corner (Desktop) */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={`hidden md:flex absolute top-6 right-6 w-14 h-14 rounded-2xl items-center justify-center transition-all transform hover:scale-105 z-20 ${showAdvancedFilters ? 'bg-theme-500 text-white hover:bg-theme-600 shadow-lg' : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20'}`}
            >
              <Filter className="w-5 h-5 stroke-2" />
            </button>

            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={`md:hidden absolute top-4 right-4 z-20 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showAdvancedFilters ? 'bg-theme-500 text-white hover:bg-theme-600 shadow-lg' : 'backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-white'}`}
            >
              <Filter className="w-5 h-5 stroke-2" />
            </button>

            <div className="relative z-10 px-6 pt-6 pr-20 md:px-8 md:pt-8 md:max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4"
              >
                {t('carsPage.title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-sm md:text-base lg:text-lg text-white/90 font-medium leading-relaxed"
              >
                {t('carsPage.subtitle')}
              </motion.p>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6 relative z-10">
              {/* Mobile Error Notification - Fixed at top */}
              <AnimatePresence>
                {applyError && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-24 left-4 right-4 z-[10000] md:hidden bg-white border-l-4 border-theme-500 text-gray-900 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-theme-500 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="flex-1 text-gray-900">{applyError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="hidden md:flex items-center justify-between gap-4">
                <SearchModeTabs mode={searchMode} onChange={switchSearchMode} variant="cars" />

                <div className="flex items-center gap-4 min-w-0">
                  <AnimatePresence>
                    {applyError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm font-medium"
                      >
                        {applyError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={resetFilters}
                    className="text-sm md:text-base text-white/80 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                    {t('carsPage.clearFilters')}
                  </button>
                </div>
              </div>

              <div className="flex md:hidden items-center">
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('carsPage.clearFilters')}
                </button>
              </div>

              {/* Filter Card - Glassmorphism Style */}
              <div className="md:hidden">
                <SearchModeTabs mode={searchMode} onChange={switchSearchMode} variant="cars" />
              </div>
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl overflow-visible shadow-lg">
                <div className="flex flex-col lg:flex-row gap-0 items-stretch">
                  {/* Car Brand */}
                  <div className={`flex-1 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible ${searchMode === 'make' ? '' : 'hidden'}`}>
                    <label className={`text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${filters.make ? 'text-white' : 'text-white/80'}`}>
                      {t('carsPage.make')}
                    </label>
                    <div className="relative overflow-visible">
                      <div
                        className={`text-base font-medium cursor-pointer transition-colors pr-8 flex items-center gap-2 ${filters.make ? 'text-white' : 'text-white/70'}`}
                        onClick={() => openDropdown('make')}
                      >
                        {filters.make && (() => {
                          const logoPath = getMakeLogo(filters.make.toLowerCase());
                          return logoPath ? (
                            <img
                              src={logoPath}
                              alt={filters.make}
                              className={`${getLogoSizeClass(filters.make)} object-contain brightness-0 invert ${filters.make.toLowerCase() === 'porsche' ? 'ml-px' : ''}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null;
                        })()}
                        <span>{filters.make || t('carsPage.selectMake')}</span>
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Make Dropdown */}
                      <AnimatePresence>
                        {showMakeDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <div
                                className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 transition-colors rounded-t-2xl ${!filters.make ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => {
                                  handleFilterChange('make', '');
                                  closeAllDropdowns();
                                }}
                              >
                                {t('search.any')}
                              </div>
                              {uniqueMakes.map((make, index) => {
                                const logoPath = getMakeLogo(make.toLowerCase());
                                const isLast = index === uniqueMakes.length - 1;
                                return (
                                  <div
                                    key={make}
                                    className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-2 ${isLast ? 'rounded-b-2xl' : ''} ${filters.make === make ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                    onClick={() => {
                                      handleFilterChange('make', filters.make === make ? '' : make);
                                      closeAllDropdowns();
                                    }}
                                  >
                                    <div className="w-6 flex items-center justify-start flex-shrink-0">
                                      {logoPath && (
                                        <img
                                          src={logoPath}
                                          alt={make}
                                          className={`${getLogoSizeClass(make)} object-contain ${make.toLowerCase() === 'porsche' ? 'ml-px' : ''}`}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                    </div>
                                    <span>{make}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Car Model */}
                  <div className={`flex-1 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible ${searchMode === 'make' ? '' : 'hidden'}`}>
                    <label className={`text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${filters.model ? 'text-white' : 'text-white/80'}`}>
                      {t('carsPage.model')}
                    </label>
                    <div className="relative overflow-visible">
                      <div
                        className={`text-base font-medium transition-colors pr-8 ${!filters.make ? 'text-white/50 cursor-not-allowed' : (filters.model || loadingModels) ? 'text-white cursor-pointer' : 'text-white/70 cursor-pointer'}`}
                        onClick={() => filters.make && !loadingModels && openDropdown('model')}
                      >
                        {!filters.make ? t('carsPage.selectMake') :
                          loadingModels ? 'Se încarcă...' :
                            (filters.model || t('carsPage.selectModel'))}
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                        {loadingModels ? (
                          <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className={`w-4 h-4 ${!filters.make ? 'text-white/30' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>

                      {/* Model Dropdown */}
                      <AnimatePresence>
                        {showModelDropdown && filters.make && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <div
                                className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 transition-colors rounded-t-2xl ${!filters.model ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => {
                                  handleFilterChange('model', '');
                                  closeAllDropdowns();
                                }}
                              >
                                {t('search.any')}
                              </div>
                              {loadingModels ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    Se încarcă...
                                  </div>
                                </div>
                              ) : models.length > 0 ? (
                                models.map((model, index) => {
                                  const isLast = index === models.length - 1;
                                  return (
                                    <div
                                      key={model}
                                      className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${isLast ? 'rounded-b-2xl' : ''} ${filters.model === model ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                      onClick={() => {
                                        handleFilterChange('model', filters.model === model ? '' : model);
                                        closeAllDropdowns();
                                      }}
                                    >
                                      {model}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">
                                  Nu sunt modele disponibile
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {searchMode === 'budget' && (
                  <DateRangeField
                    variant="cars"
                    label={t('search.period')}
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    open={showDateCalendar}
                    onToggle={() => openDropdown('date')}
                    onChange={handleDateRangeChange}
                    onRangeComplete={closeAllDropdowns}
                  />
                  )}

                  {searchMode === 'budget' && (
                  <BudgetField
                    variant="cars"
                    label={t('search.budget')}
                    value={filters.budget}
                    onFocus={closeAllDropdowns}
                    onChange={(value) => setFilters((prev) => ({
                      ...prev,
                      budget: value,
                      currency: 'EUR',
                    }))}
                  />
                  )}

                  {/* Search Button */}
                  <div className="px-4 py-3 md:px-6 md:py-5 flex-[1.5] lg:flex-[1]">
                    <button
                      onClick={() => applyFilters(filters)}
                      className="w-full py-3.5 md:py-4 lg:py-3.5 bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-600 hover:to-theme-700 text-white font-bold px-6 md:px-8 rounded-2xl text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <Search className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
                      {t('carsPage.search')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Keys Image Overlay - Outside rounded container */}
          <img
            src="/assets/Design Elements/keys.png"
            alt=""
            className="absolute hidden lg:block lg:bottom-[100px] lg:right-[250px] bottom-[400px] right-[0px]  lg:w-[300px] w-[200px] h-auto object-contain z-[10] pointer-events-none"
          />
        </div>

        {/* Advanced Filters Drawer */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-[9998]"
                onClick={closeSidebarAndApply}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[80%] md:w-[20%] bg-white shadow-2xl z-[9999] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-semibold text-gray-900">Filtre</h3>
                    <button
                      onClick={closeSidebarAndApply}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Clear All Button */}
                  <div className="mb-8">
                    <button
                      onClick={() => {
                        resetFilters();
                        setShowAdvancedFilters(false);
                      }}
                      className="text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {t('filters.clear')}
                    </button>
                  </div>

                  {/* Filter Sections */}
                  <div className="space-y-6">
                    {/* Price Range Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('filters.price.label')}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">{t('filters.price.from')}</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              value={sidebarFilters.priceRange[0]}
                              onChange={(e) =>
                                setSidebarFilters({
                                  ...sidebarFilters,
                                  priceRange: [Number(e.target.value), sidebarFilters.priceRange[1]],
                                })
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">{t('filters.price.to')}</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              value={sidebarFilters.priceRange[1]}
                              onChange={(e) =>
                                setSidebarFilters({
                                  ...sidebarFilters,
                                  priceRange: [sidebarFilters.priceRange[0], Number(e.target.value)],
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Year Range Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('filters.year.label')}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">{t('filters.year.from')}</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              value={sidebarFilters.yearRange[0]}
                              onChange={(e) =>
                                setSidebarFilters({
                                  ...sidebarFilters,
                                  yearRange: [Number(e.target.value), sidebarFilters.yearRange[1]],
                                })
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">{t('filters.year.to')}</label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              value={sidebarFilters.yearRange[1]}
                              onChange={(e) =>
                                setSidebarFilters({
                                  ...sidebarFilters,
                                  yearRange: [sidebarFilters.yearRange[0], Number(e.target.value)],
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transmission Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('filters.transmission.label')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'Any', label: t('filters.transmission.any') },
                          { key: 'Manual', label: t('filters.transmission.manual') },
                          { key: 'Automatic', label: t('filters.transmission.automatic') }
                        ].map((transmission) => {
                          const value = transmission.key === 'Any' ? undefined : transmission.key;
                          const isActive = sidebarFilters.transmission === value || value === undefined && sidebarFilters.transmission === 'Any';

                          return (
                            <button
                              key={transmission.key}
                              onClick={() => handleSidebarFilterChange('transmission', value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-red-500 text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                }`}
                            >
                              {transmission.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fuel Type Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('filters.fuel.label')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'Any', label: t('filters.fuel.any'), value: undefined },
                          { key: 'Benzina', label: t('filters.fuel.benzina'), value: 'Benzina' },
                          { key: 'Diesel', label: t('filters.fuel.diesel'), value: 'Diesel' },
                          { key: 'Hybrid', label: t('filters.fuel.hybrid'), value: 'Hybrid' },
                          { key: 'Electric', label: t('filters.fuel.electric'), value: 'Electric' }
                        ].map((fuelType) => {
                          const isActive = sidebarFilters.fuelType === fuelType.value || fuelType.value === undefined && sidebarFilters.fuelType === 'Any';

                          return (
                            <button
                              key={fuelType.key}
                              onClick={() => handleSidebarFilterChange('fuelType', fuelType.value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-red-500 text-white shadow-md transform scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                                }`}
                            >
                              {fuelType.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seats Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('filters.seats.label')}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-2">{t('filters.seats.minSeats')}</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            value={sidebarFilters.seats || ''}
                            onChange={(e) =>
                              setSidebarFilters({
                                ...sidebarFilters,
                                seats: parseInt(e.target.value) || undefined,
                              })
                            }
                            placeholder="Ex: 5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="mt-8">
                    <button
                      onClick={closeSidebarAndApply}
                      className="w-full py-3 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      {t('filters.apply')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Layout */}
        <div className="w-full mt-8">
          {/* Sorting */}
          <div className="mb-5 h-11 flex items-center justify-end">
            <div className="flex items-center gap-2 dropdown-container w-full justify-end">
              <label className="text-sm text-gray-600 font-medium">{t('carsPage.sortBy')}</label>
              <div className="relative w-[50%] lg:w-[20%] max-w-[560px] min-w-0 flex-none">
                {(() => {
                  const sortOptions: Array<{ key: SortKey; label: string; icon: React.ReactNode }> = [
                    { key: 'price-low', label: t('carsPage.sortPriceLow'), icon: <ArrowUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> },
                    { key: 'price-high', label: t('carsPage.sortPriceHigh'), icon: <ArrowDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> },
                    { key: 'year-new', label: t('carsPage.sortYearNew'), icon: <ArrowDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> },
                    { key: 'year-old', label: t('carsPage.sortYearOld'), icon: <ArrowUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> },
                  ];
                  const selectedSort = sortOptions.find((option) => option.key === sortBy);

                  return (
                    <>
                <div
                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-xl px-4 py-2.5 cursor-pointer select-none"
                  onClick={() => setShowSortDropdown((prev) => !prev)}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="truncate">{selectedSort ? selectedSort.label : t('carsPage.selectSort')}</span>
                    {selectedSort ? selectedSort.icon : <ArrowUpDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                  </div>
                </div>

                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[200]"
                    >
                      {sortOptions.map((option, index, arr) => (
                        <div
                          key={option.key}
                          className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${index === 0 ? 'rounded-t-2xl' : ''} ${index === arr.length - 1 ? 'rounded-b-2xl' : ''} ${sortBy === option.key ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => requestSort(option.key)}
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className="truncate">{option.label}</span>
                            {option.icon}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {(loading || availabilityLoading) ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-theme-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Se încarcă mașinile...</p>
            </div>
          ) : (
            <>
              {/* Cars Grid */}
              {sortedCars.length > 0 ? (
                <>
                  <motion.div
                    ref={ref}
                    variants={staggerContainer}
                    initial="initial"
                    animate={isInView ? "animate" : "initial"}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
                  >
                    {paginatedCars.map((car) => (
                        <CarCard key={car.id} car={car} />
                      ))}
                  </motion.div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={currentPage === 1}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Anterior
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => {
                              setCurrentPage(page);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-theme-500 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Următor
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Check if any filters are applied
                (hasSearchCriteria(appliedFilters) ||
                  Object.values(sidebarFilters).some(value => {
                    if (Array.isArray(value)) {
                      return value[0] !== (value[1] === 2025 ? 2020 : 0) || value[1] !== 2025;
                    }
                    return value !== 'Any';
                  })) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 px-4"
                  >
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Nu s-au găsit mașini
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Nu am găsit mașini care să corespundă criteriilor dvs. de filtrare. Vă rugăm să încercați să modificați filtrele.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="px-6 py-3 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-xl transition-colors"
                      >
                        Resetează filtrele
                      </button>
                    </div>
                  </motion.div>
                ) : null
              )}
            </>
          )}

          {/* Rental Options Section */}
          <RentalOptionsSection />

          {/* Contract Section */}
          <ContractSection />

        </div>
      </div>

      <AnimatePresence>
        {pendingSort && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setPendingSort(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {t('carsPage.sortResetTitle')}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {t('carsPage.sortResetMessage')}
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingSort(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {t('carsPage.sortResetCancel')}
                </button>
                <button
                  type="button"
                  onClick={confirmSortReset}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-theme-500 hover:bg-theme-600 text-white transition-colors"
                >
                  {t('carsPage.sortResetConfirm')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
