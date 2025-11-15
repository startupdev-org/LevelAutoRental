import { jsPDF } from 'jspdf';
import { Rental, BorrowRequest, OrderDisplay } from './orders';
import { Car } from '../types';

interface ContractData {
  contractNumber: string;
  contractDate: string;
  rental: Rental | BorrowRequest;
  car: Car;
  customer: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    idNumber?: string; // IDNP or passport number
    idSeries?: string; // ID series
  };
  rentalDetails: {
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    pickupLocation: string;
    returnLocation: string;
    pricePerDay: number;
    numberOfDays: number;
    subtotal: number;
    discount?: number;
    total: number;
    deposit: number;
    paymentMethod?: string;
    paymentDate?: string;
  };
  additionalDrivers?: Array<{
    firstName: string;
    lastName: string;
    idnp?: string;
  }>;
  vehicleDetails?: {
    mileage?: number;
    fuelLevel?: number;
    registrationNumber?: string;
    carValue?: number; // For total loss clause
  };
}

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    // Try to load from public folder
    const publicUrl = url.startsWith('/') ? url : `/${url}`;
    img.src = publicUrl;
  });
};

// Helper function to convert Romanian diacritics to ASCII-compatible characters
// jsPDF standard fonts don't support Romanian diacritics, so we need to use ASCII equivalents
const convertRomanianToASCII = (text: string): string => {
  const replacements: { [key: string]: string } = {
    'ă': 'a', 'Ă': 'A',
    'â': 'a', 'Â': 'A',
    'î': 'i', 'Î': 'I',
    'ș': 's', 'Ș': 'S',
    'ț': 't', 'Ț': 'T',
    'ţ': 't', 'Ţ': 'T'
  };
  
  return text.replace(/[ăĂâÂîÎșȘțȚţŢ]/g, char => replacements[char] || char);
};

// Format date to Romanian format (DD.MM.YYYY)
const formatDateRO = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Format time to HH:MM
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  // Handle formats like "08:00 AM" or "08:00"
  const time = timeString.replace(/\s*(AM|PM)\s*/i, '');
  return time;
};

// Helper function to check if we need a new page before adding content
// Footer is at pageHeight - 10, so we reserve space from pageHeight - 20
const checkPageBreak = (doc: any, y: number, pageHeight: number, margin: number, currentPage: number, pageWidth: number): { y: number; currentPage: number } => {
  // Reserve space for footer (footer is at pageHeight - 10, so we stop at pageHeight - 20)
  const footerReservedSpace = 20;
  if (y > pageHeight - footerReservedSpace) {
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);
    currentPage++;
    doc.addPage();
    y = margin;
  }
  return { y, currentPage };
};

