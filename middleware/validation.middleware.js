const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// Custom validators
const customValidators = {
  isPhoneNumber: (value) => {
    const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
    return phoneRegex.test(value.replace(/\D/g, ''));
  },
  
  isStrongPassword: (value) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(value);
  },
  
  isFutureDate: (value) => {
    return new Date(value) > new Date();
  },
  
  isPrice: (value) => {
    return /^\d+(\.\d{1,2})?$/.test(value) && parseFloat(value) > 0;
  }
};

module.exports = {
  validate,
  ...customValidators
};// placeholder
