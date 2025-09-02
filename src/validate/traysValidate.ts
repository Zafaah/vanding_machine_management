import Joi from "joi";
import { objectId } from "../middlewares/validation";

// Tray Validation
export const trayValidate = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  machineId: objectId.required().messages({
    'string.empty': 'Machine ID is required',
    'any.required': 'Machine ID is required',
    'string.pattern.name': 'Invalid Machine ID format',
  }),
  slots: Joi.array().items(objectId).default([]),
});

export const idParamSchema = Joi.object({
  id: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      'string.length': 'ID must be 24 characters',
      'string.hex': 'ID must be a valid hex string',
      'any.required': 'ID is required',
    }),
});


