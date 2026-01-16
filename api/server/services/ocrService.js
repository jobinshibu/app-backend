import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { promises as fsp } from 'fs';
import sharp from 'sharp';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

// Set up PDF.js worker
const PDFJS_WORKER_PATH = 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/**
 * Extract text from PDF using pdfjs-dist
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<string|null>} - Extracted text or null
 */
async function extractTextFromPDF(pdfPath) {
  try {
    console.log('📄 Attempting to extract text from PDF...');
    
    const dataBuffer = await fsp.readFile(pdfPath);
    const data = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useSystemFonts: true,
      standardFontDataUrl: null,
    });
    
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    // Extract text from all pages
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    if (fullText.trim().length > 50) {
      console.log(`✅ Text extracted from PDF: ${fullText.length} characters`);
      return fullText;
    }
    
    console.log('⚠️ PDF has no readable text layer');
    return null;
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error.message);
    return null;
  }
}

/**
 * Convert PDF page to PNG image
 * @param {string} pdfPath - Path to PDF file
 * @param {number} pageNumber - Page number to convert (1-based)
 * @returns {Promise<string>} - Path to generated PNG
 */
async function convertPdfPageToImage(pdfPath, pageNumber = 1) {
  try {
    console.log(`🔄 Converting PDF page ${pageNumber} to image...`);
    
    const dataBuffer = await fsp.readFile(pdfPath);
    const data = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useSystemFonts: true,
      standardFontDataUrl: null,
    });
    
    const pdfDocument = await loadingTask.promise;
    
    if (pageNumber > pdfDocument.numPages) {
      throw new Error(`Page ${pageNumber} does not exist in PDF`);
    }
    
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better OCR
    
    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Save canvas as PNG
    const imagePath = pdfPath.replace('.pdf', `_page${pageNumber}.png`);
    const buffer = canvas.toBuffer('image/png');
    await fsp.writeFile(imagePath, buffer);
    
    console.log(`✅ Page ${pageNumber} converted: ${imagePath}`);
    return imagePath;
    
  } catch (error) {
    console.error('❌ PDF to image conversion failed:', error.message);
    throw error;
  }
}

/**
 * Extract prescription data using OCR
 * @param {string} filePath - Path to uploaded prescription image/PDF
 * @returns {Promise<object>} - Extracted prescription data
 */
