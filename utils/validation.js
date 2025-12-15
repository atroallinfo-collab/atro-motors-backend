const validator = require('validator');

// Validation utilities
const ValidationUtils = {
  // Validate email
  isEmail: (email) => {
    return validator.isEmail(email);
  },

  // Validate phone number (Kenya format)
  isPhoneNumber: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(?:\+?254|0)?[17]\d{8}$/.test(cleaned);
  },

  // Validate password strength
  isStrongPassword: (password) => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password);
  },

  // Validate price
  isPrice: (price) => {
    return !isNaN(price) && parseFloat(price) > 0;
  },

  // Validate year
  isYear: (year) => {
    const currentYear = new Date().getFullYear();
    const numYear = parseInt(year);
    return !isNaN(numYear) && numYear >= 1990 && numYear <= currentYear + 1;
  },

  // Validate mileage
  isMileage: (mileage) => {
    const numMileage = parseInt(mileage);
    return !isNaN(numMileage) && numMileage >= 0 && numMileage <= 1000000;
  },

  // Validate URL
  isURL: (url) => {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    });
  },

  // Sanitize input
  sanitize: (input) => {
    if (typeof input === 'string') {
      return validator.escape(input.trim());
    }
    return input;
  },

  // Validate date
  isDate: (date) => {
    return !isNaN(Date.parse(date));
  },

  // Validate future date
  isFutureDate: (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today;
  },

  // Validate array of values
  isArrayOf: (array, validatorFn) => {
    if (!Array.isArray(array)) return false;
    return array.every(item => validatorFn(item));
  },

  // Validate JSON
  isJSON: (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Validate file extension
  isValidFileExtension: (filename, allowedExtensions) => {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(ext);
  },

  // Validate file size
  isValidFileSize: (size, maxSizeMB) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }
};

// Format validation errors
const formatValidationErrors = (errors) => {
  return errors.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));
};

module.exports = {
  ValidationUtils,
  formatValidationErrors
};// placeholder
