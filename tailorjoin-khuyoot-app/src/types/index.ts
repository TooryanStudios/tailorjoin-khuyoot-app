// This file exports TypeScript types and interfaces used within the Tailor Join feature.

export interface TailorFormData {
    phone: string;
    shopName: string;
    email: string;
    password: string;
    confirmPassword: string;
    region: string;
    location: string;
    specializationOptions: Array<'male' | 'female'>;
    preferredLanguage: 'ar' | 'en';
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
        whatsapp: boolean;
    };
    accountKind: 'tailor' | 'shop' | 'boutique';
    acceptingOrders: boolean;
}

export interface Product {
    localId: string;
    name: string;
    price: number;
    images: string[];
    category: string;
}

export interface Uploads {
    boardImageFile: File | null;
    boardImageUrl: string;
    profileImageUrl: string;
    boardPreviewUrl: string | null; // object URL
}