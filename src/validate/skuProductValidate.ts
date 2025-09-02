import Joi from "joi";

  export const skuProductValidate = Joi.object({
    name: Joi.string().trim().required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),
    price: Joi.number().min(0).required().messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
    quantity: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative',
    }),
  });

  export const validateSKUProduct = (data: any) => {
    return skuProductValidate.validate(data, { abortEarly: false });
  };
