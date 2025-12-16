// src/features/tailor-join/utils/validation.js

/**
 * Validation utilities for tailor join form
 */

export function validatePhone(phone) {
  // Oman phone format: +968 XXXXXXXX or 968XXXXXXXX or XXXXXXXX
  const phoneRegex = /^(\+?968)?[79]\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateStep1(formData, language = 'ar') {
  const errors = {};
  const messages = {
    ar: {
      phoneRequired: 'رقم الهاتف مطلوب',
      phoneInvalid: 'رقم الهاتف غير صالح',
      emailInvalid: 'البريد الإلكتروني غير صالح',
      shopNameRequired: 'اسم المحل مطلوب',
      regionRequired: 'المنطقة مطلوبة',
      locationRequired: 'الموقع مطلوب',
      genderRequired: 'التخصص مطلوب'
    },
    en: {
      phoneRequired: 'Phone number is required',
      phoneInvalid: 'Invalid phone number',
      emailInvalid: 'Invalid email address',
      shopNameRequired: 'Shop name is required',
      regionRequired: 'Region is required',
      locationRequired: 'Location is required',
      genderRequired: 'Specialization is required'
    }
  };
  
  const msg = messages[language] || messages.ar;
  
  // Phone validation
  if (!formData.phone) {
    errors.phone = msg.phoneRequired;
  } else if (!validatePhone(formData.phone)) {
    errors.phone = msg.phoneInvalid;
  }
  
  // Email validation (optional but must be valid if provided)
  if (formData.email && !validateEmail(formData.email)) {
    errors.email = msg.emailInvalid;
  }
  
  // Shop name validation
  if (!formData.shopName || formData.shopName.trim().length === 0) {
    errors.shopName = msg.shopNameRequired;
  }
  
  // Region validation
  if (!formData.region) {
    errors.region = msg.regionRequired;
  }
  
  // Location validation
  if (!formData.location || formData.location.trim().length === 0) {
    errors.location = msg.locationRequired;
  }
  
  // Gender/specialization validation
  if (!formData.gender) {
    errors.gender = msg.genderRequired;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateStep2(products, language = 'ar') {
  const errors = {};
  const messages = {
    ar: {
      noProducts: 'يرجى إضافة منتج واحد على الأقل',
      productNameRequired: 'اسم المنتج مطلوب',
      productPriceRequired: 'سعر المنتج مطلوب',
      productPriceInvalid: 'السعر يجب أن يكون رقماً موجباً',
      productImagesRequired: 'يرجى إضافة صورة واحدة على الأقل للمنتج'
    },
    en: {
      noProducts: 'Please add at least one product',
      productNameRequired: 'Product name is required',
      productPriceRequired: 'Product price is required',
      productPriceInvalid: 'Price must be a positive number',
      productImagesRequired: 'Please add at least one image for the product'
    }
  };
  
  const msg = messages[language] || messages.ar;
  
  // Check if products array is empty
  if (!products || products.length === 0) {
    errors.general = msg.noProducts;
    return { isValid: false, errors };
  }
  
  // Validate each product
  products.forEach((product, index) => {
    const productErrors = {};
    
    if (!product.name || product.name.trim().length === 0) {
      productErrors.name = msg.productNameRequired;
    }
    
    if (!product.price) {
      productErrors.price = msg.productPriceRequired;
    } else if (isNaN(product.price) || Number(product.price) <= 0) {
      productErrors.price = msg.productPriceInvalid;
    }
    
    if (!product.images || product.images.length === 0) {
      productErrors.images = msg.productImagesRequired;
    }
    
    if (Object.keys(productErrors).length > 0) {
      errors[`product_${index}`] = productErrors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateFinalSubmit(formData, products, language = 'ar') {
  const step1Validation = validateStep1(formData, language);
  const step2Validation = validateStep2(products, language);
  
  const errors = {
    ...step1Validation.errors,
    ...step2Validation.errors
  };
  
  // Additional checks
  const messages = {
    ar: {
      boardImageRequired: 'صورة اللوحة مطلوبة'
    },
    en: {
      boardImageRequired: 'Board image is required'
    }
  };
  
  const msg = messages[language] || messages.ar;
  
  if (!formData.boardImage && !formData.boardImageFile) {
    errors.boardImage = msg.boardImageRequired;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
