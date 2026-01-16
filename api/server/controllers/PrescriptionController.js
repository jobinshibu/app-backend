import httpStatus from 'http-status';
import APIResponse from '../utils/APIResponse.js';
import { Op } from 'sequelize';
import database from '../models/index.js';
import Tesseract from 'tesseract.js';
import fs from 'fs';

class PrescriptionController {

  // ==========================================================
  // PARSE PRESCRIPTION + ADD TO CART
  // ==========================================================
  async parsePrescription(req, res) {
    try {
      let inputLines = [];

      // ==========================================================
      // ⭐ STEP 1: GET INPUT (IMAGE OCR OR TEXT)
      // ==========================================================
      if (req.file) {
        const imagePath = req.file.path;

        // OCR from image
        const ocrResult = await Tesseract.recognize(imagePath, 'eng');
        const ocrText = ocrResult.data.text || '';
        inputLines = ocrText.split('\n');

        // delete temp image
        fs.unlinkSync(imagePath);
      }
      else if (req.body.ocr_text) {
        inputLines = req.body.ocr_text.split('\n');
      }
      else if (Array.isArray(req.body.lines)) {
        inputLines = req.body.lines;
      }
      else {
        return res.status(httpStatus.BAD_REQUEST).json(
          new APIResponse({}, "Invalid input. Upload image or provide text.", httpStatus.BAD_REQUEST)
        );
      }

      // ==========================================================
      // ⭐ STEP 2: GET CUSTOMER ID (FROM JWT)
      // ==========================================================
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(httpStatus.UNAUTHORIZED).json(
          new APIResponse({}, "Unauthorized", httpStatus.UNAUTHORIZED)
        );
      }

      // ==========================================================
      // ⭐ STEP 3: GET PHARMACY CONTEXT (REQUIRED)
      // ==========================================================
      const pharmacyId = req.body.pharmacy_id;
      if (!pharmacyId) {
        return res.status(httpStatus.BAD_REQUEST).json(
          new APIResponse({}, "pharmacy_id is required", httpStatus.BAD_REQUEST)
        );
      }

      // ==========================================================
      // ⭐ STEP 4: FIND OR CREATE CART (ONE CART PER CUSTOMER)
      // ==========================================================
      let cart = await database.PharmacyCart.findOne({
        where: { customer_id: customerId }
      });

      if (!cart) {
        cart = await database.PharmacyCart.create({
          customer_id: customerId
        });
      }

      const results = {
        matches: [],
        unmatched_lines: []
      };

      // ==========================================================
      // ⭐ STEP 5: PROCESS EACH OCR LINE
      // ==========================================================
      for (let line of inputLines) {
        line = line.trim();
        if (!line || line.length < 3) continue;

        // clean numbering/bullets
        const cleanLine = line.replace(/^[\d\-\.\)]+\s+/, '').trim();
        if (!cleanLine) continue;

        const firstWord = cleanLine.split(' ')[0];
        if (firstWord.length < 3) {
          results.unmatched_lines.push(line);
          continue;
        }

        // ==========================================================
        // SEARCH PRODUCT BY NAME PREFIX
        // ==========================================================
        const candidates = await database.PharmacyProduct.findAll({
          where: {
            name: { [Op.like]: `${firstWord}%` },
            deleted_at: null
          },
          attributes: [
            'id',
            'name',
            'selling_price',
            'is_prescription_required'
          ],
          limit: 10
        });

        if (!candidates.length) {
          results.unmatched_lines.push(line);
          continue;
        }

        // ==========================================================
        // BEST MATCH (LONGEST NAME MATCH)
        // ==========================================================
        const lowerLine = cleanLine.toLowerCase();
        let bestMatch = null;
        let bestLength = 0;

        for (const product of candidates) {
          const lowerName = product.name.toLowerCase();
          if (lowerLine.startsWith(lowerName) && lowerName.length > bestLength) {
            bestMatch = product;
            bestLength = lowerName.length;
          }
        }

        if (!bestMatch) {
          results.unmatched_lines.push(line);
          continue;
        }

        // ==========================================================
        // ⭐ STEP 6: DOSAGE & QUANTITY PARSE
        // ==========================================================
        const remainingText = cleanLine.substring(bestLength).trim();

        const dosageMatch = remainingText.match(/(\d+\s*(mg|ml|g|mcg|iu))/i);
        const dosage = dosageMatch ? dosageMatch[0] : null;

        const quantityMatch = remainingText.match(/(?:x|no\.?|#)\s*(\d+)/i);
        const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;

        // ==========================================================
        // ⭐ STEP 7: ADD TO CART (NO DUPLICATES)
        // ==========================================================
        const existingItem = await database.PharmacyCartItem.findOne({
          where: {
            cart_id: cart.id,
            product_id: bestMatch.id,
            pharmacy_id: pharmacyId
          }
        });

        if (!existingItem) {
          await database.PharmacyCartItem.create({
            cart_id: cart.id,
            product_id: bestMatch.id,
            pharmacy_id: pharmacyId,          // ⭐ REQUIRED BY DB
            quantity: quantity,               // ⭐ correct column
            price: bestMatch.selling_price
          });
        }

        results.matches.push({
          original_line: line,
          matched_product: bestMatch,
          parsed_details: {
            dosage_text: dosage,
            quantity_inferred: quantity
          }
        });
      }

      // ==========================================================
      // ⭐ FINAL RESPONSE
      // ==========================================================
      return res.status(httpStatus.OK).json(
        new APIResponse(results, "Prescription parsed and added to cart", httpStatus.OK)
      );
    } catch (error) {
      console.error("Prescription Parse Error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(
        new APIResponse({}, "Server error", httpStatus.INTERNAL_SERVER_ERROR)
      );
    }
  }
}

export default new PrescriptionController();