export async function extractPrescriptionData(filePath) {
  const tempFiles = [];
  
  try {
    const ext = path.extname(filePath).toLowerCase();
    let extractedText = '';
    
    // =============================================
    // HANDLE PDF FILES
    // =============================================
    if (ext === '.pdf') {
      console.log('📄 PDF detected');
      
      // Step 1: Try extracting text directly (fast, for digital PDFs)
      const pdfText = await extractTextFromPDF(filePath);
      
      if (pdfText && pdfText.trim().length > 50) {
        console.log('✅ Using extracted PDF text');
        extractedText = pdfText;
      } else {
        // Step 2: Convert PDF to image and perform OCR (for scanned PDFs)
        console.log('🔄 Converting PDF to image for OCR...');
        const imagePath = await convertPdfPageToImage(filePath, 1);
        tempFiles.push(imagePath);
        
        console.log('🔍 Running OCR on PDF image...');
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        extractedText = text;
      }
    } 
    // =============================================
    // HANDLE IMAGE FILES
    // =============================================
    else {
      console.log('🖼️ Image file detected');
      
      // Optimize image for better OCR
      const optimizedPath = await optimizeImageForOCR(filePath);
      if (optimizedPath) {
        tempFiles.push(optimizedPath);
      }
      
      const processPath = optimizedPath || filePath;
      
      console.log('🔍 Running OCR on image...');
      const { data: { text } } = await Tesseract.recognize(processPath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      extractedText = text;
    }
    
    console.log(`✅ OCR completed: ${extractedText.length} characters extracted`);
    
    // Clean up temp files
    for (const tempFile of tempFiles) {
      if (fs.existsSync(tempFile)) {
        await fsp.unlink(tempFile).catch(() => {});
      }
    }
    
    // Parse extracted text
    return parsePrescriptionText(extractedText);
    
  } catch (error) {
    console.error('❌ OCR Service Error:', error);
    
    // Clean up temp files on error
    for (const tempFile of tempFiles) {
      if (fs.existsSync(tempFile)) {
        await fsp.unlink(tempFile).catch(() => {});
      }
    }
    
    throw error;
  }
}

/**
 * Optimize image for better OCR accuracy
 * @param {string} imagePath - Original image path
 * @returns {Promise<string|null>} - Optimized image path or null
 */
async function optimizeImageForOCR(imagePath) {
  try {
    const optimizedPath = imagePath.replace(/(\.\w+)$/, '_ocr$1');
    
    await sharp(imagePath)
      .resize(3000, 3000, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .greyscale()
      .normalize()
      .sharpen()
      .toFile(optimizedPath);
    
    console.log('✅ Image optimized for OCR');
    return optimizedPath;
    
  } catch (error) {
    console.error('⚠️ Image optimization failed:', error.message);
    return null;
  }
}

/**
 * Parse extracted text to structured data
 * @param {string} text - Raw OCR text
 * @returns {object} - Structured prescription data
 */
function parsePrescriptionText(text) {
  const data = {
    doctor_name: null,
    prescription_date: null,
    medicines: []
  };
  
  // Extract doctor name
  const doctorPatterns = [
    /Dr\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
    /Doctor[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i,
    /Physician[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/i
  ];
  
  for (const pattern of doctorPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.doctor_name = match[1].trim();
      break;
    }
  }
  
  // Extract date
  const datePatterns = [
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /Date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.prescription_date = match[1];
      break;
    }
  }
  
  // Extract medicines
  const lines = text.split('\n');
  const medicinePatterns = [
    /^[\d\.]+[\.\)]\s*([A-Za-z][A-Za-z\s]+?)\s*[\-–]\s*([0-9\.]+\s*(?:mg|g|ml|mcg))/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([0-9]+\s*(?:mg|g|ml|mcg))/i,
    /Tab\.?\s+([A-Za-z][A-Za-z\s]+?)\s+([0-9]+\s*(?:mg|g|ml|mcg))/i,
    /Cap\.?\s+([A-Za-z][A-Za-z\s]+?)(?:\s+([0-9]+\s*(?:mg|g|ml|mcg)))?/i,
    /Syp\.?\s+([A-Za-z][A-Za-z\s]+?)(?:\s+([0-9]+\s*(?:mg|g|ml|mcg)))?/i
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5) continue;
    
    for (const pattern of medicinePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const medicine = {
          name: match[1].trim(),
          dosage: match[2] ? match[2].trim() : null,
          frequency: extractFrequency(trimmedLine),
          timing: extractTiming(trimmedLine)
        };
        
        const isDuplicate = data.medicines.some(
          m => m.name.toLowerCase() === medicine.name.toLowerCase()
        );
        
        if (!isDuplicate) {
          data.medicines.push(medicine);
        }
        break;
      }
    }
  }
  
  console.log(`✅ Parsed ${data.medicines.length} medicines from prescription`);
  return data;
}

/**
 * Extract frequency from text
 */
function extractFrequency(text) {
  const patterns = {
    'OD': 'once_daily',
    'ONCE DAILY': 'once_daily',
    'BD': 'twice_daily',
    'BID': 'twice_daily',
    'TWICE DAILY': 'twice_daily',
    'TDS': 'thrice_daily',
    'TID': 'thrice_daily',
    'THRICE DAILY': 'thrice_daily',
    'QID': 'four_times_daily',
    'FOUR TIMES': 'four_times_daily',
    '1-0-1': 'twice_daily',
    '1-1-1': 'thrice_daily',
    '0-0-1': 'once_daily_night',
    '1-0-0': 'once_daily_morning',
    '0-1-0': 'once_daily_afternoon'
  };
  
  const upperText = text.toUpperCase();
  
  for (const [key, value] of Object.entries(patterns)) {
    if (upperText.includes(key)) {
      return value;
    }
  }
  
  return 'as_directed';
}

/**
 * Extract timing
 */
function extractTiming(text) {
  const timing = [];
  const lower = text.toLowerCase();
  
  if (lower.includes('morning') || lower.includes('breakfast') || lower.includes('am')) {
    timing.push('morning');
  }
  if (lower.includes('afternoon') || lower.includes('lunch')) {
    timing.push('afternoon');
  }
  if (lower.includes('evening') || lower.includes('dinner') || lower.includes('pm')) {
    timing.push('evening');
  }
  if (lower.includes('night') || lower.includes('bedtime') || lower.includes('hs')) {
    timing.push('night');
  }
  
  if (timing.length === 0) {
    if (text.includes('1-0-1')) return ['morning', 'night'];
    if (text.includes('1-1-1')) return ['morning', 'afternoon', 'night'];
    if (text.includes('0-0-1')) return ['night'];
    if (text.includes('1-0-0')) return ['morning'];
    return ['morning', 'evening'];
  }
  
  return timing;
}