// Helper function to add footer to each page
// Footer is positioned at pageHeight - 10, so we need to ensure content doesn't overlap
const addPageFooter = (doc: any, pageNumber: number, pageWidth: number, pageHeight: number, margin: number) => {
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('LEVEL AUTO RENTAL S.R.L.', margin, pageHeight - 10);
  doc.text('+373 62-000-112', pageWidth - margin, pageHeight - 10, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(pageNumber.toString(), pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.setTextColor(0); // Reset color for next page
};

export const generateContractPDF = async (data: ContractData) => {
  try {
    console.log('Starting contract PDF generation for:', data.contractNumber);
    console.log('Contract data:', data);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page setup
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let currentPage = 1;

    // Header design - logo on left, info right-aligned
    const headerTopY = 10;
    
    // Load and add company logo - on left, positioned higher
    let logoLoaded = false;
    const logoWidth = 25;
    const logoHeight = 23;
    try {
      const logoBase64 = await loadImageAsBase64('/LevelAutoRental/logo-LVL.png');
      const logoX = margin;
      const logoY = headerTopY; // Logo starts at top
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      logoLoaded = true;
    } catch (error) {
      console.error('Failed to load logo:', error);
      logoLoaded = false;
    }

    // Company information - positioned lower, right-aligned block
    const infoX = pageWidth - margin;
    
    // Calculate text block height
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    const companyName = 'LEVEL AUTO RENTAL S.R.L.';
    const companyNameHeight = 11 * 0.35; // Approximate line height
    
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    const lineHeight = 8 * 0.35; // Approximate line height for smaller text
    const totalTextHeight = companyNameHeight + (lineHeight * 2); // Company name + 2 lines
    
    // Start text block - positioned between center and bottom of logo
    const logoCenterY = headerTopY + logoHeight / 2;
    const infoStartY = logoCenterY - (totalTextHeight / 2) + 3; // Slightly lower than center
    
    // Company name
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    const companyNameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, infoX - companyNameWidth, infoStartY);
    
    // Address info - left-aligned within right block
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    const addressText = convertRomanianToASCII('Republica Moldova, mun. Chișinău, or. Chișinău');
    const addressWidth = doc.getTextWidth(addressText);
    doc.text(addressText, infoX - addressWidth, infoStartY + companyNameHeight + 2);
    const telText = 'Tel: +373 62-000-112';
    const telWidth = doc.getTextWidth(telText);
    doc.text(telText, infoX - telWidth, infoStartY + companyNameHeight + lineHeight + 4);
    doc.setTextColor(0, 0, 0);

    // Horizontal Line - below company info and logo, with proper spacing
    const textBlockBottom = infoStartY + totalTextHeight;
    const maxContentBottom = Math.max(headerTopY + logoHeight, textBlockBottom);
    const lineY = maxContentBottom + 5; // Add 5mm spacing below content
    doc.setLineWidth(0.5);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    // Contract Title - centered with spacing
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    const contractTitleY = lineY + 12;
    doc.text(convertRomanianToASCII('CONTRACT DE LOCATIUNE'), pageWidth / 2, contractTitleY, { align: 'center' });
    
    // Contract Number and Date - centered
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    let y = contractTitleY + 8;
    const contractNumberText = convertRomanianToASCII(`Nr. ${data.contractNumber} din ${formatDateRO(data.contractDate)}`);
    const contractNumberWidth = doc.getTextWidth(contractNumberText);
    doc.text(contractNumberText, (pageWidth - contractNumberWidth) / 2, y);
    y += 8;

    // Horizontal Line
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Parties Section
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('PARTILE'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    const partyText1 = convertRomanianToASCII('Compania LEVEL AUTO RENTAL S.R.L., cu sediul in Republica Moldova, mun. Chisinau, or. Chisinau,');
    const partyText2 = convertRomanianToASCII('str. Mircea cel Batran 13/1, cod fiscal 1024606013124, (denumita in continuare "Locator"), reprezentata de Levițchi');
    const partyText3 = convertRomanianToASCII('Victorin, in calitate de administrator, care actioneaza in baza statutului, pe de o parte,');
    
    doc.text(partyText1, margin, y);
    y += 5;
    doc.text(partyText2, margin, y);
    y += 5;
    doc.text(partyText3, margin, y);
    y += 6;

    doc.text(convertRomanianToASCII('Si'), margin, y);
    y += 5;
    doc.setFont('times', 'bold');
    doc.text(convertRomanianToASCII(data.customer.fullName || '______________________________'), margin, y);
    doc.setFont('times', 'normal');
    y += 5;
    doc.text(convertRomanianToASCII(`domiciliat la ${data.customer.address || '__________________________________________'},`), margin, y);
    y += 5;
    const idText = convertRomanianToASCII(`posesor al buletinului de identitate/pasaportului cu Seria si Numarul ${data.customer.idSeries || '________________'}, IDNP`);
    doc.text(idText, margin, y);
    y += 5;
    doc.text(convertRomanianToASCII(`${data.customer.idNumber || '_________________________'}, (denumit in continuare "Locatar"), pe de alta parte, au convenit sa incheie prezentul`), margin, y);
    y += 5;
    doc.text(convertRomanianToASCII('Contract de locatiune in urmatoarele conditii:'), margin, y);
    y += 8;

    // Horizontal Line
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Section I: OBJECT OF CONTRACT
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('I. OBIECTUL CONTRACTULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    // Helper function to add text with bold formatting for key terms and point numbers
    const addTextWithBreakSection1 = (text: string, spacing: number = 5) => {
      const textCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
      y = textCheck.y;
      currentPage = textCheck.currentPage;
      
      const normalizedText = convertRomanianToASCII(text);
      
      // Pattern to match point numbers (e.g., 5.1, 6.1.1, 11.1.20)
      const pointPattern = /\d+\.\d+(?:\.\d+)?/g;
      // Key terms to make bold (case insensitive)
      const keyTerms = ['Locator', 'Locatar', 'autovehicul', 'Contract', 'Anexa', 'Locatorului', 'Locatarului', 'Autovehiculului', 'Contractului', 'Anexei'];
      
      // Build segments array with bold flags
      const segments: Array<{text: string, isBold: boolean}> = [];
      let lastIndex = 0;
      
      // Find all point numbers and key terms
      const allMatches: Array<{index: number, length: number, isBold: boolean}> = [];
      
      // Find point numbers
      let match;
      while ((match = pointPattern.exec(normalizedText)) !== null) {
        allMatches.push({index: match.index, length: match[0].length, isBold: true});
      }
      
      // Find key terms
      for (const term of keyTerms) {
        const termPattern = new RegExp(`\\b${term}\\b`, 'gi');
        let termMatch;
        while ((termMatch = termPattern.exec(normalizedText)) !== null) {
          allMatches.push({index: termMatch.index, length: termMatch[0].length, isBold: true});
        }
      }
      
      // Sort matches by index
      allMatches.sort((a, b) => a.index - b.index);
      
      // Remove overlapping matches (keep first)
      const nonOverlapping: Array<{index: number, length: number, isBold: boolean}> = [];
      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        let overlaps = false;
        for (const existing of nonOverlapping) {
          if (current.index < existing.index + existing.length && current.index + current.length > existing.index) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          nonOverlapping.push(current);
        }
      }
      
      // Build segments
      for (const match of nonOverlapping) {
        if (match.index > lastIndex) {
          segments.push({text: normalizedText.substring(lastIndex, match.index), isBold: false});
        }
        segments.push({text: normalizedText.substring(match.index, match.index + match.length), isBold: true});
        lastIndex = match.index + match.length;
      }
      
      if (lastIndex < normalizedText.length) {
        segments.push({text: normalizedText.substring(lastIndex), isBold: false});
      }
      
      // If no segments (no matches), add whole text
      if (segments.length === 0) {
        doc.setFont('times', 'normal');
        doc.text(normalizedText, margin, y);
      } else {
        // Draw segments with appropriate formatting
        let xPos = margin;
        for (const segment of segments) {
          doc.setFont('times', segment.isBold ? 'bold' : 'normal');
          doc.text(segment.text, xPos, y);
          xPos += doc.getTextWidth(segment.text);
        }
      }
      
      // Reset font to normal
      doc.setFont('times', 'normal');
      y += spacing;
    };
    
    addTextWithBreakSection1('1.1 Locatorul da in folosinta, iar Locatarul primeste in folosinta autovehiculul descris');
    addTextWithBreakSection1('in pct. 1.2 din prezentul contract (denumit in continuare "autovehicul"), in schimbul');
    addTextWithBreakSection1('achitarii de catre Locatar a pretului, in conditiile Capitolului V al prezentului contract.', 6);
    addTextWithBreakSection1('1.2 Autovehiculul inchiriat are urmatoarele caracteristici:', 6);

    // Vehicle details table
    const vehicleInfo = [
      ['MARCA:', convertRomanianToASCII(data.car.make || '')],
      ['MODEL:', convertRomanianToASCII(data.car.model || '')],
      ['CULOARE:', ''],
      [convertRomanianToASCII('NR. DE INMATRICULARE:'), data.vehicleDetails?.registrationNumber || ''],
      ['NR/KM LA BORD:', data.vehicleDetails?.mileage?.toString() || ''],
      ['AN FABRICATIE:', data.car.year.toString()],
      ['COMBUSTIBIL:', convertRomanianToASCII(data.car.fuel_type === 'gasoline' ? 'Benzina' : data.car.fuel_type === 'diesel' ? 'Motorina' : data.car.fuel_type || '')]
    ];

    // Check if we need a new page before adding table
    const tableCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = tableCheck.y;
    currentPage = tableCheck.currentPage;

    // Create table
    const vehicleTableStartY = y;
    const vehicleRowHeight = 7;
    const vehicleLabelColWidth = 60; // Label column
    const vehicleValueColWidth = 100; // Value column
    const vehicleTableEndX = margin + vehicleLabelColWidth + vehicleValueColWidth;
    const vehicleTableRows = vehicleInfo.length;

    // Draw table borders
    doc.line(margin, vehicleTableStartY, margin, vehicleTableStartY + (vehicleRowHeight * vehicleTableRows)); // Left
    doc.line(margin + vehicleLabelColWidth, vehicleTableStartY, margin + vehicleLabelColWidth, vehicleTableStartY + (vehicleRowHeight * vehicleTableRows)); // Middle
    doc.line(vehicleTableEndX, vehicleTableStartY, vehicleTableEndX, vehicleTableStartY + (vehicleRowHeight * vehicleTableRows)); // Right
    doc.line(margin, vehicleTableStartY, vehicleTableEndX, vehicleTableStartY); // Top
    for (let i = 1; i <= vehicleTableRows; i++) {
      doc.line(margin, vehicleTableStartY + (vehicleRowHeight * i), vehicleTableEndX, vehicleTableStartY + (vehicleRowHeight * i)); // Row separators
    }
    doc.line(margin, vehicleTableStartY + (vehicleRowHeight * vehicleTableRows), vehicleTableEndX, vehicleTableStartY + (vehicleRowHeight * vehicleTableRows)); // Bottom

    // Fill table with data
    vehicleInfo.forEach(([label, value], idx) => {
      const rowY = vehicleTableStartY + (idx * vehicleRowHeight);
      
      // Label in left column
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.text(label, margin + 2, rowY + vehicleRowHeight / 2 + 2);
      
      // Value in right column
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(value || '', margin + vehicleLabelColWidth + 2, rowY + vehicleRowHeight / 2 + 2);
    });

    y = vehicleTableStartY + (vehicleRowHeight * vehicleTableRows) + 6;

    // Horizontal Line
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Check if we need a new page before continuing
    const check = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = check.y;
    currentPage = check.currentPage;
    
    // Add footer to page 1
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // PAGE 2: DURATION, DRIVERS, ADVANCE
    // ============================================
    if (y < margin + 20) {
      y = margin;
    }

    // Section II: DURATION
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('II. DURATA CONTRACTULUI', margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    // Check page break before adding text
    let pageCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = pageCheck.y;
    currentPage = pageCheck.currentPage;
    
    // Helper function for section II
    const addTextWithBreakSection2 = (text: string, spacing: number = 5) => {
      const textCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
      y = textCheck.y;
      currentPage = textCheck.currentPage;
      
      const normalizedText = convertRomanianToASCII(text);
      
      // Pattern to match point numbers
      const pointPattern = /\d+\.\d+(?:\.\d+)?/g;
      const keyTerms = ['Locator', 'Locatar', 'autovehicul', 'Contract', 'Anexa', 'Locatorului', 'Locatarului', 'Autovehiculului', 'Contractului', 'Anexei'];
      
      const segments: Array<{text: string, isBold: boolean}> = [];
      let lastIndex = 0;
      const allMatches: Array<{index: number, length: number, isBold: boolean}> = [];
      
      let match;
      while ((match = pointPattern.exec(normalizedText)) !== null) {
        allMatches.push({index: match.index, length: match[0].length, isBold: true});
      }
      
      for (const term of keyTerms) {
        const termPattern = new RegExp(`\\b${term}\\b`, 'gi');
        let termMatch;
        while ((termMatch = termPattern.exec(normalizedText)) !== null) {
          allMatches.push({index: termMatch.index, length: termMatch[0].length, isBold: true});
        }
      }
      
      allMatches.sort((a, b) => a.index - b.index);
      const nonOverlapping: Array<{index: number, length: number, isBold: boolean}> = [];
      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        let overlaps = false;
        for (const existing of nonOverlapping) {
          if (current.index < existing.index + existing.length && current.index + current.length > existing.index) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          nonOverlapping.push(current);
        }
      }
      
      for (const match of nonOverlapping) {
        if (match.index > lastIndex) {
          segments.push({text: normalizedText.substring(lastIndex, match.index), isBold: false});
        }
        segments.push({text: normalizedText.substring(match.index, match.index + match.length), isBold: true});
        lastIndex = match.index + match.length;
      }
      
      if (lastIndex < normalizedText.length) {
        segments.push({text: normalizedText.substring(lastIndex), isBold: false});
      }
      
      if (segments.length === 0) {
        doc.setFont('times', 'normal');
        doc.text(normalizedText, margin, y);
      } else {
        let xPos = margin;
        for (const segment of segments) {
          doc.setFont('times', segment.isBold ? 'bold' : 'normal');
          doc.text(segment.text, xPos, y);
          xPos += doc.getTextWidth(segment.text);
        }
      }
      
      doc.setFont('times', 'normal');
      y += spacing;
    };
    
    addTextWithBreakSection2('2.1 Termenul minim de inchiriere a Bunului este de 2 (doua) zile calendaristice (24 ore).', 5);
    addTextWithBreakSection2('2.2 Termenul contractului poate fi modificat prin acordul partilor.');
    y += 8;
    // Horizontal Line
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Section III: AUTHORIZED DRIVERS
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('III. PERSOANELE CU DREPT DE A CONDUCE AUTOVEHICULUL', margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    // Helper function to add text with bold formatting for key terms and point numbers
    const addTextWithBreak = (text: string, spacing: number = 5) => {
      const textCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
      y = textCheck.y;
      currentPage = textCheck.currentPage;
      
      const normalizedText = convertRomanianToASCII(text);
      
      // Pattern to match point numbers (e.g., 5.1, 6.1.1, 11.1.20)
      const pointPattern = /\d+\.\d+(?:\.\d+)?/g;
      // Key terms to make bold (case insensitive)
      const keyTerms = ['Locator', 'Locatar', 'autovehicul', 'Contract', 'Anexa', 'Locatorului', 'Locatarului', 'Autovehiculului', 'Contractului', 'Anexei'];
      
      // Build segments array with bold flags
      const segments: Array<{text: string, isBold: boolean}> = [];
      let lastIndex = 0;
      
      // Find all point numbers and key terms
      const allMatches: Array<{index: number, length: number, isBold: boolean}> = [];
      
      // Find point numbers
      let match;
      while ((match = pointPattern.exec(normalizedText)) !== null) {
        allMatches.push({index: match.index, length: match[0].length, isBold: true});
      }
      
      // Find key terms
      for (const term of keyTerms) {
        const termPattern = new RegExp(`\\b${term}\\b`, 'gi');
        let termMatch;
        while ((termMatch = termPattern.exec(normalizedText)) !== null) {
          allMatches.push({index: termMatch.index, length: termMatch[0].length, isBold: true});
        }
      }
      
      // Sort matches by index
      allMatches.sort((a, b) => a.index - b.index);
      
      // Remove overlapping matches (keep first)
      const nonOverlapping: Array<{index: number, length: number, isBold: boolean}> = [];
      for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        let overlaps = false;
        for (const existing of nonOverlapping) {
          if (current.index < existing.index + existing.length && current.index + current.length > existing.index) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          nonOverlapping.push(current);
        }
      }
      
      // Build segments
      for (const match of nonOverlapping) {
        if (match.index > lastIndex) {
          segments.push({text: normalizedText.substring(lastIndex, match.index), isBold: false});
        }
        segments.push({text: normalizedText.substring(match.index, match.index + match.length), isBold: true});
        lastIndex = match.index + match.length;
      }
      
      if (lastIndex < normalizedText.length) {
        segments.push({text: normalizedText.substring(lastIndex), isBold: false});
      }
      
      // If no segments (no matches), add whole text
      if (segments.length === 0) {
        doc.setFont('times', 'normal');
        doc.text(normalizedText, margin, y);
      } else {
        // Draw segments with appropriate formatting
        let xPos = margin;
        for (const segment of segments) {
          doc.setFont('times', segment.isBold ? 'bold' : 'normal');
          doc.text(segment.text, xPos, y);
          xPos += doc.getTextWidth(segment.text);
        }
      }
      
      // Reset font to normal
      doc.setFont('times', 'normal');
      y += spacing;
    };
    
    addTextWithBreak('3.1 Autovehiculul poate fi condus in timpul perioadei de inchiriere numai de catre Locatar');
    addTextWithBreak('si/sau persoanele indicate in fisa cu numele conducatorilor auto anexata la contractul');
    addTextWithBreak('de inchiriere - Anexa Nr.1 (in continuare: "soferi aditionali").', 6);
    addTextWithBreak('3.2 Locatarul si/sau soferii aditionali trebuie sa fie apti din punct de vedere fizic si');
    addTextWithBreak('psihologic sa conduca autovehiculul.', 6);
    addTextWithBreak('3.3 Partile convin ca Locatarul si/sau soferii aditionali trebuie sa aiba varsta cuprinsa');
    addTextWithBreak('intre 20 si 65 de ani.', 6);
    addTextWithBreak('3.4 Locatarul si/sau soferii aditionali trebuie sa detina permis de conducere corespunzator');
    addTextWithBreak('tipului de autovehicul si sa fie valabil pentru o perioada neintrerupta de cel putin 24 luni,');
    addTextWithBreak('acesta fiind suspendat, retras, ridicat sau impus oricaror altor interdictii asupra');
    addTextWithBreak('dreptului de conducere a autovehiculului.', 6);
    addTextWithBreak('3.5 Soferii aditionali au aceleasi obligatii ca si Locatarul, ultimul fiind obligat sa-i');
    addTextWithBreak('informeze despre acestea si sa raspunda pentru neexecutarea lor.');
    y += 8;
    // Horizontal Line
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Check page break before continuing
    const sectionCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionCheck.y;
    currentPage = sectionCheck.currentPage;
    
    // Add footer to current page
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // Section IV: ADVANCE
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('IV. AVANS', margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    // Use helper function for all text additions
    addTextWithBreak('4.1. In ziua incheierii Contractului, Locatarul achita Locatorului un avans in suma de');
    addTextWithBreak('20% din pretul locatiunii. Achitarea avansului de catre Locatar confirma obligatia');
    addTextWithBreak('Locatorului de a rezerva Autovehiculul stipulat in Contract pentru predarea in locatiunea');
    addTextWithBreak('Locatarului, in ziua indicata in Contract;', 6);
    addTextWithBreak('4.2. Locatarul este obligat sa achite catre Locator toate sumele stabilite conform');
    addTextWithBreak('Contractului (pretul locatiunii, garantie) in termen de 1 zi pana la data predarii in');
    addTextWithBreak('folosinta a Autovehiculului;', 6);
    addTextWithBreak('4.3. In cazul neachitarii sumelor nominalizate in volum intreg, in termenul indicat,');
    addTextWithBreak('Contractul incheiat intre Parti se considera reziliat in mod automat, fara necesitatea');
    addTextWithBreak('expedierii notificarilor privind rezilierea Contractului in adresa Partilor. In acest caz,');
    addTextWithBreak('Locatorul este exonerat de obligatia predarii Autovehiculului in folosinta Locatarului,');
    addTextWithBreak('iar suma avansului achitata de catre Locatar nu se restituie Locatarului, fiind retinuta');
    addTextWithBreak('de catre Locator in folosul sau cu titlu de compensare a prejudiciului pricinuit/venitului ratat.');
    y += 8;
    // Horizontal Line
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Add footer to current page
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION V: PREȚUL CONTRACTULUI
    // ============================================
    // Check page break before starting new section
    const sectionVCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionVCheck.y;
    currentPage = sectionVCheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('V. PRETUL CONTRACTULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('5.1 Locatarul va plati Locatorului pentru inchirierea autovehiculului suma specificata in Anexa Nr.1 la momentul');
    addTextWithBreak('incheierii contractului.', 6);
    addTextWithBreak('5.2 Metodele de achitare a serviciilor acceptate de catre Locator sunt: prin card bancar, transfer bancar sau cash.', 6);
    addTextWithBreak('5.3 Locatarul este obligat sa achite Locatorului garantia pana la data predarii in locatiune a Autovehiculului sau in ziua');
    addTextWithBreak('predarii autovehiculului, conform Contractului incheiat, si anume:');
    addTextWithBreak('Locatarul se obliga sa constituie o garantie in valoare de ______________ MDL pentru toata perioada de inchiriere.', 6);
    addTextWithBreak('5.4 Garantia depusa de catre Locatar, se pastreaza pe intreaga durata a locatiunii si nu se considera ca si plata a');
    addTextWithBreak('pretului locatiunii pentru perioada respectiva. Aceasta se restituie Locatarului dupa expirarea duratei locatiunii, in');
    addTextWithBreak('cazul indeplinirii obligatiilor Locatarului stipulate conform prezentului Contract si achitarii de catre Locatar in');
    addTextWithBreak('folosul Locatorului, a tuturor sumelor/platiilor, prevazute de prezentul Contract in legatura cu locatiunea');
    addTextWithBreak('Autovehiculului;', 6);
    addTextWithBreak('5.5 In cazul in care nu se achita pretul locatiunii in termenul indicat in pct. 5.3, Locatarul este obligat sa achite');
    addTextWithBreak('Locatorului o penalitate in marime de 0.1% din suma datoriei neachitate la timp pentru fiecare zi de intarziere;', 6);
    addTextWithBreak('5.6 Pretul contractului NU include penalitatile aplicabile la Capitolul VI, precum si urmatoarele sume suplimentare');
    addTextWithBreak('aplicabile la sfarsitul termenului de inchiriere:', 6);
    addTextWithBreak('5.6.1 taxa pentru combustibilul utilizat in caz de returnare a autovehiculului fara rezervorul plin, pretul fiind');
    addTextWithBreak('calculat la tariful aplicabil in ziua returnarii autovehiculului, conform facturii emise de statia de alimentare;', 6);
    addTextWithBreak('5.6.2 taxa de 4 MDL pentru fiecare km parcurs in plus, daca Locatarul intrece limita de 200 km/zi', 6);
    addTextWithBreak('5.6.3 taxa de 250 MDL in cazul in care autovehiculul este returnat intr-o conditie care necesita o curatare');
    addTextWithBreak('exterioara si interioara la spalatorie;', 6);
    addTextWithBreak('5.6.4 taxa de 500 MDL pentru curatarea autovehiculului in cazul in care acesta este returnat intr-o stare murdara,');
    addTextWithBreak('aceasta include, dar fara a se limita la: scurgerile de lichide, alimente, voma si alte pete si mirosuri neplacute.');
    addTextWithBreak('Lipsa "Starii murdare" se poate interpreta si tinand cont daca, in functie de circumstantele de fapt, un eventual');
    addTextWithBreak('client ar putea sa foloseasca autovehiculul in starea in care se afla, fara a-i fi creata o stare de dezgust sau');
    addTextWithBreak('disconfort;', 6);
    addTextWithBreak('5.6.5 taxa de 1000 MDL pentru curatarea autovehiculului si eliminarea mirosului de fum in cazul in care se');
    addTextWithBreak('constata ca s-a fumat in autovehicul;', 6);
    addTextWithBreak('5.6.6 taxele in caz de nerespectare a punctelor de la Capitolul V.', 6);
    addTextWithBreak('5.6.7 taxa de 3000 MDL in caz de evacuare a autovehiculului din cauza nerespectarii obligatiilor de catre');
    addTextWithBreak('Locatar; Aceasta taxa nu elibereaza Locatarul de plata amenzilor stabilite de organele de drept, precum si de');
    addTextWithBreak('plata chiriei pentru toata perioada pina cand autovehiculul nu va fi restituit Locatorului;', 6);
    addTextWithBreak('5.6.8 taxele de utilizare a drumurilor (viniete sau alte tipuri de taxe a drumurilor), in cazul iesirii peste hotarele');
    addTextWithBreak('Republicii Moldova. Iesirea peste hotarele Republicii Moldova poate avea loc doar cu acordul scris al');
    addTextWithBreak('Locatorului.', 6);
    addTextWithBreak('5.6.9 plati pentru deteriorarea sau repararea autovehiculului si a accesoriilor acestuia, in conditiile mentionate de');
    addTextWithBreak('prezentul Contract; precum si orice alte plati pentru acoperirea costului reparatiilor aferente, valoarea platilor');
    addTextWithBreak('fiind stabilite de Locator.', 6);
    addTextWithBreak('5.7 Locatorul va incasa sumele stabilite la punctele 5.1 si 5.3 de mai sus din contul Locatarului dupa momentul');
    addTextWithBreak('semnarii contractului sau Locatarul poate plati aceste taxe in modul convenit cu Locatorul, conform punctului 5.2 si');
    addTextWithBreak('Anexei Nr.1.');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION VI: DREPTURILE, OBLIGAȚIILE ȘI RĂSPUNDEREA LOCATARULUI
    // ============================================
    // Check page break before starting new section
    const sectionVICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionVICheck.y;
    currentPage = sectionVICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('VI. DREPTURILE, OBLIGATIILE SI RASPUNDEREA LOCATARULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('6.1 Locatarul nu are dreptul sa:', 6);
    addTextWithBreak('6.1.1 conduca sau sa permita conducerea autovehiculului cu viteza mai mare de 130 km/h; in caz contrar se aplica');
    addTextWithBreak('penalitate de 2000 MDL;', 6);
    addTextWithBreak('6.1.2 conduca sau sa permita conducerea autovehiculului mai mult de 200 km/zi.', 6);
    addTextWithBreak('6.1.3 conduca sau sa permita conducerea autovehiculului de catre orice persoana, in cazul in care la momentul');
    addTextWithBreak('conducerii autovehiculului, conducatorul auto nu detine permis auto pentru tipul respectiv de vehicul; in caz');
    addTextWithBreak('opus, se va incasa de la Locatar o penalitate de 10 000 MDL;', 6);
    addTextWithBreak('6.1.4 permita conducerea autovehiculului de catre orice persoana care nu este specificata sau descrisa in prezentul');
    addTextWithBreak('Contract sau in Anexa Nr.1; in caz contrar se aplica penalitate de 2000 MDL;', 6);
    addTextWithBreak('6.1.5 permita utilizarea autovehiculului in afara teritoriilor agreate cu Locatorul;', 6);
    addTextWithBreak('6.1.6 subinchirieze sau inchirieze autovehiculul oricarei altei persoane; in caz contrar se aplica penalitate');
    addTextWithBreak('de 2000 MDL;', 6);
    addTextWithBreak('6.1.7 exploateze sau sa permita exploatarea autovehiculului pentru transportul de pasageri prin inchiriere sau');
    addTextWithBreak('contra cost; in caz contrar se aplica penalitate de 2000 MDL;', 6);
    addTextWithBreak('6.1.8 transporte animale in autovehicul;', 6);
    addTextWithBreak('6.1.9 fumeze sau sa permita oricarei alte persoane sa fumeze in autovehicul;', 6);
    addTextWithBreak('6.1.10 utilizeze autovehiculul sau sa permita utilizarea acestuia la savarsirea infractiunilor, contraventiilor sau');
    addTextWithBreak('implicarea acestuia in orice activitate ilicita; in caz contrar se aplica penalitate de 10 000 MDL;', 6);
    addTextWithBreak('6.1.11 exploateze sau sa permita exploatarea autovehiculului pentru transportul mai multor pasageri sau marfuri');
    addTextWithBreak('decat oricare din maximul specificat in certificatul de inmatriculare; in caz contrar se aplica penalitate');
    addTextWithBreak('de 2000 MDL;', 6);
    addTextWithBreak('6.1.12 conduca sau sa permita conducerea autovehiculului pe orice drum sau suprafata care favorizeaza uzura');
    addTextWithBreak('anticipata sau deteriorarea autovehiculului sau prin conducerea autovehiculului cu o viteza si mod de deplasare');
    addTextWithBreak('care favorizeaza deteriorarea autovehiculului;', 6);
    addTextWithBreak('6.1.13 exploateze autovehiculul sau sa permita exploatarea acestuia in orice cursa, test de viteza, studiu de');
    addTextWithBreak('fiabilitate, raliu sau concurs, sau exploatarea pe orice circuit de curse sau raliu sau in calitate de simulator sau in');
    addTextWithBreak('pregatirile pentru oricare dintre aceste activitati, la fel ca si in executarea burnout-ului si derapajul controlabil; in');
    addTextWithBreak('caz contrar se aplica penalitate de 10 000 MDL;', 6);
    addTextWithBreak('6.1.14 sa utilizeze automobilul in calitate de TAXI sau pentru instructaj auto; in caz contrar se aplica penalitate');
    addTextWithBreak('de 2000 MDL;', 6);
    addTextWithBreak('6.1.15 exploateze sau sa permita exploatarea autovehiculului pentru a propulsa, tracta orice alt vehicul sau pentru');
    addTextWithBreak('orice actiuni pentru care autovehiculul nu a fost proiectat; in caz contrar se aplica penalitate de 2000 MDL;', 6);
    addTextWithBreak('6.1.16 desfasoare orice alte activitati cu utilizarea autovehiculului sau in raport cu el, care potrivit contractului in');
    addTextWithBreak('cauza, legislatiei in vigoare, uzantelor, ordinii publice si bunele moravuri, nu se prezuma, nu sunt agreate, nu sunt');
    addTextWithBreak('permise, sunt interzise sau sunt sancționate;', 6);
    addTextWithBreak('6.1.17 desfasoare alte activitati cu utilizarea autovehiculului care nu rezulta din esenta contractului de locatiune si');
    addTextWithBreak('din circumstantele previzibile pentru Locator, fara acordul prealabil al Locatorului;', 6);
    addTextWithBreak('6.2 Locatarul poarta raspundere pentru:', 6);
    addTextWithBreak('6.2.1 orice pierdere sau deteriorare a autovehiculului si a accesoriilor acestuia, cauzate din culpa sa sau a');
    addTextWithBreak('persoanelor carora acesta le-a permis folosinta bunului sau accesul la el. Se prezuma ca exista culpa pana la proba');
    addTextWithBreak('contraria.', 6);
    addTextWithBreak('6.2.2 orice daune de consecinta, pierderi sau costuri suportate de catre Locator, inclusiv costurile de salvare,');
    addTextWithBreak('intarzierea sau pierderea posibilitatii temporare sau totale de a oferi in locatiune autovehiculul si pierderea');
    addTextWithBreak('veniturilor (venitul ratat);', 6);
    addTextWithBreak('6.2.3 orice pierdere sau deteriorare a autovehiculului si a bunurilor unor terte parti, inclusiv, dupa caz, veniturile');
    addTextWithBreak('ratate, aparute in rezultatul locatiunii, daca nu face proba ca acestea sunt datorate Locatorului;', 6);
    addTextWithBreak('6.2.4 orice prejudiciu sau venit ratat cauzat de nerespectarea prevederilor prezentului contract;', 6);
    addTextWithBreak('6.3 Locatarul este obligat sa respecte urmatoarele:', 6);
    addTextWithBreak('6.3.1 furnizarea datelor personale si de contact corecte si a promisiunii de utilizare a acestora in scopul executarii');
    addTextWithBreak('prezentului contract;', 6);
    addTextWithBreak('6.3.2 prezentarea unui card de credit sau debit valid, la cererea Locatorului;', 6);
    addTextWithBreak('6.3.3 luarea tuturor masurilor rezonabile de precautie si securitate in timpul deplasarii;', 6);
    addTextWithBreak('6.3.4 mentinerea nivelului uleiului si lichidului de racire la un nivel normal stabilit de caracteristicile tehnice ale');
    addTextWithBreak('automobilului. In cazul aparitiei unui semnal de avertizare, Locatarul va opri conducerea autovehiculului si va');
    addTextWithBreak('solicita imediat opinia Locatorului, dupa care va urma exact instructiunile date de Locator; in caz contrar se');
    addTextWithBreak('aplica penalitate de 2000 MDL;', 6);
    addTextWithBreak('6.3.5 utilizarea exclusiva a tipului de combustibil specificat la pct.1.2 pentru autovehiculul respectiv, alimentarile');
    addTextWithBreak('fiind facute la statii de alimentare autorizate; in cazul in care autovehiculul este alimentat cu un combustibil');
    addTextWithBreak('necorespunzator (motorina/benzina), Locatorul se obliga sa achite o penalitate in marime de 10 000 MDL;', 6);
    addTextWithBreak('6.3.6 mentinerea presiunii in anvelope la nivelul stabilit de catre producatorul autovehiculului;', 6);
    addTextWithBreak('6.3.7 blocarea sigura a autovehiculului atunci cand acesta nu este in uz si pastrarea cheilor si a certificatului de');
    addTextWithBreak('inmatriculare al autovehiculului inchiriat sub controlul personal al Locatarului sau a persoanelor autorizate');
    addTextWithBreak('conform prevederilor prezentului contract;', 6);
    addTextWithBreak('6.3.8 neadmiterea deschiderii capotei autovehiculului, in caz opus va fi aplicata taxa de 1000 MDL;', 6);
    addTextWithBreak('6.3.9 neadmiterea interventiilor la recorderul de distanta (odometru) sau vitezometrul;', 6);
    addTextWithBreak('6.3.10 neadmiterea interventiei neautorizate in prealabil cu Locatarul asupra la nici o parte a sistemelor de');
    addTextWithBreak('motor, de transmisie, de franare, de suspensie sau de caroseria autovehiculului;', 6);
    addTextWithBreak('6.3.11 in cazul aparitiei unui semnal de avertizare sau daca Locatarul, in baza observatiilor sale sau a unui');
    addTextWithBreak('conducator auto cu cunostinte si aptitudini tehnice suficiente, echivalente experientei sale, poate observa ca');
    addTextWithBreak('autovehiculul prezinta o defectiune sau necesita interventia din partea unui mecanic-auto sau de serviciile unui');
    addTextWithBreak('auto-service, Locatarul va opri conducerea autovehiculului si va solicita imediat opinia Locatorului, dupa care');
    addTextWithBreak('va urma exact instructiunile date de Locator.', 6);
    addTextWithBreak('6.3.12 sa prezinte permisul de conducere;', 6);
    addTextWithBreak('6.3.13 sa participe si sa urmeze procedura de predare-primire a autovehiculului si sa asigure completarea veridica');
    addTextWithBreak('a actului de primire-predare sau sa desemneze o persoana autorizata sau un reprezentant pentru participare la');
    addTextWithBreak('procedura in cauza si completare a actului de primire-predare, in masura in care acest fapt este permis de');
    addTextWithBreak('prezentul contract;', 6);
    addTextWithBreak('6.3.14 folosirea autovehiculului inchiriat doar pe teritoriul Republicii Moldova. Locatarul trebuie sa primeasca');
    addTextWithBreak('acordul Locatorului in caz de plecare in regiunea din stanga Nistrului – Transnistria. In cazul in care Locatarul');
    addTextWithBreak('a primit acordul Locatorului de a pleca cu automobilul peste hotare, intr-o tara anumita, iar locatarul se');
    addTextWithBreak('deplaseaza in alta tara (care nu este indicata in foaia de parcurs), atunci locatarul va achita o penalitate in suma de');
    addTextWithBreak('10 000 (zece mii) lei .Totodata in cazul in care Locatarul pleaca cu automobilul peste hotare, iar la vama este');
    addTextWithBreak('supus controlului, si daca in urma controlului este defectat estetic sau in oricare alt mod automobilul, Locatarul');
    addTextWithBreak('se obliga sa achite integral prejudiciul cauzat.', 6);
    addTextWithBreak('6.3.15 Locatarul si toti conducatorii auto autorizati sa utilizeze acest autovehicul in timpul perioadei de');
    addTextWithBreak('inchiriere, se obliga sa cunoasca si respecte conditiile prezentate in prezentul Contract;');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION VII: OBLIGAȚIILE LOCATORULUI
    // ============================================
    // Check page break before starting new section
    const sectionVIICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionVIICheck.y;
    currentPage = sectionVIICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('VII. OBLIGATIILE LOCATORULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('7.1 Locatorul va pune la dispozitia Locatarului autovehiculul intr-o stare sigura pentru conducere;', 6);
    addTextWithBreak('7.2 Autovehiculul va fi predat Locatarului impreuna cu toate cele necesare: cheie, certificat de inmatriculare,');
    addTextWithBreak('Asigurare RCA, rezervor plin de combustibil, anvelope de iarna (in sezonul rece) si de vara (in sezonul cald) si alte');
    addTextWithBreak('accesorii sau bunuri conform Anexei Nr.2;', 6);
    addTextWithBreak('7.3 Locatorul va asigura completarea veridica a actului de predare-primire a autovehiculului anexat la contract');
    addTextWithBreak('(Anexa Nr.2) in prezenta Locatarului.');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION VIII: REPARAȚII ȘI ACCIDENTE MECANICE
    // ============================================
    // Check page break before starting new section
    const sectionVIIICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionVIIICheck.y;
    currentPage = sectionVIIICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('VIII. REPARATII SI ACCIDENTE MECANICE'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('8.1 in cazul in care autovehiculul este implicat intr-un accident, este deteriorat, distrus sau necesita lucrari de reparatie');
    addTextWithBreak('sau salvare, indiferent de cauza, Locatarul va notifica imediat prin telefon Locatorul despre toate circumstantele.', 6);
    addTextWithBreak('8.2 Locatarul nu va organiza si nu va efectua lucrari de reparatii sau salvare a autovehiculului inchiriat fara');
    addTextWithBreak('autorizarea Locatorului (aceasta include, dar nu se limiteaza la achizitionarea unui pneu de inlocuire);', 6);
    addTextWithBreak('8.3 In cazul in care autovehiculul a fost distrus total sau a fost furat din cauza neatentiei Locatarului, acesta se');
    addTextWithBreak('obliga sa achite suma integrala a autovehiculului in valoare de _________________. Suma va fi achitata in');
    addTextWithBreak('termen de 1 luna.', 6);
    addTextWithBreak('8.4 in cazul in care autovehiculul are nevoie de reparatii sau inlocuire cauzate nemijlocit din vina Locatorului, acesta');
    addTextWithBreak('va furniza un alt autovehicul Locatarului, daca acest fapt nu implica cheltuieli disproportionale ale Locatorului. In');
    addTextWithBreak('caz de nerespectare de catre Locator a obligatiei de inlocuire a autovehiculului, acesta va returna sume achitata in');
    addTextWithBreak('avans de catre Locatar, minus suma datorata Locatorului pentru timpul efectiv al locatiunii pana la notificarea despre');
    addTextWithBreak('inlocuire. Calculul sumei returnate se efectueaza de Locator, pornind de la tarifele aplicate conform contractului de');
    addTextWithBreak('locatiune pentru unitate de timp si echivalentele acestora. Plata se va efectua in termen de 7 zile.');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION IX: RETURNAREA AUTOVEHICULUI
    // ============================================
    // Check page break before starting new section
    const sectionIXCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionIXCheck.y;
    currentPage = sectionIXCheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('IX. RETURNAREA AUTOVEHICULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('9.1 In momentul sau inainte de expirarea termenului de inchiriere, Locatarul va aduce autovehiculul la locul convenit');
    addTextWithBreak('descris in Anexa Nr.1 sau va obtine acordul Locatorului pentru continuarea inchirierii (in acest caz Locatarul va plati');
    addTextWithBreak('pretul de inchiriere suplimentar pentru termenul de inchiriere prelungit).', 6);
    addTextWithBreak('9.2 In cazul in care Locatarul nu solicita nici o extindere a termenului de chirie a autovehiculului, dar returnarea');
    addTextWithBreak('acestuia este intarziata, Locatarul va fi taxat conform Capitolului XIV al prezentului Contract.', 6);
    addTextWithBreak('9.3 Daca Locatarul nu respecta clauza de la pct. 8.1, nu returneaza autovehiculul si nu reactioneaza prompt la');
    addTextWithBreak('solicitarile Locatorului, cel din urma poate raporta cazul la politie si Locatarul va despagubi Locatorul pentru');
    addTextWithBreak('prejudiciile cauzate.', 6);
    addTextWithBreak('9.4 Autovehiculul trebuie sa fie returnat cu rezervorul plin, curat pe exterior si in interior, fara defectiuni mecanice sau');
    addTextWithBreak('deteriorari ale autovehiculului sau ale accesoriilor acestuia. In caz contrar, Locatarul este obligat sa achite penalitatile');
    addTextWithBreak('stipulate in pct. 5.7.');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION X: ASIGURARE
    // ============================================
    // Check page break before starting new section
    const sectionXCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXCheck.y;
    currentPage = sectionXCheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('X. ASIGURARE'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('10.1 Autovehiculul este asigurat, asigurarea fiind operabila in conditiile legii si a prezentului Contract;', 6);
    addTextWithBreak('10.2 Prima de asigurare RCA este inclusa in taxa de inchiriere;', 6);
    addTextWithBreak('10.3 In cazul producerii unui eveniment stipulat in Capitolul XI, si alte deteriorari cauzate din vina Locatarului,');
    addTextWithBreak('acesta se obliga sa achite suma totala de reparatie din cont propriu.');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION XI: EVENIMENTE NEACOPERITE DE ASIGURARE
    // ============================================
    // Check page break before starting new section
    const sectionXICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXICheck.y;
    currentPage = sectionXICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('XI. EVENIMENTE NEACOPERITE DE ASIGURARE'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('11.1 Locatarul cunoaste si accepta ca asigurarea RCA a autovehiculului NU este aplicabila in urmatoarele');
    addTextWithBreak('circumstante:', 6);
    addTextWithBreak('11.1.1 conducerea autovehiculului sub influenta alcoolului sau a oricarui drog;', 6);
    addTextWithBreak('11.1.2 conducerea autovehiculului de catre orice persoana care nu este indicata sau descrisa in Anexa Nr.1ca o');
    addTextWithBreak('persoana autorizata sa conduca;', 6);
    addTextWithBreak('11.1.3 conducerea autovehiculului de catre o persoana fara permis de conducere;', 6);
    addTextWithBreak('11.1.4 deteriorarea sau pierderea autovehiculului de catre Locatar, sau a unui conducator auto desemnat sau o');
    addTextWithBreak('persoana aflata sub autoritatea sau controlul Locatarului, intentionat sau din neglijenta;', 6);
    addTextWithBreak('11.1.5 comiterea unui delict in domeniul circulatiei rutiere sau delicte cu caracter criminal prevazute de legem cu');
    addTextWithBreak('participarea autovehiculului inchiriat;', 6);
    addTextWithBreak('11.1.6 incarcarea autovehiculului cu depasirea normelor prevazute de specificatiile producatorului;', 6);
    addTextWithBreak('11.1.7 incarcarea sau descarcarea autovehiculului in locuri neautorizate si astfel de incarcare sau descarcare nu');
    addTextWithBreak('este efectuata de catre conducatorul auto sau insotitor al autovehiculului, cu utilizarea accesoriilor autorizate de');
    addTextWithBreak('Locator pentru astfel de incarcaturi;', 6);
    addTextWithBreak('11.1.8 in orice moment in care are loc o defectiune mecanica sau electrica, electronica sau orice defectiune care');
    addTextWithBreak('este rezultatul utilizarii necorespunzatoare a autovehiculului, inclusiv pentru deteriorarea sistemului de motor sau');
    addTextWithBreak('de transmisie care rezulta direct din orice defectiune mecanica, cu exceptia oricarei alte modalitati pentru');
    addTextWithBreak('deteriorarea altor parti ale autovehiculului;', 6);
    addTextWithBreak('11.1.9 conducerea autovehiculului in orice cursa, test de viteza, test de fiabilitate, raliu sau concurs, sau exploatat');
    addTextWithBreak('pe orice circuit de curse sau raliu sau in calitate de simulator sau in cadrul pregatirilor pentru astfel de');
    addTextWithBreak('evenimente;', 6);
    addTextWithBreak('11.1.10 orice moment in care conducatorul auto nu opreste sau paraseste locul accidentului ca urmare a');
    addTextWithBreak('producerii unui accident, contrat prevederilor legale;', 6);
    addTextWithBreak('11.1.11 orice amenda sau sanctiune aplicata ca urmare a incalcarii actelor normative cu utilizarea autovehiculului');
    addTextWithBreak('inchiriat;', 6);
    addTextWithBreak('11.1.12 orice spargere, taiere sau rupere a pneului sau deteriorarea pneurilor prin aplicarea franelor;', 6);
    addTextWithBreak('11.1.13 cazul in care autovehiculul se afla intr-o stare tehnica nepotrivita pentru a fi condus in timpul inchirierii');
    addTextWithBreak('acestuia, care a cauzat sau a contribuit la deteriorarea sau pierderea autovehiculului si Locatarul sau');
    addTextWithBreak('conducatorul auto cunoastea sau ar fi trebuit sa cunoasca despre starea nesigura sau nepotrivita pentru conducerea');
    addTextWithBreak('autovehiculului;', 6);
    addTextWithBreak('11.1.14 orice raspundere pentru daunele cauzate de vibratii sau greutatea vehiculului sau incarcarea acestuia');
    addTextWithBreak('pentru orice pod sau viaduct; orice drum sau orice portiune sub un drum; orice linie de conducte subterane sau');
    addTextWithBreak('cablu; orice alta instalatie subterana;', 6);
    addTextWithBreak('11.1.15 conducerea autovehiculului pe drumuri neamenajate sau pe alte drumuri decat cele pe baza de gudron sau');
    addTextWithBreak('metal, inclusiv, dar fara a se limita la plaje sau drumuri ce ar putea cauza deteriorarea autovehiculului;', 6);
    addTextWithBreak('11.1.16 aspiratia apei la motor;', 6);
    addTextWithBreak('11.1.17 orice deteriorare capitala a autovehiculului sau proprietatii unei terte parti care rezulta din astfel de daune');
    addTextWithBreak('capitale;', 6);
    addTextWithBreak('11.1.18 exploatarea autovehiculului in afara termenului Contractului de locatiune sau oricarei prelungiri');
    addTextWithBreak('convenite a termenului, sau in orice alt moment sau circumstante notificate de catre Locatar Locatorului si');
    addTextWithBreak('aprobate de cel din urma;', 6);
    addTextWithBreak('11.1.19 costul daunei sau deteriorarii autovehiculului produsa ca urmare a deplasarii cu viteza ce depaseste 30');
    addTextWithBreak('km/h fata de viteza regulamentara indicata in regulamentul rutier pe portiunea de drum unde s-a produs');
    addTextWithBreak('accidentul;', 6);
    addTextWithBreak('11.1.20 situatii de furt a autovehiculului, in urma caruia Locatarul nu are posibilitatea si/sau nu poate returna');
    addTextWithBreak('Locatorului cheia autovehiculului inchiriat si certificatul de inmatriculare in original al acestuia;');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION XII: ÎNCĂLCAREA REGULAMENTULUI CIRCULAȚIEI RUTIERE
    // ============================================
    // Check page break before starting new section
    const sectionXIICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXIICheck.y;
    currentPage = sectionXIICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('XII. INCALCAREA REGULAMENTULUI CIRCULATIEI RUTIERE'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('12.1 Toate penalitatile legate de incalcarile in trafic si/sau parcare neregulamentara sunt sub responsabilitatea');
    addTextWithBreak('Locatarului;', 6);
    addTextWithBreak('12.2 Locatorul se angajeaza, in cazul in care primeste o notificare cu privire la orice incalcari in trafic si/sau parcare');
    addTextWithBreak('comise de Locatar, sa expedieze o copie a unui astfel de anunt Locatarului cat mai curand posibil si sa furnizeze');
    addTextWithBreak('informatiile necesare autoritatii emitente relevante pentru ca astfel de anunturi pe durata contractului sa fie transmise');
    addTextWithBreak('Locatarului;', 6);
    addTextWithBreak('12.3 Locatarul are dreptul de a contesta, adresa plangeri, interpelari sau obiectii in legatura cu presupusa infractiune');
    addTextWithBreak('sau contraventie autoritatii competente si are dreptul de a solicita audiere in instanta, Locatarul fiind obligat sa anunte');
    addTextWithBreak('Locatorul despre actele de constatare a faptelor comise cu utilizarea autovehiculului inchiriat;');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION XIII: ÎNCETAREA CONTRACTULUI
    // ============================================
    // Check page break before starting new section
    const sectionXIIICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXIIICheck.y;
    currentPage = sectionXIIICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('XIII. INCETAREA CONTRACTULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('13.1 Locatorul are dreptul de a rezilia Contractul de locatiune si de a intra in posesia imediata a autovehiculului, in');
    addTextWithBreak('cazul in care Locatarul nu respecta oricare dintre termenii si conditiile Contractului de locatiune, sau in cazul in care');
    addTextWithBreak('autovehiculul este deteriorat;');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION XIV: REZERVĂRI / ACHITĂRI
    // ============================================
    // Check page break before starting new section
    const sectionXIVCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXIVCheck.y;
    currentPage = sectionXIVCheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('XIV. REZERVARI / ACHITARI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('14.1 Rezervarea autovehiculului se considera valida din momentul intrarii sumei aferente rezervarii pe contul sau in');
    addTextWithBreak('casieria Locatorului;', 6);
    addTextWithBreak('14.2 Anularea sau modificarea rezervarii poate fi efectuata prin apel telefonic/ e-mail/ Whatsapp/ Telegram/ Viber/');
    addTextWithBreak('Instagram;');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION XV: CLAUZA DE PENALITATE ÎN CAZUL REFUZULUI DE A RETURNA AUTOVEHICULUL
    // ============================================
    // Check page break before starting new section
    const sectionXVCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXVCheck.y;
    currentPage = sectionXVCheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('XV. CLAUZA DE PENALITATE IN CAZUL REFUZULUI DE A RETURNA AUTOVEHICULUL'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('15.1 In cazul in care, Locatarul nu va restitui autovehiculul inchiriat la ora si data prevazuta in Anexa Nr.1, iar');
    addTextWithBreak('intarzierea este imputabila Locatarului, acesta din urma se considera a fi in intarziere, fara a fi necesara o notificare');
    addTextWithBreak('prealabila;', 6);
    addTextWithBreak('15.2 In cazul in care intarzierea dureaza pana la 10 ore, Locatarul este obligat sa achite taxa in cuantum de 10% din');
    addTextWithBreak('pretul unei zile de locatiune pentru fiecare ora de intarziere a autoturismului inchiriat de catre acesta;', 6);
    addTextWithBreak('15.3 In cazul in care intarzierea predarii autoturismului dureaza intre 10 si 24 de ore, Locatarul este obligat sa achite');
    addTextWithBreak('pretul dublu al locatiunii pentru prima zi de inchiriere, fara a i se aplica discountul cumulativ din pretul de lista;', 6);
    addTextWithBreak('15.4 Pentru fiecare zi de intarziere ce depaseste 24 de ore, care urmeaza dupa ziua in care Locatarul avea obligatia sa');
    addTextWithBreak('predea autovehiculul inchiriat, acesta din urma va fi obligat sa achite pretul dublu al locatiunii pentru toate zilele de');
    addTextWithBreak('intarziere. In acest caz, valabilitatea obligatiilor Locatarului prevazute in prezentul Contract se prelungeste pana la');
    addTextWithBreak('predarea autovehiculului;');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // SECTION XVI: CONFIDENȚIALITATEA
    // ============================================
    // Check page break before starting new section
    const sectionXVICheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = sectionXVICheck.y;
    currentPage = sectionXVICheck.currentPage;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('XVI. CONFIDENTIALITATEA'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('16.1 Notiunea de confidentialitate include fara limitari orice informatie, indiferent de forma acesteia, dar care, in cazul');
    addTextWithBreak('formei scrise sau electronice a fost in mod clar desemnata de oricare din parti ca fiind confidentiala, iar in cazul');
    addTextWithBreak('comunicarii orale, este identificata in momentul dezvaluirii ca fiind confidentiala, inclusiv informatiile confidentiale');
    addTextWithBreak('dezvaluite de oricare dintre Parti celeilalte, inainte de data semnarii prezentului Contract.', 6);
    addTextWithBreak('16.2 Informatiile privind identitatea Locatarului sunt solicitate de catre Locator pentru a-i permite celui din urma sa');
    addTextWithBreak('evalueze cererea Locatarului de a inchiria autovehiculul;', 6);
    addTextWithBreak('16.3 Locatarul nu este obligat sa furnizeze aceste informatii, dar in cazul in care nu le ofera, Locatorul este in drept');
    addTextWithBreak('sa nu incheie contractul de locatiune;', 6);
    addTextWithBreak('16.5 Confidentialitatea informatiilor privind cardurile bancare si titularii acestora este asigurata de sistemele securizate');
    addTextWithBreak('aplicate de catre banca;', 6);
    addTextWithBreak('16.6 Locatorul nu stocheaza si nu prelucreaza nici un fel de date privind cardurile si conturile bancare ale');
    addTextWithBreak('Locatarului.', 6);
    addTextWithBreak('16.7 Locatorul se obliga sa prelucreze datele cu caracter personal ale Locatarului exclusiv in scopuri legate de');
    addTextWithBreak('inchirierea autovehiculului si furnizarea de servicii conexe pentru clienti, inclusiv marketing direct si evaluarea');
    addTextWithBreak('satisfactiei clientilor cu produsele si serviciile oferite de catre Locator.', 6);
    addTextWithBreak('16.8 Locatorul are dreptul sa ofere date cu caracter personal tuturor organelor de drept la solicitarea acestora.');
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // FINAL NOTES AND SIGNATURES
    // ============================================
    currentPage++;
    doc.addPage();
    y = margin;
    
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('NOTA IN ADRESA LOCATARULUI'), margin, y);
    y += 6;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    
    addTextWithBreak('NOTA: Locatorul trebuie sa ofere Locatarului cel putin un exemplar al Contractului de locatiune, care urmeaza');
    addTextWithBreak('pastrat in autovehicul pe toata perioada locatiunii si prezentat organelor competente.', 6);
    addTextWithBreak('Acte anexate la prezentul contract: Anexa Nr.1- Perioada, Pretul locatiunii, Garantia, Fransiza si Soferii aditionali');
    addTextWithBreak('Anexa Nr.2- Act de predare-primire');
    y += 8;
    
    // Signatures section
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('LOCATOR', margin, y);
    doc.text('LOCATAR', pageWidth - margin - 50, y);
    y += 8;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('LEVEL AUTO RENTAL S.R.L.', margin, y);
    doc.text(convertRomanianToASCII(data.customer.fullName || '__________________________'), pageWidth - margin - 50, y);
    y += 5;
    
    doc.text('Cod fiscal: 1024606013124', margin, y);
    y += 5;
    
    doc.text(convertRomanianToASCII('MD-2075, mun. Chisinau, or. Chisinau Str. Mircea cel Batran 13/1, of. 1K B.C Victoriabank SA'), margin, y);
    y += 5;
    doc.text('IBAN MDL: MD65VI022512000000429', margin, y);
    y += 5;
    doc.text('Cod bancar: VICBMD2X', margin, y);
    y += 10;
    
    doc.line(margin, y, margin + 60, y);
    doc.line(pageWidth - margin - 50, y, pageWidth - margin, y);
    y += 5;
    doc.text(convertRomanianToASCII('(Semnatura)'), margin, y);
    doc.text(convertRomanianToASCII('(Semnatura)'), pageWidth - margin - 50, y);
    
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // ANEXA NR.1: DETALII LOCATIUNE
    // ============================================
    currentPage++;
    doc.addPage();
    y = margin;

    // Header - "Anexa Nr.1" centered
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    const anexa1Text = 'Anexa Nr.1';
    const anexa1TextWidth = doc.getTextWidth(anexa1Text);
    doc.text(anexa1Text, (pageWidth - anexa1TextWidth) / 2, y);
    y += 8;

    // "CONTRACT DE LOCAȚIUNE" centered
    doc.setFontSize(12);
    doc.setFont('times', 'bold');
    const contractTitle = convertRomanianToASCII('CONTRACT DE LOCATIUNE');
    const titleWidth = doc.getTextWidth(contractTitle);
    doc.text(contractTitle, (pageWidth - titleWidth) / 2, y);
    y += 6;

    // Contract number and date
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`Nr. ${data.contractNumber} din ${formatDateRO(data.contractDate)}`, margin, y);
    y += 12;

    // PERIOADA LOCAȚIUNII / LOCUL PREDĂRII Section
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('PERIOADA LOCATIUNII / LOCUL PREDARII'), margin, y);
    y += 8;

    // Table with black header bar
    const anexa1TableStartY = y;
    const anexa1RowHeight = 8;
    const col1Width = 30; // DATA
    const col2Width = 25; // ORA
    const col3Width = 60; // LOCUL
    const tableEndX = margin + col1Width + col2Width + col3Width;

    // Draw black header bar
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, anexa1TableStartY, tableEndX - margin, anexa1RowHeight, 'F');
    
    // Header text in white
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('DATA', margin + 2, anexa1TableStartY + 5);
    doc.text('ORA', margin + col1Width + 2, anexa1TableStartY + 5);
    doc.text('LOCUL', margin + col1Width + col2Width + 2, anexa1TableStartY + 5);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    y = anexa1TableStartY + anexa1RowHeight;

    // Draw table borders
    doc.line(margin, anexa1TableStartY, margin, anexa1TableStartY + (anexa1RowHeight * 3)); // Left border
    doc.line(margin + col1Width, anexa1TableStartY, margin + col1Width, anexa1TableStartY + (anexa1RowHeight * 3)); // Column separator 1
    doc.line(margin + col1Width + col2Width, anexa1TableStartY, margin + col1Width + col2Width, anexa1TableStartY + (anexa1RowHeight * 3)); // Column separator 2
    doc.line(tableEndX, anexa1TableStartY, tableEndX, anexa1TableStartY + (anexa1RowHeight * 3)); // Right border
    doc.line(margin, anexa1TableStartY + anexa1RowHeight, tableEndX, anexa1TableStartY + anexa1RowHeight); // Header separator
    doc.line(margin, anexa1TableStartY + (anexa1RowHeight * 2), tableEndX, anexa1TableStartY + (anexa1RowHeight * 2)); // Row separator
    doc.line(margin, anexa1TableStartY + (anexa1RowHeight * 3), tableEndX, anexa1TableStartY + (anexa1RowHeight * 3)); // Bottom border

    // PREDARE row with grey background (black text on grey)
    const predareRowY = y;
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, predareRowY, col1Width, anexa1RowHeight, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black text on grey background
    doc.text('PREDARE', margin + 2, predareRowY + 5);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    // Fill PREDARE cells with actual data
    doc.text(formatDateRO(data.rentalDetails.startDate), margin + col1Width + 2, predareRowY + 5);
    doc.text(formatTime(data.rentalDetails.startTime), margin + col1Width + col2Width + 2, predareRowY + 5);
    doc.text(convertRomanianToASCII(data.rentalDetails.pickupLocation), margin + col1Width + col2Width + 2, predareRowY + 5);
    y += anexa1RowHeight;

    // PRIMIRE row with grey background (black text on grey)
    const primireRowY = y;
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, primireRowY, col1Width, anexa1RowHeight, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black text on grey background
    doc.text('PRIMIRE', margin + 2, primireRowY + 5);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    // Fill PRIMIRE cells with actual data
    doc.text(formatDateRO(data.rentalDetails.endDate), margin + col1Width + 2, primireRowY + 5);
    doc.text(formatTime(data.rentalDetails.endTime), margin + col1Width + col2Width + 2, primireRowY + 5);
    doc.text(convertRomanianToASCII(data.rentalDetails.returnLocation), margin + col1Width + col2Width + 2, primireRowY + 5);
    y += anexa1RowHeight + 10;

    // PREȚUL LOCAȚIUNII Section
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('PRETUL LOCATIUNII'), margin, y);
    y += 8;

    // Price table with black header (covering entire width including label column)
    const priceTableStartY = y;
    const priceRowHeight = 7;
    const priceLabelColWidth = 35; // Label column (Autovehicul, etc.)
    const priceCol1Width = 30; // Preț 1 zi
    const priceCol2Width = 25; // Nr. zile
    const priceCol3Width = 30; // Subtotal
    const priceCol4Width = 30; // Reducere
    const priceCol5Width = 30; // Total
    const priceTableEndX = margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + priceCol4Width + priceCol5Width;

    // Draw black header bar (covering entire width including label column)
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, priceTableStartY, priceTableEndX - margin, priceRowHeight, 'F');
    
    // Header text in white (first column empty, then data columns)
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text(convertRomanianToASCII('Pret 1 zi'), margin + priceLabelColWidth + 2, priceTableStartY + 4.5);
    doc.text('Nr. zile', margin + priceLabelColWidth + priceCol1Width + 2, priceTableStartY + 4.5);
    doc.text('Subtotal', margin + priceLabelColWidth + priceCol1Width + priceCol2Width + 2, priceTableStartY + 4.5);
    doc.text('Reducere', margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + 2, priceTableStartY + 4.5);
    doc.text('Total', margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + priceCol4Width + 2, priceTableStartY + 4.5);
    
    doc.setTextColor(0, 0, 0);
    y = priceTableStartY + priceRowHeight;

    // Draw table borders
    doc.line(margin, priceTableStartY, margin, priceTableStartY + (priceRowHeight * 5)); // Left
    doc.line(margin + priceLabelColWidth, priceTableStartY, margin + priceLabelColWidth, priceTableStartY + (priceRowHeight * 5)); // Label column separator
    doc.line(margin + priceLabelColWidth + priceCol1Width, priceTableStartY, margin + priceLabelColWidth + priceCol1Width, priceTableStartY + (priceRowHeight * 5)); // Col 1
    doc.line(margin + priceLabelColWidth + priceCol1Width + priceCol2Width, priceTableStartY, margin + priceLabelColWidth + priceCol1Width + priceCol2Width, priceTableStartY + (priceRowHeight * 5)); // Col 2
    doc.line(margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width, priceTableStartY, margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width, priceTableStartY + (priceRowHeight * 5)); // Col 3
    doc.line(margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + priceCol4Width, priceTableStartY, margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + priceCol4Width, priceTableStartY + (priceRowHeight * 5)); // Col 4
    doc.line(priceTableEndX, priceTableStartY, priceTableEndX, priceTableStartY + (priceRowHeight * 5)); // Right
    for (let i = 1; i <= 4; i++) {
      doc.line(margin, priceTableStartY + (priceRowHeight * i), priceTableEndX, priceTableStartY + (priceRowHeight * i));
    }
    // Bottom border
    doc.line(margin, priceTableStartY + (priceRowHeight * 5), priceTableEndX, priceTableStartY + (priceRowHeight * 5));

    // Table rows with grey backgrounds for labels
    const priceRows = [
      { label: 'Autovehicul' },
      { label: convertRomanianToASCII('Servicii sofer') },
      { label: convertRomanianToASCII('Scaun copii') },
      { label: convertRomanianToASCII('Alte servicii') }
    ];

    priceRows.forEach((row, idx) => {
      const rowY = priceTableStartY + priceRowHeight + (idx * priceRowHeight);
      // Grey background for label column only
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, rowY, priceLabelColWidth, priceRowHeight, 'F');
      
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0); // Black text on grey background
      doc.text(row.label, margin + 2, rowY + 4.5);
      
      // Fill values for Autovehicul row (first row)
      if (idx === 0) {
        doc.setFont('times', 'normal');
        doc.setFontSize(8);
        doc.text(data.rentalDetails.pricePerDay.toString(), margin + priceLabelColWidth + 2, rowY + 4.5);
        doc.text(data.rentalDetails.numberOfDays.toString(), margin + priceLabelColWidth + priceCol1Width + 2, rowY + 4.5);
        doc.text(data.rentalDetails.subtotal.toString(), margin + priceLabelColWidth + priceCol1Width + priceCol2Width + 2, rowY + 4.5);
        doc.text(data.rentalDetails.discount ? data.rentalDetails.discount.toString() : '0', margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + 2, rowY + 4.5);
        doc.text(data.rentalDetails.total.toString(), margin + priceLabelColWidth + priceCol1Width + priceCol2Width + priceCol3Width + priceCol4Width + 2, rowY + 4.5);
      }
      // Other rows remain empty (white background)
    });

    y = priceTableStartY + (priceRowHeight * 5) + 6;

    // Total to pay - spans multiple columns, right aligned
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    const totalText = convertRomanianToASCII(`Total spre plata: ${data.rentalDetails.total} MDL`);
    doc.text(totalText, priceTableEndX, y, { align: 'right' });
    y += 8;

    // Payment method and date
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(convertRomanianToASCII('Mod achitare locatiune:'), margin, y);
    doc.text(data.rentalDetails.paymentMethod || '___________________', margin + 60, y);
    y += 6;
    doc.text(convertRomanianToASCII('Data achitare locatiune:'), margin, y);
    doc.text(data.rentalDetails.paymentDate ? formatDateRO(data.rentalDetails.paymentDate) : '___________________', margin + 60, y);
    y += 12;

    // GARANȚII (RĂSPUNDERE MATERIALĂ) Section
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('GARANTII (RASPUNDERE MATERIALA)'), margin, y);
    y += 8;

    // DEPOZIT table
    const depozitTableStartY = y;
    const depozitRowHeight = 8;
    const depozitCol1Width = 30; // DEPOZIT label
    const depozitCol2Width = 50; // Amount line + MDL
    const depozitCol3Width = 50; // Mod achitare garantie label
    const depozitCol4Width = 40; // Payment method line
    const depozitTableEndX = margin + depozitCol1Width + depozitCol2Width + depozitCol3Width + depozitCol4Width;

    // Draw table borders
    doc.line(margin, depozitTableStartY, margin, depozitTableStartY + depozitRowHeight); // Left
    doc.line(margin + depozitCol1Width, depozitTableStartY, margin + depozitCol1Width, depozitTableStartY + depozitRowHeight); // Col 1
    doc.line(margin + depozitCol1Width + depozitCol2Width, depozitTableStartY, margin + depozitCol1Width + depozitCol2Width, depozitTableStartY + depozitRowHeight); // Col 2
    doc.line(margin + depozitCol1Width + depozitCol2Width + depozitCol3Width, depozitTableStartY, margin + depozitCol1Width + depozitCol2Width + depozitCol3Width, depozitTableStartY + depozitRowHeight); // Col 3
    doc.line(depozitTableEndX, depozitTableStartY, depozitTableEndX, depozitTableStartY + depozitRowHeight); // Right
    doc.line(margin, depozitTableStartY, depozitTableEndX, depozitTableStartY); // Top
    doc.line(margin, depozitTableStartY + depozitRowHeight, depozitTableEndX, depozitTableStartY + depozitRowHeight); // Bottom

    // DEPOZIT cell with black background
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, depozitTableStartY, depozitCol1Width, depozitRowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('DEPOZIT', margin + depozitCol1Width / 2, depozitTableStartY + depozitRowHeight / 2 + 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    
    // Other cells with content
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const underlineX = margin + depozitCol1Width + 2;
    const underlineY = depozitTableStartY + depozitRowHeight / 2 + 2;
    const depositAmount = data.rentalDetails.deposit.toString();
    doc.text(depositAmount, underlineX, underlineY);
    doc.text('MDL', underlineX + 35, underlineY); // MDL to the right of amount
    doc.text(convertRomanianToASCII('Mod achitare garantie:'), margin + depozitCol1Width + depozitCol2Width + 2, depozitTableStartY + depozitRowHeight / 2 + 2);
    doc.text(data.rentalDetails.paymentMethod || '___________________', margin + depozitCol1Width + depozitCol2Width + depozitCol3Width + 2, depozitTableStartY + depozitRowHeight / 2 + 2);
    
    y = depozitTableStartY + depozitRowHeight + 10;

    // ŞOFERI ADIȚIONALI Section
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text(convertRomanianToASCII('SOFERI ADITIONALI'), margin, y);
    y += 8;

    // Table with black header
    const driversTableStartY = y;
    const driversRowHeight = 7;
    const driversCol1Width = 80; // Nume Prenume
    const driversCol2Width = 50; // IDNP
    const driversTableEndX = margin + driversCol1Width + driversCol2Width;

    // Draw black header bar
    doc.setFillColor(0, 0, 0);
    doc.rect(margin, driversTableStartY, driversTableEndX - margin, driversRowHeight, 'F');
    
    // Header text in white
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text(convertRomanianToASCII('Nume Prenume'), margin + 2, driversTableStartY + 4.5);
    doc.text('IDNP', margin + driversCol1Width + 2, driversTableStartY + 4.5);
    doc.setTextColor(0, 0, 0);
    y = driversTableStartY + driversRowHeight;

    // Draw table borders - calculate number of rows needed (2 rows minimum, or number of additional drivers + 1)
    const numDriverRows = Math.max(2, (data.additionalDrivers?.length || 0) + 1);
    doc.line(margin, driversTableStartY, margin, driversTableStartY + (driversRowHeight * numDriverRows)); // Left
    doc.line(margin + driversCol1Width, driversTableStartY, margin + driversCol1Width, driversTableStartY + (driversRowHeight * numDriverRows)); // Middle
    doc.line(driversTableEndX, driversTableStartY, driversTableEndX, driversTableStartY + (driversRowHeight * numDriverRows)); // Right
    doc.line(margin, driversTableStartY + driversRowHeight, driversTableEndX, driversTableStartY + driversRowHeight); // Header separator
    for (let i = 2; i < numDriverRows; i++) {
      doc.line(margin, driversTableStartY + (driversRowHeight * i), driversTableEndX, driversTableStartY + (driversRowHeight * i)); // Row separators
    }
    doc.line(margin, driversTableStartY + (driversRowHeight * numDriverRows), driversTableEndX, driversTableStartY + (driversRowHeight * numDriverRows)); // Bottom

    // Fill rows with additional drivers data
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    if (data.additionalDrivers && data.additionalDrivers.length > 0) {
      data.additionalDrivers.forEach((driver, idx) => {
        const rowY = driversTableStartY + driversRowHeight + (idx * driversRowHeight);
        const fullName = convertRomanianToASCII(`${driver.firstName} ${driver.lastName}`);
        doc.text(fullName, margin + 2, rowY + 4.5);
        doc.text(driver.idnp || '', margin + driversCol1Width + 2, rowY + 4.5);
      });
      // Fill remaining rows with empty cells if needed
      for (let i = data.additionalDrivers.length; i < numDriverRows - 1; i++) {
        const rowY = driversTableStartY + driversRowHeight + (i * driversRowHeight);
        // Empty cells
      }
    } else {
      // Fill with empty rows
      for (let i = 0; i < numDriverRows - 1; i++) {
        const rowY = driversTableStartY + driversRowHeight + (i * driversRowHeight);
        // Empty cells
      }
    }
    
    y = driversTableStartY + (driversRowHeight * numDriverRows) + 10;

    // Signature Area - bottom left
    const signatureY = pageHeight - 40;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('LOCATAR', margin, signatureY);
    y = signatureY + 8;
    doc.line(margin, y, margin + 50, y);
    y += 5;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(convertRomanianToASCII('(Semnatura)'), margin, y);

    // Add footer to Anexa 1
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // ============================================
    // ANEXA NR.2: ACT DE PREDARE-PRIMIRE AUTOVEHICUL
    // ============================================
    currentPage++;
    doc.addPage();
    y = margin;

    // Header
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    const anexa2Text = 'ANEXA NR. 2';
    const anexa2TextWidth = doc.getTextWidth(anexa2Text);
    doc.text(anexa2Text, (pageWidth - anexa2TextWidth) / 2, y);
    y += 5;
    doc.text(convertRomanianToASCII('CONTRACT DE LOCATIUNE'), margin, y);
    y += 5;
    doc.setFont('times', 'normal');
    doc.text(`Nr. ${data.contractNumber} din ${formatDateRO(data.contractDate)}`, margin, y);
    y += 5;
    doc.setFont('times', 'bold');
    doc.text(convertRomanianToASCII('ACT DE PREDARE-PRIMIRE AL AUTOVEHICULULUI'), margin, y);
    y += 8;

    // Vehicle condition table
    doc.setFontSize(9);
    doc.setFont('times', 'bold');
    doc.text('BORD AUTOVEHICUL', margin, y);
    y += 5;

    const rowHeight = 4;
    const tableStartY = y;
    
    // Left table: Vehicle details
    const vehicleRows = [
      ['Data(ziua.luna.anul)', formatDateRO(data.rentalDetails.startDate), formatDateRO(data.rentalDetails.endDate)],
      ['Ora(ora:minute)', formatTime(data.rentalDetails.startTime), formatTime(data.rentalDetails.endTime)],
      ['Odometru(km)', data.vehicleDetails?.mileage?.toString() || '', ''],
      ['Combustibil(%)', data.vehicleDetails?.fuelLevel?.toString() || '100', ''],
      ['Cheie', 'X', ''],
      [convertRomanianToASCII('Certificat de inmatriculare'), 'X', ''],
      ['Asigurare RCA', 'X', ''],
      [convertRomanianToASCII('Stare(spalatorie)'), 'X', '']
    ];
    
    // Right table: Accessories
    const accessoriesList = [
      'Extinctor',
      convertRomanianToASCII('Trusa medicala'),
      'Triunghi reflectorizant',
      'Cric de tractare',
      convertRomanianToASCII('Roata de rezerva'),
      convertRomanianToASCII('Pompa pentru roti'),
      convertRomanianToASCII('Chei si cric pentru roti')
    ];
    
    // LEFT TABLE: Vehicle details (adjusted to fit on page)
    const leftTableLabelX = margin;
    const leftTablePredareX = margin + 40;
    const leftTableReturnareX = margin + 65;
    const leftTableEndX = margin + 90;
    const leftTableRows = vehicleRows.length;
    const leftTableEndY = tableStartY + (leftTableRows * rowHeight) + rowHeight;
    
    // Draw left table borders
    doc.setLineWidth(0.1);
    doc.line(leftTableLabelX, tableStartY, leftTableEndX, tableStartY); // Top
    doc.line(leftTableLabelX, leftTableEndY, leftTableEndX, leftTableEndY); // Bottom
    doc.line(leftTableLabelX, tableStartY, leftTableLabelX, leftTableEndY); // Left
    doc.line(leftTableEndX, tableStartY, leftTableEndX, leftTableEndY); // Right
    doc.line(leftTablePredareX, tableStartY, leftTablePredareX, leftTableEndY); // Vertical line
    doc.line(leftTableReturnareX, tableStartY, leftTableReturnareX, leftTableEndY); // Vertical line
    const leftHeaderRowY = tableStartY + rowHeight;
    doc.line(leftTableLabelX, leftHeaderRowY, leftTableEndX, leftHeaderRowY); // Header separator
    
    // Draw left table horizontal lines
    for (let i = 1; i <= leftTableRows; i++) {
      const rowY = leftHeaderRowY + (i * rowHeight);
      doc.line(leftTableLabelX, rowY, leftTableEndX, rowY);
    }
    
    // Left table headers
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text('PREDARE', leftTablePredareX + 3, tableStartY + 3);
    doc.text('RETURNARE', leftTableReturnareX + 3, tableStartY + 3);
    
    // Left table content
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    vehicleRows.forEach((row, idx) => {
      const rowY = leftHeaderRowY + (idx * rowHeight) + 3;
      doc.text(convertRomanianToASCII(row[0]), leftTableLabelX + 2, rowY);
      doc.text(row[1], leftTablePredareX + 3, rowY);
      doc.text(row[2], leftTableReturnareX + 3, rowY);
    });
    
    // RIGHT TABLE: Accessories (adjusted to fit on page)
    const rightTableLabelX = margin + 95;
    const rightTablePredareX = margin + 130;
    // Make PREDARE and RETURNARE columns equal width
    const rightTableEndX = Math.min(margin + 230, pageWidth - margin);
    const totalColumnsWidth = rightTableEndX - rightTablePredareX;
    const rightTableReturnareX = rightTablePredareX + (totalColumnsWidth / 2); // Equal width columns
    const rightTableRows = accessoriesList.length;
    const rightTableEndY = tableStartY + (rightTableRows * rowHeight) + rowHeight;
    
    // Draw right table borders
    doc.line(rightTableLabelX, tableStartY, rightTableEndX, tableStartY); // Top
    doc.line(rightTableLabelX, rightTableEndY, rightTableEndX, rightTableEndY); // Bottom
    doc.line(rightTableLabelX, tableStartY, rightTableLabelX, rightTableEndY); // Left
    doc.line(rightTableEndX, tableStartY, rightTableEndX, rightTableEndY); // Right
    doc.line(rightTablePredareX, tableStartY, rightTablePredareX, rightTableEndY); // Vertical line
    doc.line(rightTableReturnareX, tableStartY, rightTableReturnareX, rightTableEndY); // Vertical line
    const rightHeaderRowY = tableStartY + rowHeight;
    doc.line(rightTableLabelX, rightHeaderRowY, rightTableEndX, rightHeaderRowY); // Header separator
    
    // Draw right table horizontal lines
    for (let i = 1; i <= rightTableRows; i++) {
      const rowY = rightHeaderRowY + (i * rowHeight);
      doc.line(rightTableLabelX, rowY, rightTableEndX, rowY);
    }
    
    // Right table headers - center both texts in their equal-width cells
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    const predareTextWidth = doc.getTextWidth('PREDARE');
    const predareCellWidth = rightTableReturnareX - rightTablePredareX;
    const predareTextX = rightTablePredareX + (predareCellWidth / 2) - (predareTextWidth / 2);
    doc.text('PREDARE', predareTextX, tableStartY + 3);
    const returnareTextWidth = doc.getTextWidth('RETURNARE');
    const returnareCellWidth = rightTableEndX - rightTableReturnareX;
    const returnareTextX = rightTableReturnareX + (returnareCellWidth / 2) - (returnareTextWidth / 2);
    doc.text('RETURNARE', returnareTextX, tableStartY + 3);
    
    // Right table content
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    accessoriesList.forEach((accessory, idx) => {
      const rowY = rightHeaderRowY + (idx * rowHeight) + 3;
      doc.text(convertRomanianToASCII(accessory), rightTableLabelX + 2, rowY);
      // Empty cells for PREDARE and RETURNARE
    });
    
    // Use the taller table's end position
    y = Math.max(leftTableEndY, rightTableEndY);

    y += 5;

    // Check page break before vehicle exterior section
    let exteriorPageCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = exteriorPageCheck.y;
    currentPage = exteriorPageCheck.currentPage;

    // Load and add car diagram image on left
    const carImageStartY = y + 20;
    let carImageLoaded = false;
    const carImageWidth = 50; // Width of the car diagram image
    const carImageHeight = 120; // Approximate height for the car diagram
    try {
      const carImageBase64 = await loadImageAsBase64('/LevelAutoRental/cars/contract_cars.png');
      doc.addImage(carImageBase64, 'PNG', margin, carImageStartY, carImageWidth, carImageHeight);
      carImageLoaded = true;
    } catch (error) {
      console.error('Failed to load car diagram image:', error);
      carImageLoaded = false;
    }

    // Vehicle accessories checklist (positioned to the right of the image)
    const textStartX = margin + carImageWidth + 5; // Start text after the image
    y += 15;

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.text('STARE AUTOVEHICUL EXTERIOR', textStartX, y);
    y += 5;

    // Add header row with column titles (moved more to the right)
    const sectionOffset = 20; // Move entire section to the right
    const lipsaDefectiuniOffset = 15; // Additional offset for LIPSA DEFECTIUNI column
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    const headerY = y;
    const lipsaDefectiuniX = textStartX + sectionOffset + lipsaDefectiuniOffset;
    const mentiuniPredareX = textStartX + sectionOffset + 48; // Moved slightly to the left
    const mentiuniReturnareX = textStartX + sectionOffset + 80; // Moved slightly to the left
    const lipsaDefectiuniText = convertRomanianToASCII('LIPSA DEFECTIUNI');
    doc.text(lipsaDefectiuniText, lipsaDefectiuniX, headerY);
    // Calculate text width to center checkbox
    const lipsaDefectiuniTextWidth = doc.getTextWidth(lipsaDefectiuniText);
    
    const mentiuniPredareText = convertRomanianToASCII('MENTIUNI PREDARE');
    doc.text(mentiuniPredareText, mentiuniPredareX, headerY);
    const mentiuniPredareTextWidth = doc.getTextWidth(mentiuniPredareText);
    
    const mentiuniReturnareText = convertRomanianToASCII('MENTIUNI RETURNARE');
    doc.text(mentiuniReturnareText, mentiuniReturnareX, headerY);
    const mentiuniReturnareTextWidth = doc.getTextWidth(mentiuniReturnareText);
    y += 6;

    // Vehicle condition by side
    const sides = [
      { name: convertRomanianToASCII('PARTEA DIN FATA'), items: [convertRomanianToASCII('Bara de protectie fata'), 'Parbriz', convertRomanianToASCII('Lumini fata'), convertRomanianToASCII('Capota')] },
      { name: convertRomanianToASCII('PARTEA DIN DREAPTA'), items: [convertRomanianToASCII('Aripa lateral fata'), convertRomanianToASCII('Usa fata dreapta'), convertRomanianToASCII('Usa spate dreapta'), convertRomanianToASCII('Aripa lateral spate'), convertRomanianToASCII('Jante lateral'), convertRomanianToASCII('Anvelope lateral')] },
      { name: convertRomanianToASCII('PARTEA DIN SPATE'), items: [convertRomanianToASCII('Bara de protectie'), convertRomanianToASCII('Luneta spate'), convertRomanianToASCII('Lumini spate'), 'Portbagaj'] },
      { name: convertRomanianToASCII('PARTEA DIN STANGA'), items: [convertRomanianToASCII('Aripa lateral fata'), convertRomanianToASCII('Usa fata stanga'), convertRomanianToASCII('Usa spate stanga'), convertRomanianToASCII('Aripa lateral spate'), convertRomanianToASCII('Jante lateral'), convertRomanianToASCII('Anvelope lateral')] }
    ];

    sides.forEach((side) => {
      // Check if we need a new page before adding content
      exteriorPageCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
      y = exteriorPageCheck.y;
      currentPage = exteriorPageCheck.currentPage;
      
      // If we're on a new page, reset text position to margin (no image on new pages)
      const currentTextStartX = (y === margin) ? margin : textStartX;
      
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      // Move PARTEA titles to the left (no sectionOffset)
      doc.text(side.name, currentTextStartX, y);
      y += 6;
      
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      side.items.forEach(item => {
        // Checkbox in LIPSA DEFECTIUNI column (centered under header text)
        const checkboxSize = 2;
        // Center checkbox under "LIPSA DEFECTIUNI" text
        const checkboxX = lipsaDefectiuniX + (lipsaDefectiuniTextWidth / 2) - (checkboxSize / 2);
        const checkboxY = y - 1.5;
        doc.rect(checkboxX, checkboxY, checkboxSize, checkboxSize);
        
        // Format: • Item (with bullet point, moved to the left with PARTEA titles)
        const itemTextX = currentTextStartX; // No sectionOffset, aligned with PARTEA titles
        doc.text(`• ${item}`, itemTextX, y);
        y += 2;
        // Two columns of underscore lines centered under MENTIUNI PREDARE and MENTIUNI RETURNARE (moved more to left)
        const underscoreLineLength = 18; // Length of underscore line
        const underscoreOffset = -5; // Move lines more to the left
        const predareUnderscoreX = mentiuniPredareX + (mentiuniPredareTextWidth / 2) - (underscoreLineLength / 2) + underscoreOffset;
        const returnareUnderscoreX = mentiuniReturnareX + (mentiuniReturnareTextWidth / 2) - (underscoreLineLength / 2) + underscoreOffset;
        doc.text('___________________', predareUnderscoreX, y);
        doc.text('___________________', returnareUnderscoreX, y);
        y += 2;
      });
      
      y += 3;
    });

    y += 5;

    // Calculate where the car image ends to position note and signatures below it
    const carImageEndY = carImageStartY + carImageHeight + 20;
    // Ensure note and signatures are below the image
    if (y < carImageEndY + 10) {
      y = carImageEndY + 10;
    }

    // Add note about symbolic representation
    const noteCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = noteCheck.y;
    currentPage = noteCheck.currentPage;
    
    doc.setFont('times', 'italic');
    doc.setFontSize(7);
    const noteText = convertRomanianToASCII('Nota: Aceasta reprezentare grafica este una simbolica. Automobilul inchiriat poate arata diferit, in dependenta de model si dotari.');
    doc.text(noteText, margin, y, { maxWidth: pageWidth - 2 * margin });
    y += 8;

    // Check if we have enough space for signatures before adding footer
    let signatureCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = signatureCheck.y;
    currentPage = signatureCheck.currentPage;

    // Signatures
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    
    // Check before each signature line
    signatureCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = signatureCheck.y;
    currentPage = signatureCheck.currentPage;
    doc.text('=> Predat de LOCATOR _____________________', margin, y);
    doc.text('=> Returnat de LOCATAR _____________________', margin + 100, y);
    y += 4;
    
    signatureCheck = checkPageBreak(doc, y, pageHeight, margin, currentPage, pageWidth);
    y = signatureCheck.y;
    currentPage = signatureCheck.currentPage;
    doc.text('<= Primit de LOCATAR _____________________', margin, y);
    doc.text('<= Primit de LOCATOR _____________________', margin + 100, y);

    // Add footer to last page (ensure we have space)
    addPageFooter(doc, currentPage, pageWidth, pageHeight, margin);

    // Save PDF
    const filename = `Contract_Locatiune_${data.contractNumber}.pdf`;
    console.log('Saving PDF with filename:', filename);
    doc.save(filename);
    console.log('PDF saved successfully');
  } catch (error) {
    console.error('Error in generateContractPDF:', error);
    throw error;
  }
};

/**
 * Helper function to convert OrderDisplay to ContractData
 */
export const createContractDataFromOrder = (
  order: OrderDisplay,
  car: Car,
  contractNumber: string,
  contractDate: string = new Date().toISOString().split('T')[0],
  additionalData?: {
    customerPhone?: string;
    customerAddress?: string;
    customerCity?: string;
    customerPostalCode?: string;
    customerCountry?: string;
    customerIdNumber?: string;
    customerIdSeries?: string;
    pickupLocation?: string;
    returnLocation?: string;
    deposit?: number;
    paymentMethod?: string;
    paymentDate?: string;
    additionalDrivers?: Array<{ firstName: string; lastName: string; idnp?: string }>;
    vehicleMileage?: number;
    vehicleFuelLevel?: number;
    vehicleRegistrationNumber?: string;
    carValue?: number;
  }
): ContractData => {
  const startDate = new Date(order.pickupDate);
  const endDate = new Date(order.returnDate);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  
  // Calculate pricing
  const pricePerDay = car.price_per_day;
  const subtotal = pricePerDay * days;
  let discount = 0;
  let discountAmount = 0;
  
  // Apply discount based on days (same as calculator)
  if (days >= 8) {
    discount = 4;
    discountAmount = subtotal * 0.04;
  } else if (days >= 4) {
    discount = 2;
    discountAmount = subtotal * 0.02;
  }
  
  const total = parseFloat(order.total_amount) > 0 ? parseFloat(order.total_amount) : (subtotal - discountAmount);

  // Parse customer name - OrderDisplay doesn't have customerName, need to check what fields are available
  const customerName = (order as any).customerName || '';

  return {
    contractNumber,
    contractDate,
    rental: {
      id: order.id.toString(),
      user_id: order.userId,
      car_id: order.carId,
      start_date: order.pickupDate,
      start_time: order.pickupTime,
      end_date: order.returnDate,
      end_time: order.returnTime,
      status: order.status as any,
      total_amount: total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Rental,
    car,
    customer: {
      fullName: customerName,
      email: (order as any).customerEmail || '',
      phone: additionalData?.customerPhone || (order as any).customerPhone || '',
      address: additionalData?.customerAddress || '',
      city: additionalData?.customerCity || '',
      postalCode: additionalData?.customerPostalCode || '',
      country: additionalData?.customerCountry || 'Republica Moldova',
      idNumber: additionalData?.customerIdNumber || '',
      idSeries: additionalData?.customerIdSeries || '',
    },
    rentalDetails: {
      startDate: order.pickupDate,
      startTime: order.pickupTime,
      endDate: order.returnDate,
      endTime: order.returnTime,
      pickupLocation: additionalData?.pickupLocation || 'Chișinău, str. Mircea cel Bătrân 13/1',
      returnLocation: additionalData?.returnLocation || 'Chișinău, str. Mircea cel Bătrân 13/1',
      pricePerDay,
      numberOfDays: days,
      subtotal,
      discount: discountAmount > 0 ? discountAmount : undefined,
      total,
      deposit: additionalData?.deposit || Math.round(total * 0.2), // 20% deposit
      paymentMethod: additionalData?.paymentMethod || '',
      paymentDate: additionalData?.paymentDate || contractDate,
    },
    additionalDrivers: additionalData?.additionalDrivers,
    vehicleDetails: {
      mileage: additionalData?.vehicleMileage,
      fuelLevel: additionalData?.vehicleFuelLevel || 100,
      registrationNumber: additionalData?.vehicleRegistrationNumber,
      carValue: additionalData?.carValue,
    },
  };
};

/**
 * Simplified function to generate contract from OrderDisplay
 */
export const generateContractFromOrder = async (
  order: OrderDisplay,
  car: Car,
  contractNumber?: string,
  additionalData?: Parameters<typeof createContractDataFromOrder>[4]
) => {
  const contractNum = contractNumber || `CT-${order.id.toString().slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;
  const contractDate = new Date().toISOString().split('T')[0];
  
  const contractData = createContractDataFromOrder(
    order,
    car,
    contractNum,
    contractDate,
    additionalData
  );

  await generateContractPDF(contractData);
};

