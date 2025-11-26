import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader2,
    Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchCars } from '../../../../lib/cars';
import { fetchImagesByCarName } from '../../../../lib/db/cars/cars';
import { Car as CarType } from '../../../../types';
import { OrderDisplay } from '../../../../lib/orders';
import {
    fetchBorrowRequestsForDisplay,
    acceptBorrowRequest,
    rejectBorrowRequest,
    undoRejectBorrowRequest,
    updateBorrowRequest,
    createRentalManually,
    createBorrowRequest,
    processStatusTransitions,
} from '../../../../lib/orders';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { RequestDetailsView } from './RequestDetailsView';
import { RequestDetailsModal } from '../modals/RequestDetailsModal';
import { CreateRentalModal } from '../modals/CreateRentalModal';
import { EditRequestModal } from '../modals/EditRequestModal';
import { ContractCreationModal } from '../../../../components/modals/ContractCreationModal';

export const RequestsView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestId = searchParams.get('requestId');
    const carId = searchParams.get('carId');
    const { showSuccess, showError } = useNotification();
    const [requests, setRequests] = useState<OrderDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [cars, setCars] = useState<CarType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'pickup' | 'return' | 'amount' | 'status' | null>('status');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showRejected, setShowRejected] = useState(false);
    const [showExecuted, setShowExecuted] = useState(false);
    const [showAddRentalModal, setShowAddRentalModal] = useState(false);
    const [selectedCarIdForRental, setSelectedCarIdForRental] = useState<string | undefined>(undefined);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<OrderDisplay | null>(null);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<OrderDisplay | null>(null);
    const [showContractModal, setShowContractModal] = useState(false);
    const [selectedRentalForContract, setSelectedRentalForContract] = useState<OrderDisplay | null>(null);

    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );
                
                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            }
        };
        loadCars();
    }, []);

    // Open modal if carId is in URL params
    useEffect(() => {
        if (carId && cars.length > 0) {
            setSelectedCarIdForRental(carId);
            setShowAddRentalModal(true);
            // Remove carId from URL to avoid reopening on refresh
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('carId');
            setSearchParams(newParams, { replace: true });
        }
    }, [carId, cars.length, searchParams, setSearchParams]);

    useEffect(() => {
        if (cars.length > 0) {
            // Process status transitions first, then load requests once
            processStatusTransitions(cars).then(() => {
                loadRequests();
            });
        }
    }, [cars]);

    // Periodically check and process status transitions (every 60 seconds)
    useEffect(() => {
        if (cars.length === 0) return;

        const interval = setInterval(async () => {
            const result = await processStatusTransitions(cars);
            if (result.success && (result.executed > 0 || result.completed > 0)) {
                // Reload requests if any were processed
                loadRequests();
            }
        }, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, [cars]);

    useEffect(() => {
        // Reload requests when requestId changes to ensure we have the latest data
        if (requestId) {
            loadRequests();
        }
    }, [requestId]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await fetchBorrowRequestsForDisplay(cars);
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request: OrderDisplay) => {
        if (!window.confirm(`${t('admin.requests.confirmAcceptRequest')} ${request.customerName} ${t('admin.requests.forCar')} ${request.carName}?`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await acceptBorrowRequest(request.id.toString(), cars);
            if (result.success) {
                showSuccess(t('admin.requests.requestAccepted'));
                await loadRequests();
                // Optionally navigate to the created rental
                if (result.rentalId) {
                    navigate(`/admin?section=orders&orderId=${result.rentalId}`);
                }
            } else {
                showError(`${t('admin.requests.requestAcceptFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            showError(t('admin.requests.requestAcceptErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleReject = async (request: OrderDisplay) => {
        const reason = window.prompt(`${t('admin.requests.confirmRejectRequest')} ${request.customerName}? ${t('admin.requests.rejectReasonPrompt')}`);
        if (reason === null) return; // User cancelled

        setProcessingRequest(request.id.toString());
        try {
            // If request is already APPROVED, use updateBorrowRequest instead
            if (request.status === 'APPROVED') {
                const result = await updateBorrowRequest(request.id.toString(), { status: 'REJECTED' } as any);
                if (result.success) {
                    showSuccess(t('admin.requests.requestRejected'));
                    await loadRequests();
                } else {
                    showError(`${t('admin.requests.requestRejectFailed')} ${result.error || t('admin.common.unknownError')}`);
                }
            } else {
                const result = await rejectBorrowRequest(request.id.toString(), reason || undefined);
                if (result.success) {
                    showSuccess(t('admin.requests.requestRejected'));
                    await loadRequests();
                } else {
                    showError(`${t('admin.requests.requestRejectFailed')} ${result.error || t('admin.common.unknownError')}`);
                }
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            showError(t('admin.requests.requestRejectErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleUndoReject = async (request: OrderDisplay) => {
        if (!window.confirm(`${t('admin.requests.confirmRestoreRequest')} ${request.customerName} ${t('admin.requests.forCar')} ${request.carName} ${t('admin.requests.toPending')}`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await undoRejectBorrowRequest(request.id.toString());
            if (result.success) {
                showSuccess(t('admin.requests.requestRestored'));
                await loadRequests();
            } else {
                showError(`${t('admin.requests.requestRestoreFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error undoing reject request:', error);
            showError(t('admin.requests.requestRestoreErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleSetToPending = async (request: OrderDisplay) => {
        if (!window.confirm(`${t('admin.requests.confirmSetToPending')} ${request.customerName} ${t('admin.requests.forCar')} ${request.carName} ${t('admin.requests.backToPending')}`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await updateBorrowRequest(request.id.toString(), { status: 'PENDING' } as any);
            if (result.success) {
                showSuccess(t('admin.requests.requestSetToPending'));
                await loadRequests();
            } else {
                showError(`${t('admin.requests.requestUpdateFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error setting request to pending:', error);
            showError(t('admin.requests.requestUpdateErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleEdit = (request: OrderDisplay) => {
        setEditingRequest(request);
        setShowEditModal(true);
    };

    const handleCancelRental = async (request: OrderDisplay) => {
        if (!window.confirm(`Sunteți sigur că doriți să anulați închirierea pentru ${request.customerName}? Această acțiune va seta cererea la In Asteptare și va șterge comanda de închiriere.`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const requestId = typeof request.id === 'string' ? parseInt(request.id) : request.id;
            
            // First, delete the rental with matching request_id
            const { error: deleteError } = await supabaseAdmin
                .from('Rentals')
                .delete()
                .eq('request_id', requestId);

            if (deleteError) {
                console.error('Error deleting rental:', deleteError);
                showError(`Eroare la ștergerea închirierii: ${deleteError.message}`);
                setProcessingRequest(null);
                return;
            }

            // Then, set the request status to PENDING
            const result = await updateBorrowRequest(request.id.toString(), { status: 'PENDING' } as any);
            if (result.success) {
                showSuccess('Închirierea a fost anulată și cererea a fost setată la În Asteptare');
                await loadRequests();
            } else {
                showError(`Eroare la actualizarea cererii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error canceling rental:', error);
            showError('Eroare la anularea închirierii');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleStartRental = async (request: OrderDisplay) => {
        setProcessingRequest(request.id.toString());
        try {
            const car = cars.find(c => c.id.toString() === request.carId);
            if (!car) {
                showError('Mașina nu a fost găsită');
                setProcessingRequest(null);
                return;
            }

            // Calculate total amount (same logic as in RequestDetailsModal)
            const formatTime = (timeString: string): string => {
                if (!timeString) return '00:00';
                if (timeString.includes('AM') || timeString.includes('PM')) {
                    const [time, period] = timeString.split(' ');
                    const [hours, minutes] = time.split(':');
                    let hour24 = parseInt(hours);
                    if (period === 'PM' && hour24 !== 12) hour24 += 12;
                    if (period === 'AM' && hour24 === 12) hour24 = 0;
                    return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
                }
                if (timeString.includes(':')) {
                    const [hours, minutes] = timeString.split(':');
                    return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
                }
                return '00:00';
            };

            const startDate = new Date(request.pickupDate);
            const endDate = new Date(request.returnDate);
            const pickupTime = formatTime(request.pickupTime);
            const returnTime = formatTime(request.returnTime);
            const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
            const [returnHour, returnMin] = returnTime.split(':').map(Number);

            const startDateTime = new Date(startDate);
            startDateTime.setHours(pickupHour, pickupMin, 0, 0);
            const endDateTime = new Date(endDate);
            if (returnHour === 0 && returnMin === 0) {
                endDateTime.setHours(23, 59, 59, 999);
            } else {
                endDateTime.setHours(returnHour, returnMin, 0, 0);
            }

            const diffTime = endDateTime.getTime() - startDateTime.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const days = diffDays;
            const hours = diffHours >= 0 ? diffHours : 0;
            const rentalDays = days;
            const totalDays = days + (hours / 24);

            // Calculate base price (no discounts now)
            let basePrice = car.price_per_day * rentalDays;
            if (hours > 0) {
                const hoursPrice = (hours / 24) * car.price_per_day;
                basePrice += hoursPrice;
            }

            // Calculate additional costs
            const options = (request as any).options;
            let parsedOptions: any = {};
            if (options) {
                if (typeof options === 'string') {
                    try {
                        parsedOptions = JSON.parse(options);
                    } catch (e) {
                        parsedOptions = {};
                    }
                } else {
                    parsedOptions = options;
                }
            }

            let additionalCosts = 0;
            const baseCarPrice = car.price_per_day;
            if (parsedOptions.unlimitedKm) {
                additionalCosts += baseCarPrice * totalDays * 0.5;
            }
            if (parsedOptions.speedLimitIncrease) {
                additionalCosts += baseCarPrice * totalDays * 0.2;
            }
            if (parsedOptions.tireInsurance) {
                additionalCosts += baseCarPrice * totalDays * 0.2;
            }
            if (parsedOptions.personalDriver) {
                additionalCosts += 800 * rentalDays;
            }
            if (parsedOptions.priorityService) {
                additionalCosts += 1000 * rentalDays;
            }
            if (parsedOptions.childSeat) {
                additionalCosts += 100 * rentalDays;
            }
            if (parsedOptions.simCard) {
                additionalCosts += 100 * rentalDays;
            }
            if (parsedOptions.roadsideAssistance) {
                additionalCosts += 500 * rentalDays;
            }

            const totalPrice = basePrice + additionalCosts;

            // Create rental with CONTRACT status
            const userId = request.userId || '';
            const result = await createRentalManually(
                userId,
                request.carId,
                request.pickupDate,
                request.pickupTime,
                request.returnDate,
                request.returnTime,
                totalPrice,
                cars,
                {
                    rentalStatus: 'CONTRACT',
                    customerName: request.customerName,
                    customerEmail: request.customerEmail,
                    customerPhone: request.customerPhone,
                    customerFirstName: request.customerFirstName,
                    customerLastName: request.customerLastName,
                    customerAge: request.customerAge ? parseInt(String(request.customerAge)) : undefined,
                    requestId: typeof request.id === 'string' ? request.id : request.id.toString()
                }
            );

            if (result.success && result.rentalId) {
                // Fetch the created rental to pass to contract modal
                const { data: rentalData } = await supabaseAdmin
                    .from('Rentals')
                    .select('*')
                    .eq('id', result.rentalId)
                    .single();

                if (rentalData) {
                    // Convert rental to OrderDisplay format for contract modal
                    const rentalAsOrder: OrderDisplay = {
                        id: rentalData.id.toString(),
                        carId: rentalData.car_id.toString(),
                        carName: request.carName,
                        pickupDate: request.pickupDate,
                        pickupTime: request.pickupTime,
                        returnDate: request.returnDate,
                        returnTime: request.returnTime,
                        amount: rentalData.total_amount || totalPrice,
                        status: 'CONTRACT',
                        userId: userId,
                        customerName: request.customerName,
                        customerEmail: request.customerEmail,
                        customerPhone: request.customerPhone,
                        customerFirstName: request.customerFirstName,
                        customerLastName: request.customerLastName,
                        customerAge: request.customerAge,
                        options: options,
                        // Include rental database fields for price breakdown
                        subtotal: rentalData.subtotal,
                        taxes_fees: rentalData.taxes_fees,
                        additional_taxes: rentalData.additional_taxes,
                        total_amount: rentalData.total_amount,
                        price_per_day: rentalData.price_per_day
                    } as any;

                    setSelectedRentalForContract(rentalAsOrder);
                    setShowContractModal(true);
                    setShowRequestDetailsModal(false);
                    showSuccess('Închirierea a fost creată cu succes!');
                } else {
                    showError('Nu s-a putut găsi închirierea creată');
                }
            } else {
                showError(`Nu s-a putut crea închirierea: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error starting rental:', error);
            showError('A apărut o eroare la crearea închirierii');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleSort = (field: 'pickup' | 'return' | 'amount' | 'status') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Calculate total price for a request (same logic as modal)
    const calculateRequestTotalPrice = useCallback((request: OrderDisplay): number => {
        const car = cars.find(c => c.id.toString() === request.carId);
        if (!car) return request.amount || 0;

        const formatTime = (timeString: string): string => {
            if (!timeString) return '00:00';
            if (timeString.includes('AM') || timeString.includes('PM')) {
                const [time, period] = timeString.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
            }
            if (timeString.includes(':')) {
                const [hours, minutes] = timeString.split(':');
                return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
            }
            return '00:00';
        };

        const startDate = new Date(request.pickupDate);
        const endDate = new Date(request.returnDate);

        const pickupTime = formatTime(request.pickupTime);
        const returnTime = formatTime(request.returnTime);
        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [returnHour, returnMin] = returnTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(pickupHour, pickupMin, 0, 0);

        const endDateTime = new Date(endDate);
        // If return time is 00:00, treat it as end of previous day (23:59:59)
        if (returnHour === 0 && returnMin === 0) {
            endDateTime.setHours(23, 59, 59, 999);
        } else {
            endDateTime.setHours(returnHour, returnMin, 0, 0);
        }

        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;

        const rentalDays = days;
        const totalDays = days + (hours / 24);

        // Base price calculation
        let basePrice = 0;

        if (rentalDays >= 8) {
            basePrice = car.price_per_day * 0.96 * rentalDays;
        } else if (rentalDays >= 4) {
            basePrice = car.price_per_day * 0.98 * rentalDays;
        } else {
            basePrice = car.price_per_day * rentalDays;
        }

        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * car.price_per_day;
            basePrice += hoursPrice;
        }

        // Calculate additional costs from options
        const options = (request as any).options;
        let parsedOptions: any = {};

        if (options) {
            if (typeof options === 'string') {
                try {
                    parsedOptions = JSON.parse(options);
                } catch (e) {
                    parsedOptions = {};
                }
            } else {
                parsedOptions = options;
            }
        }

        let additionalCosts = 0;
        const baseCarPrice = car.price_per_day;

        // Percentage-based options
        if (parsedOptions.unlimitedKm) {
            additionalCosts += baseCarPrice * totalDays * 0.5;
        }
        if (parsedOptions.speedLimitIncrease) {
            additionalCosts += baseCarPrice * totalDays * 0.2;
        }
        if (parsedOptions.tireInsurance) {
            additionalCosts += baseCarPrice * totalDays * 0.2;
        }

        // Fixed daily costs
        if (parsedOptions.personalDriver) {
            additionalCosts += 800 * rentalDays;
        }
        if (parsedOptions.priorityService) {
            additionalCosts += 1000 * rentalDays;
        }
        if (parsedOptions.childSeat) {
            additionalCosts += 100 * rentalDays;
        }
        if (parsedOptions.simCard) {
            additionalCosts += 100 * rentalDays;
        }
        if (parsedOptions.roadsideAssistance) {
            additionalCosts += 500 * rentalDays;
        }

        // Total price = base price + additional costs
        const totalPrice = basePrice + additionalCosts;
        return Math.round(totalPrice);
    }, []);

    const filteredRequests = useMemo(() => {
        let filtered = requests.filter(request => {
            const matchesSearch =
                request.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.carName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());

            // When showRejected is true, only show rejected requests
            // When showRejected is false, hide rejected requests
            const matchesRejectedFilter = showRejected
                ? request.status === 'REJECTED'
                : request.status !== 'REJECTED';

            // When showExecuted is true, only show executed requests
            // When showExecuted is false, hide executed requests
            const matchesExecutedFilter = showExecuted
                ? request.status === 'EXECUTED'
                : request.status !== 'EXECUTED';

            return matchesSearch && matchesRejectedFilter && matchesExecutedFilter;
        });

        // Sort based on selected field
        if (sortBy) {
            filtered.sort((a, b) => {
                let diff = 0;
                if (sortBy === 'pickup') {
                    const dateA = new Date(a.pickupDate).getTime();
                    const dateB = new Date(b.pickupDate).getTime();
                    diff = dateA - dateB;
                } else if (sortBy === 'return') {
                    const dateA = new Date(a.returnDate).getTime();
                    const dateB = new Date(b.returnDate).getTime();
                    diff = dateA - dateB;
                } else if (sortBy === 'amount') {
                    const amountA = calculateRequestTotalPrice(a);
                    const amountB = calculateRequestTotalPrice(b);
                    diff = amountA - amountB;
                } else if (sortBy === 'status') {
                    const statusOrder = { 'PENDING': 0, 'APPROVED': 1, 'REJECTED': 2 };
                    const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
                    const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
                    diff = statusA - statusB;
                }
                return sortOrder === 'asc' ? diff : -diff;
            });
        } else {
            // Default: sort by status (ascending)
            const statusOrder = { 'PENDING': 0, 'APPROVED': 1, 'REJECTED': 2, 'EXECUTED': 3 };
            filtered.sort((a, b) => {
                const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
                const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
                return statusA - statusB;
            });
        }

        return filtered;
    }, [requests, searchQuery, sortBy, sortOrder, showRejected, showExecuted, calculateRequestTotalPrice]);

    // If requestId is in URL, show request details view
    if (requestId) {
        const request = requests.find(r => r.id.toString() === requestId);
        if (request) {
            return <RequestDetailsView request={request} onBack={() => setSearchParams({ section: 'requests' })} onAccept={handleAccept} onReject={handleReject} onUndoReject={handleUndoReject} onSetToPending={handleSetToPending} cars={cars} />;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Requests Table Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">{t('admin.requests.rentalRequests')}</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        if (showExecuted) {
                                            setShowExecuted(false);
                                        }
                                        setShowRejected(!showRejected);
                                    }}
                                    disabled={showExecuted}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${showRejected
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        } ${showExecuted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {showRejected ? t('admin.requests.hideRejected') : t('admin.requests.showRejected')}
                                </button>
                                <button
                                    onClick={() => {
                                        if (showRejected) {
                                            setShowRejected(false);
                                        }
                                        setShowExecuted(!showExecuted);
                                    }}
                                    disabled={showRejected}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${showExecuted
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        } ${showRejected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {showExecuted ? 'Ascunde Începute' : 'Arată Începute'}
                                </button>
                                <button
                                    onClick={() => setShowAddRentalModal(true)}
                                    className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    {t('admin.requests.createRequest')}
                                </button>
                            </div>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            {/* Search */}
                            <div className="w-full md:flex-1 md:max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.placeholders.searchRequests')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-xs md:text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Filter and Sort Buttons */}
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                <span className="hidden md:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.requests.sortBy')}</span>
                                <span className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('admin.requests.sortBy')}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleSort('pickup')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'pickup'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.requests.pickupDate')}</span>
                                        {sortBy === 'pickup' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'pickup' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('amount')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'amount'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.requests.amount')}</span>
                                        {sortBy === 'amount' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'amount' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    {sortBy && sortBy !== 'status' && (
                                        <button
                                            onClick={() => {
                                                setSortBy('status');
                                                setSortOrder('asc');
                                            }}
                                            className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                        >
                                            {t('admin.requests.clearSort')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards / Desktop Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden p-4 space-y-4">
                            {filteredRequests.map((request) => {
                                const getInitials = (name: string) => {
                                    const parts = name.trim().split(' ');
                                    if (parts.length >= 2) {
                                        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                                    }
                                    return name.substring(0, 2).toUpperCase();
                                };

                                return (
                                    <div
                                        key={request.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setShowRequestDetailsModal(true);
                                        }}
                                    >
                                        {/* Header: Customer and Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                    {getInitials(request.customerName || 'U')}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-semibold text-white text-sm truncate">{request.customerName}</span>
                                                    {request.customerPhone && (
                                                        <span className="text-gray-400 text-xs truncate">{request.customerPhone}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm flex-shrink-0 ${request.status === 'PENDING'
                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                    : request.status === 'APPROVED'
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                    }`}
                                            >
                                                {request.status === 'PENDING' ? t('admin.status.pending') : 
                                                 request.status === 'APPROVED' ? t('admin.status.approved') : 
                                                 request.status === 'REJECTED' ? t('admin.status.rejected') : 
                                                 request.status === 'EXECUTED' ? 'Început' : 
                                                 request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                                            </span>
                                        </div>

                                        {/* Car Info */}
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                            <img
                                                src={request.avatar}
                                                alt={request.carName}
                                                className="w-12 h-12 object-cover rounded-md border border-white/10 flex-shrink-0"
                                            />
                                            <span className="text-white font-medium text-sm flex-1">{request.carName}</span>
                                        </div>

                                        {/* Dates and Amount */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.pickup')}</p>
                                                <p className="text-white text-sm font-medium">{new Date(request.pickupDate).toLocaleDateString()}</p>
                                                <p className="text-gray-400 text-xs">{request.pickupTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.return')}</p>
                                                <p className="text-white text-sm font-medium">{new Date(request.returnDate).toLocaleDateString()}</p>
                                                <p className="text-gray-400 text-xs">{request.returnTime}</p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-gray-400 text-xs mb-1">{t('admin.requests.amount')}</p>
                                            <p className="text-white font-semibold text-base">
                                                {calculateRequestTotalPrice(request).toLocaleString()} MDL
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.customer')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.car')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.pickup')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.return')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.amount')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.status')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredRequests.map((request) => {
                                        const getInitials = (name: string) => {
                                            const parts = name.trim().split(' ');
                                            if (parts.length >= 2) {
                                                return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                                            }
                                            return name.substring(0, 2).toUpperCase();
                                        };

                                        return (
                                            <tr
                                                key={request.id}
                                                className="border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowRequestDetailsModal(true);
                                                }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                            {getInitials(request.customerName || 'U')}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-white text-sm truncate">{request.customerName}</span>
                                                            {request.customerPhone && (
                                                                <span className="text-gray-400 text-xs truncate">{request.customerPhone}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={request.avatar}
                                                            alt={request.carName}
                                                            className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0"
                                                        />
                                                        <span className="text-white font-medium text-sm">{request.carName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{new Date(request.pickupDate).toLocaleDateString()}</span>
                                                        <span className="text-gray-400 text-xs">{request.pickupTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{new Date(request.returnDate).toLocaleDateString()}</span>
                                                        <span className="text-gray-400 text-xs">{request.returnTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-semibold text-sm">
                                                        {calculateRequestTotalPrice(request).toLocaleString()} MDL
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${request.status === 'PENDING'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : request.status === 'APPROVED'
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                            }`}
                                                    >
                                                        {request.status === 'PENDING' ? t('admin.status.pending') : 
                                                         request.status === 'APPROVED' ? t('admin.status.approved') : 
                                                         request.status === 'REJECTED' ? t('admin.status.rejected') : 
                                                         request.status === 'EXECUTED' ? 'Început' : 
                                                         request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {searchQuery ? t('admin.requests.noRequests') : t('admin.requests.noRequests')}
                    </div>
                )}
            </div>

            {/* Add Rental Modal */}
            {showAddRentalModal && (
                <CreateRentalModal
                    cars={cars}
                    initialCarId={selectedCarIdForRental}
                    onSave={async (rentalData) => {
                        try {
                            const result = await createBorrowRequest(
                                rentalData.carId || '',
                                rentalData.pickupDate || '',
                                rentalData.pickupTime || '',
                                rentalData.returnDate || '',
                                rentalData.returnTime || '',
                                rentalData.customerName || '',
                                rentalData.customerFirstName || '',
                                rentalData.customerLastName || '',
                                rentalData.customerEmail || '',
                                rentalData.customerPhone || '',
                                rentalData.customerAge ? String(rentalData.customerAge) : undefined,
                                (rentalData as any).comment,
                                (rentalData as any).options,
                                rentalData.amount
                            );
                            if (result.success) {
                                showSuccess('Request created successfully!');
                                setShowAddRentalModal(false);
                                setSelectedCarIdForRental(undefined);
                                await loadRequests();
                            } else {
                                showError(`Failed to create request: ${result.error || 'Unknown error'}`);
                            }
                        } catch (error) {
                            console.error('Error creating request:', error);
                            showError('An error occurred while creating the request.');
                        }
                    }}
                    onClose={() => {
                        setShowAddRentalModal(false);
                        setSelectedCarIdForRental(undefined);
                    }}
                />
            )}

            {/* Request Details Modal */}
            {showRequestDetailsModal && selectedRequest && (
                <RequestDetailsModal
                    cars={cars}
                    request={selectedRequest}
                    onClose={() => {
                        setShowRequestDetailsModal(false);
                        setSelectedRequest(null);
                    }}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onUndoReject={handleUndoReject}
                    onSetToPending={handleSetToPending}
                    onEdit={handleEdit}
                    onStartRental={handleStartRental}
                    onCancelRental={handleCancelRental}
                    isProcessing={processingRequest === selectedRequest.id.toString()}
                />
            )}

            {/* Contract Creation Modal */}
            {showContractModal && selectedRentalForContract && (() => {
                const car = cars.find(c => c.id.toString() === selectedRentalForContract.carId);
                return car ? (
                    <ContractCreationModal
                        isOpen={showContractModal}
                        onClose={() => {
                            setShowContractModal(false);
                            setSelectedRentalForContract(null);
                        }}
                        order={selectedRentalForContract as any}
                        car={car}
                        onContractCreated={async () => {
                            setShowContractModal(false);
                            setSelectedRentalForContract(null);
                            await loadRequests();
                        }}
                    />
                ) : null;
            })()}

            {/* Edit Request Modal */}
            {showEditModal && editingRequest && (
                <EditRequestModal
                    cars={cars}
                    request={editingRequest}
                    onSave={async (updatedData) => {
                        try {
                            const result = await updateBorrowRequest(editingRequest.id.toString(), updatedData);
                            if (result.success) {
                                alert(t('admin.requests.requestUpdated'));
                                setShowEditModal(false);
                                setEditingRequest(null);
                                await loadRequests();
                            } else {
                                alert(`${t('admin.requests.requestUpdateFailed')} ${result.error}`);
                            }
                        } catch (error) {
                            console.error('Error updating request:', error);
                            alert(t('admin.requests.requestUpdateErrorOccurred'));
                        }
                    }}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingRequest(null);
                    }}
                />
            )}
        </motion.div>
    );
};
