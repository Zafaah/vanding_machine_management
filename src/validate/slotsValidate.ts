import Joi from "joi";
import { objectId } from "../middlewares/validation";

// Slot Validation
export const slotValidate = Joi.object({
  trayId: objectId.required().messages({
    'string.empty': 'Tray ID is required',
    'any.required': 'Tray ID is required',
    'string.pattern.name': 'Invalid Tray ID format',
  }),
  skuId: objectId.required().messages({
    'string.empty': 'SKU ID is required',
    'any.required': 'SKU ID is required',
    'string.pattern.name': 'Invalid SKU ID format',
  }),
  quantityOnhand: Joi.number().integer().min(0).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity cannot be negative',
    'any.required': 'Quantity is required',
  }),
});
