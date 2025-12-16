// src/features/tailor-join/services/validators.js

export const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/; // Adjust regex as per phone number format
    return phoneRegex.test(phone);
};

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateRequiredField = (value) => {
    return value.trim() !== '';
};

export const validatePassword = (password) => {
    return password.length >= 6; // Minimum password length
};

export const validateShopName = (shopName) => {
    return validateRequiredField(shopName) && shopName.length <= 50; // Max length for shop name
};

export const validateLocation = (location) => {
    return validateRequiredField(location);
};

export const validateSpecialization = (specializationOptions) => {
    return Array.isArray(specializationOptions) && specializationOptions.length > 0;
};