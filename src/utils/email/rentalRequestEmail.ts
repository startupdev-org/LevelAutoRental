import emailjs from '@emailjs/browser';

interface RentalRequestEmailParams {
    carName: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    duration: string;
    firstName: string;
    lastName: string;
    age: string;
    phone: string;
    email: string;
    options: Array<{ label: string; value: string }>;
    comment: string;
    pricePerDay: string;
    totalPrice: string;
}

export const sendRentalRequestEmail = async (params: RentalRequestEmailParams): Promise<void> => {
    try {
        // Initialize EmailJS if not already initialized
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
        
        if (publicKey && emailjs) {
            emailjs.init(publicKey);
        }

        // Check if EmailJS is available
        if (!emailjs) {
            throw new Error('EmailJS not loaded');
        }

        // Format options as HTML for email template
        // IMPORTANT: In EmailJS template, change {{optiuni_text}} to {{{optiuni_text}}} (triple braces)
        // This allows HTML to render instead of being escaped as plain text
        const optiuniText = params.options.length > 0
            ? params.options.map(o => `<div style="margin-bottom: 8px;"><strong>${o.label}:</strong> ${o.value}</div>`).join('')
            : '<div>Niciun serviciu suplimentar selectat</div>';

        // Prepare template parameters matching the EmailJS template variables
        const templateParams: any = {
            car_name: params.carName,
            durata: params.duration,
            data_preluare: params.pickupDate,
            ora_preluare: params.pickupTime,
            data_returnare: params.returnDate,
            ora_returnare: params.returnTime,
            prenume: params.firstName,
            nume: params.lastName,
            varsta: params.age,
            telefon: params.phone,
            email: params.email,
            optiuni_text: optiuniText, // Pass as HTML string for {{optiuni_text}}
            comentariu: params.comment || 'Nu a fost adăugat niciun comentariu.',
            pret_zi: params.pricePerDay,
            total: params.totalPrice,
        };

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_ku8aes8';
        const templateId = import.meta.env.VITE_EMAILJS_RENTAL_REQUEST_TEMPLATE_ID || 'template_wh4bg9s';

        // Send email using EmailJS
        await emailjs.send(
            serviceId,
            templateId,
            templateParams
        );

    } catch (error: any) {
        console.error('Error sending rental request email:', error);
        console.error('Error details:', {
            message: error?.message,
            text: error?.text,
            status: error?.status,
            response: error?.response
        });
        // Don't throw error - email failure shouldn't block the request submission
        // Just log it for debugging
    }
};

