// src/features/tailor-join/hooks/useJoinForm.js

import { useState } from 'react';

/**
 * Main form state management hook for tailor join flow
 */
export function useJoinForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    phone: '',
    email: '',
    shopName: '',
    region: '',
    location: '',
    gender: '', // 'male' or 'female'
    specializations: [],
    preferredLanguage: 'ar',
    workingHours: {
      from: '',
      to: '',
      days: []
    },
    deliveryAvailable: false,
    homeVisitAvailable: false,
    acceptingOrders: true,
    
    // Images
    boardImageFile: null,
    boardImage: '',
    profileImageFile: null,
    profileImage: '',
    
    // Optional fields
    bio: '',
    experience: '',
    services: [],
    socialMedia: {},
    priceRange: {
      min: null,
      max: null,
      currency: 'OMR'
    }
  });

  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});

  /**
   * Update form data
   */
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Update nested field (e.g., workingHours.from)
   */
  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  /**
   * Add product
   */
  const addProduct = (product) => {
    setProducts(prev => [...prev, {
      ...product,
      id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }]);
  };

  /**
   * Update product
   */
  const updateProduct = (productId, updates) => {
    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, ...updates } : p)
    );
  };

  /**
   * Remove product
   */
  const removeProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  /**
   * Navigate to next step
   */
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /**
   * Go to specific step
   */
  const goToStep = (step) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      phone: '',
      email: '',
      shopName: '',
      region: '',
      location: '',
      gender: '',
      specializations: [],
      preferredLanguage: 'ar',
      workingHours: {
        from: '',
        to: '',
        days: []
      },
      deliveryAvailable: false,
      homeVisitAvailable: false,
      acceptingOrders: true,
      boardImageFile: null,
      boardImage: '',
      profileImageFile: null,
      profileImage: '',
      bio: '',
      experience: '',
      services: [],
      socialMedia: {},
      priceRange: {
        min: null,
        max: null,
        currency: 'OMR'
      }
    });
    setProducts([]);
    setErrors({});
    setCurrentStep(1);
  };

  return {
    // State
    currentStep,
    formData,
    products,
    errors,
    
    // Actions
    updateFormData,
    updateNestedField,
    addProduct,
    updateProduct,
    removeProduct,
    setErrors,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    
    // Bulk updates
    setFormData,
    setProducts
  };
}
