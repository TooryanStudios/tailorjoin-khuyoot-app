// Strict schema compliance, specialization semantics, object URL previews with cleanup,
// improved errors, and safer lastSubmission behavior.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { doc, setDoc, collection, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, storage } from '../../../services/firebase';
import { firebaseService } from '../../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompression';
import { useApp } from '../../../context/AppContext';

// --- STYLES FOR ANIMATION (Injected Styles) ---
const AnimationStyles = () => (
    <style>{`
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      .animate-fade-in-up { animation: fadeIn 0.6s ease-out forwards; }
    `}</style>
);

// --- ICONS (Inline SVGs) ---
const Icons = {
    Store: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Phone: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    Location: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Mail: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Upload: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    Check: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    X: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    Alert: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.1 14.02A2 2 0 003.93 21h16.14a2 2 0 001.73-3.12l-8.1-14.02a2 2 0 00-3.46 0z" /></svg>,
    ArrowRight: ({ flip }) => <svg className={`w-5 h-5 ${flip ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
    ArrowLeft: ({ flip }) => <svg className={`w-5 h-5 ${flip ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    File: () => <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

// --- UTILITY FUNCTIONS ---

// Convert Arabic/Persian numerals to English numerals
const convertArabicNumbers = (str) => {
    if (!str) return str;
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    
    return String(str).split('').map(char => {
        const arabicIndex = arabicNumerals.indexOf(char);
        if (arabicIndex !== -1) return arabicIndex.toString();
        
        const persianIndex = persianNumerals.indexOf(char);
        if (persianIndex !== -1) return persianIndex.toString();
        
        return char;
    }).join('');
};

// --- HELPER COMPONENTS ---

const StepIndicator = ({ step, totalSteps }) => (
    <div className="flex items-center justify-center w-full max-w-xs mx-auto mb-10">
        {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
                <div className={`relative flex flex-col items-center group`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 
                        ${step >= s 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                        }`}>
                        {step > s ? <Icons.Check /> : s}
                    </div>
                </div>
                {s < totalSteps && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
            </React.Fragment>
        ))}
    </div>
);

const InputField = ({ label, icon: Icon, required, ...props }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:right-0 rtl:left-auto rtl:pr-3 rtl:pl-0 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon />
                </div>
            )}
            <input
                {...props}
                className={`block w-full rounded-xl border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white transition-all duration-200 
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none
                shadow-sm py-3 ${Icon ? 'pl-10 rtl:pr-10 rtl:pl-3' : 'px-4'} ${props.className || ''}`}
            />
        </div>
    </div>
);

const ImageUpload = ({ label, onChange, previewUrl, multiple, accept, subtext }) => (
    <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</label>
        <label className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden group
            ${previewUrl 
                ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-700' 
                : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-indigo-400'
            }`}>
            
            {!previewUrl ? (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10 text-center px-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-full mb-3 text-indigo-500 shadow-sm group-hover:scale-110 group-hover:text-indigo-600 transition-all">
                        <Icons.Upload />
                    </div>
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 font-medium">Click to upload</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{subtext || 'JPG, PNG (Max 5MB)'}</p>
                </div>
            ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <p className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">Change Image</p>
                    </div>
                </div>
            )}
            <input type="file" className="hidden" onChange={onChange} multiple={multiple} accept={accept} />
        </label>
    </div>
);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatAuthErrorMessage = (authError) => {
    if (!authError) {
        return 'تعذر إنشاء الحساب. حاول مجددًا لاحقًا.\nUnable to create the account. Please try again later.';
    }
    switch (authError.code) {
        case 'auth/network-request-failed':
            return 'فشل الاتصال بالانترنت. تأكد من جودة الشبكة ثم أعد المحاولة.\nNetwork connection failed. Check your connection and retry.';
        case 'auth/email-already-in-use':
            return 'البريد الإلكتروني مستخدم مسبقًا. استخدم بريدًا آخر أو سجّل الدخول.\nEmail already in use. Use a different email or sign in.';
        case 'auth/invalid-email':
            return 'البريد الإلكتروني غير صالح.\nInvalid email address.';
        case 'auth/weak-password':
            return 'كلمة المرور ضعيفة جدًا. استخدم 6 أحرف على الأقل.\nPassword is too weak. Use at least 6 characters.';
        default:
            return `خطأ في إنشاء الحساب: ${authError.message}\nAccount creation error: ${authError.message}`;
    }
};

// Build compliant user document matching example schema with defaults
function buildUserDoc({ uid, formData, boardImageUrl, profileImageUrl }) {
    const ts = serverTimestamp();

    // Specialization: only 'male' or 'female'
    const specialization = formData.specializationOptions && formData.specializationOptions.length > 0
        ? formData.specializationOptions[0]
        : '';

    return {
        // Identity
        id: uid,
        uid: uid,
        loginId: formData.phone,
        role: 'tailor',
        shopType: 'tailor',

        // Contact / Names
        phone: formData.phone,
        email: formData.email || '',
        shopName: formData.shopName,
        name: formData.shopName,

        // Preferences
        preferredLanguage: formData.preferredLanguage || 'ar',
        notificationPreferences: formData.notificationPreferences || {
            email: true, sms: true, push: true, whatsapp: true
        },

        // Working hours (string days)
        workingHours: { days: 'السبت - الخميس', from: '09:00', to: '18:00' },

        // Services
        deliveryAvailable: false,
        homeVisitAvailable: false,
        acceptingOrders: true,

        // Location
        serviceAreas: formData.region ? [formData.region] : [],
        location: formData.location || '',
        region: formData.region || '',
        coordinates: { lat: 0, lng: 0 },

        // Specialization (schema expects gender-like values)
        specialization: specialization,
        specializations: specialization ? [specialization] : [],

        // Images
        boardImage: boardImageUrl || '',
        profileImage: profileImageUrl || '',

        // Security (no passwords stored)
        authProvider: 'password',
        isEmailVerified: false,
        isPhoneVerified: false,
        passwordUpdatedAt: null,
        requirePasswordChange: false,

        // Account status / meta
        accountStatus: 'active',
        dataVersion: 1,
        createdByAdmin: false,
        verificationStatus: 'verified',
        approvalStatus: 'approved',

        // Timestamps
        createdAt: ts,
        updatedAt: ts,
        joinDate: ts,
        lastLoginAt: null,

        // Profile
        bio: '',
        ageGroup: '',
        experience: '',

        // Legal & safety
        termsAcceptedAt: null,
        privacyAcceptedAt: null,
        reportsCount: 0,
        blockedByAdmin: false,
        isVisible: true,

        // Business
        services: [],
        businessLicense: '',
        verificationDocuments: [],
        socialMedia: { instagram: '', tiktok: '', snapchat: '', website: '' },

        // Pricing
        priceRange: { min: 0, max: 0, currency: 'SAR' },

        // Capacity
        maxActiveOrders: 10,

        // Ratings
        ratingAvg: 0,
        ratingCount: 0,
        completedOrdersCount: 0,

        // Featured
        isFeatured: false,

        // Subscription
        subscription: { tier: 'free', expiresAt: null }
    };
}

export default function TailorJoinFlow() {
    // Temporarily disable new registrations per request
    const REGISTRATION_DISABLED = true;
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();
    const { appSettings } = useApp();

    // Load hierarchical categories from Firestore (used for gender-specific level-2 filtering)
    const [firestoreProductCategories, setFirestoreProductCategories] = useState(null);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categoriesError, setCategoriesError] = useState(null);

    const loadCategories = async () => {
        setCategoriesLoading(true);
        setCategoriesError(null);
        try {
            if (!firebaseService?.isInitialized?.()) {
                setFirestoreProductCategories([]);
                return;
            }
            const snap = await getDocs(query(collection(db, 'productCategories'), orderBy('order', 'asc')));
            const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setFirestoreProductCategories(cats);
        } catch (e) {
            console.error('Failed to load productCategories from Firestore:', e);
            setCategoriesError('فشل تحميل التصنيفات. Failed to load categories.');
            setFirestoreProductCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            await loadCategories();
            if (cancelled) return;
        };
        if (!REGISTRATION_DISABLED) {
            init();
        } else {
            setFirestoreProductCategories([]);
            setCategoriesLoading(false);
        }
        return () => { cancelled = true; };
    }, []);

    if (REGISTRATION_DISABLED) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-xl mx-auto text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 shadow">
                    <div className="text-amber-700 dark:text-amber-200 font-bold text-lg mb-2">
                        🧵 بوابة انضمام الخياطين
                    </div>
                    <p className="text-amber-800 dark:text-amber-100 text-sm">
                        نقوم حالياً باختبار نظام الانضمام. سنعود قريباً عندما نكون جاهزين لاستقبال الطلبات.
                        شكراً لتفهمكم.
                    </p>
                </div>
            </div>
        );
    }

    const baseProductCategories = useMemo(() => {
        if (Array.isArray(firestoreProductCategories) && firestoreProductCategories.length > 0) return firestoreProductCategories;
        if (appSettings && Array.isArray(appSettings.productCategories) && appSettings.productCategories.length > 0) return appSettings.productCategories;
        return [{ id: 'dishdasha', name: 'Dishdasha' }];
    }, [firestoreProductCategories, appSettings]);

    const getCategoryDisplayName = (cat) => {
        if (!cat) return '';
        return String(cat.nameAr || cat.name || cat.nameEn || cat.title || cat.id || '').trim();
    };

    const defaultPw = (appSettings && appSettings.tailorDefaultPassword) ? appSettings.tailorDefaultPassword : '123456';

    // Parse step from URL params, default to 0 (welcome), clamp to 1-3 when present
    const urlStep = params.step ? Math.max(1, Math.min(3, parseInt(params.step, 10) || 1)) : null;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [duplicatePhone, setDuplicatePhone] = useState('');
    const [success, setSuccess] = useState(false);
    const [uploadWarnings, setUploadWarnings] = useState([]);
    const [lang, setLang] = useState('ar');
    // We handle RTL via a wrapper div, but keeping these for specific overrides if needed
    const isRtl = lang === 'ar';
    const [lastSubmission, setLastSubmission] = useState(null);
    const [autoRestored, setAutoRestored] = useState(false);

    const restoreFromSnapshot = (snapshot) => {
        if (!snapshot) return;
        const lsForm = snapshot.formData || {};
        setFormData(prev => ({
            ...prev,
            phone: lsForm.phone || prev.phone,
            shopName: lsForm.shopName || prev.shopName,
            email: lsForm.email || prev.email,
            region: lsForm.region || prev.region,
            location: lsForm.location || prev.location,
            specializationOptions: Array.isArray(lsForm.specializationOptions) ? lsForm.specializationOptions : prev.specializationOptions,
            preferredLanguage: lsForm.preferredLanguage || prev.preferredLanguage,
            accountKind: lsForm.accountKind || prev.accountKind,
            acceptingOrders: typeof lsForm.acceptingOrders === 'boolean' ? lsForm.acceptingOrders : prev.acceptingOrders,
        }));
        if (snapshot.uid) setUid(snapshot.uid);
        if (snapshot.boardImageUrl) {
            setUploads(prev => ({ ...prev, boardPreviewUrl: snapshot.boardImageUrl }));
        }
        if (Array.isArray(snapshot.products) && snapshot.products.length > 0) {
            const restored = snapshot.products.map(p => ({
                localId: `restored_${p.localId || Math.random().toString(36).slice(2, 8)}`,
                name: p.name || '',
                price: p.price ?? '',
                images: [],
                category: p.category || '',
            }));
            setProducts(restored);
        }
    };
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Step state synced from URL (0 = welcome screen)
    const [step, setStep] = useState(urlStep || 0);
    const [uid, setUid] = useState('');
    const [submitProgress, setSubmitProgress] = useState({ percent: 0, message: '' });

    const [formData, setFormData] = useState({
        phone: '',
        shopName: '',
        email: '',
        password: '',
        confirmPassword: '',
        region: '',
        location: '',
        specializationOptions: [], // only ['male'] or ['female']
        preferredLanguage: 'ar',
        notificationPreferences: { email: true, sms: true, push: true, whatsapp: true },
        accountKind: 'tailor',
        acceptingOrders: true,
    });

    const [uploads, setUploads] = useState({
        boardImageFile: null,
        boardImageUrl: '',
        profileImageUrl: '',
        boardPreviewUrl: null, // object URL
    });

    const [products, setProducts] = useState([]);
    const [productPreviews, setProductPreviews] = useState({}); // localId -> array of object URLs
    const previewUrlsRef = useRef({ board: null, products: {} });

    const selectedGender = (Array.isArray(formData?.specializationOptions) && formData.specializationOptions.length > 0)
        ? formData.specializationOptions[0]
        : '';

    const productCategories = useMemo(() => {
        // If categories come from settings (flat list), keep existing behavior.
        const looksHierarchical = (baseProductCategories || []).some(c => Object.prototype.hasOwnProperty.call(c || {}, 'level') || Object.prototype.hasOwnProperty.call(c || {}, 'parentId'));
        if (!looksHierarchical) {
            return (baseProductCategories || []).map(c => ({ id: c.id, name: getCategoryDisplayName(c) }));
        }

        const byId = new Map();
        for (const c of (baseProductCategories || [])) {
            if (c && c.id) byId.set(c.id, c);
        }

        const norm = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, '');
        const matchGenderRoot = (c, gender) => {
            const ar = norm(c?.nameAr);
            const en = norm(c?.nameEn);
            if (gender === 'male') {
                return ar.includes(norm('الملابس الرجالية')) || ar.includes(norm('ملابس رجالية')) || en.includes('men');
            }
            if (gender === 'female') {
                return ar.includes(norm('الملابس النسائية')) || ar.includes(norm('ملابس نسائية')) || en.includes('women') || en.includes('female');
            }
            return false;
        };

        const root = (baseProductCategories || []).find(c => matchGenderRoot(c, selectedGender));
        const rootId = root?.id || null;

        const isDescendantOf = (catId, ancestorId) => {
            if (!ancestorId || !catId) return false;
            const visited = new Set();
            let current = byId.get(catId);
            while (current && current.parentId) {
                if (visited.has(current.id)) return false;
                visited.add(current.id);
                if (current.parentId === ancestorId) return true;
                current = byId.get(current.parentId);
            }
            return false;
        };

        const level2 = (baseProductCategories || [])
            .filter(c => (c?.isActive !== false))
            .filter(c => {
                const level = typeof c?.level === 'number' ? c.level : parseInt(c?.level, 10);
                return level === 2;
            })
            .filter(c => {
                if (!rootId) return true;
                return isDescendantOf(c.id, rootId);
            })
            .sort((a, b) => {
                const ao = typeof a?.order === 'number' ? a.order : 0;
                const bo = typeof b?.order === 'number' ? b.order : 0;
                return ao - bo;
            })
            .map(c => ({ id: c.id, name: getCategoryDisplayName(c) }));

        return level2.length > 0 ? level2 : (baseProductCategories || []).map(c => ({ id: c.id, name: getCategoryDisplayName(c) }));
    }, [baseProductCategories, selectedGender]);

    const prevGenderRef = useRef('');
    useEffect(() => {
        if (!selectedGender) return;
        if (prevGenderRef.current === selectedGender) return;
        prevGenderRef.current = selectedGender;
        const allowed = new Set((productCategories || []).map(c => c.id));
        setProducts(list => list.map(p => (p.category && !allowed.has(p.category)) ? ({ ...p, category: '' }) : p));
    }, [selectedGender, productCategories]);

    const categoryNameById = useMemo(() => {
        const map = new Map();
        for (const c of (baseProductCategories || [])) {
            if (c && c.id) map.set(c.id, getCategoryDisplayName(c));
        }
        return map;
    }, [baseProductCategories]);

    // Sync step state from URL params
    useEffect(() => {
        if (urlStep && urlStep !== step) {
            setStep(urlStep);
        }
    }, [urlStep, step]);

    // Auto-dismiss error after 5s
    useEffect(() => {
        if (!error) return;
        const id = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(id);
    }, [error]);

    // Track online/offline state
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const update = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrlsRef.current.board) {
                URL.revokeObjectURL(previewUrlsRef.current.board);
            }
            Object.values(previewUrlsRef.current.products).forEach(urls => {
                urls.forEach(url => URL.revokeObjectURL(url));
            });
        };
    }, []);

    // Load last submission snapshot
    useEffect(() => {
        try {
            const raw = localStorage.getItem('tailorJoinLastSubmission');
            if (raw) setLastSubmission(JSON.parse(raw));
        } catch {
            setLastSubmission(null);
        }
    }, []);

    // Auto-restore saved data if present
    useEffect(() => {
        if (!lastSubmission || autoRestored) return;
        if (step === 0) {
            setStep(1);
        }
        restoreFromSnapshot(lastSubmission);
        setAutoRestored(true);
    }, [lastSubmission, step, autoRestored]);

    const resetToFirstPage = () => {
        navigate('/join-tailor/step-1');
        setSuccess(false);
        setUploadWarnings([]);
        setSubmitProgress({ percent: 0, message: '' });
        setUid('');
        if (previewUrlsRef.current.board) {
            URL.revokeObjectURL(previewUrlsRef.current.board);
            previewUrlsRef.current.board = null;
        }
        setUploads({ boardImageFile: null, boardImageUrl: '', profileImageUrl: '', boardPreviewUrl: null });
        Object.keys(previewUrlsRef.current.products).forEach(k => {
            (previewUrlsRef.current.products[k] || []).forEach(url => URL.revokeObjectURL(url));
        });
        previewUrlsRef.current.products = {};
        setProducts([]);
        setProductPreviews({});
        setFormData({
            phone: '', shopName: '', email: '', region: '', location: '', specializationOptions: [], preferredLanguage: lang,
            notificationPreferences: { email: true, sms: true, push: true, whatsapp: true }, accountKind: 'tailor', acceptingOrders: true,
        });
    };

    const goAddMoreProducts = () => { setSuccess(false); navigate('/join-tailor/step-2'); };

    const nextStep = () => {
        const nextStepNum = Math.min(3, step + 1);
        setStep(nextStepNum);
        navigate(`/join-tailor/${nextStepNum}`);
    };

    const prevStep = () => {
        if (step <= 1) {
            setStep(0);
            navigate('/join-tailor');
            return;
        }
        const prevStepNum = Math.max(1, step - 1);
        navigate(`/join-tailor/step-${prevStepNum}`);
    };

    const t = (key) => {
        const dict = {
            title: { ar: 'انضم لعائلة خيوط', en: 'Join the Khuyoot family' },
            subtitle: { ar: 'أنشئ معرضك الإلكتروني في دقائق', en: 'Create your online showroom in minutes' },
            welcome_title: { ar: 'انضم لعائلة خيوط', en: 'Welcome to Khuyoot' },
            welcome_desc: { ar: 'أنشئ معرضك الإلكتروني في دقائق', en: 'Join the largest tailor platform. Register your shop and start showcasing products to thousands of customers.' },
            welcome_start: { ar: 'ابدأ التسجيل', en: 'Start Registration' },
            offline_banner: { ar: 'لا يوجد اتصال بالانترنت. بعض الخطوات ستتوقف حتى تعود الشبكة.', en: 'You are offline. Some steps are paused until connectivity returns.' },
            offline_submit: { ar: 'لا يمكن الإرسال بدون اتصال. تأكد من الشبكة ثم أعد المحاولة.', en: 'Submission requires an internet connection. Check your network and retry.' },
            account_tailor: { ar: 'خياط', en: 'Tailor' },
            account_shop: { ar: 'محل أقمشة', en: 'Fabric Shop' },
            account_boutique: { ar: 'بوتيك', en: 'Boutique' },
            phone_label: { ar: 'رقم الهاتف', en: 'Phone Number' },
            phone_placeholder: { ar: '9XXXXXXX', en: '9XXXXXXX' },
            shop_label: { ar: 'اسم المحل', en: 'Shop Name' },
            email_label: { ar: 'الايميل (اختياري)', en: 'Email (Optional)' },
            region_label: { ar: 'المنطقة', en: 'Region' },
            location_label: { ar: 'الموقع', en: 'Location' },
            specialization_label: { ar: 'التخصص', en: 'Specialization' },
            male: { ar: 'رجالي', en: 'Male' },
            female: { ar: 'نسائي', en: 'Female' },
            board_label: { ar: 'صورة الواجهة / الشعار', en: 'Cover Image / Logo' },
            next: { ar: 'التالي', en: 'Next' },
            back: { ar: 'رجوع', en: 'Back' },
            add_product: { ar: 'إضافة منتج جديد', en: 'Add New Product' },
            add_another_product: { ar: 'إضافة منتج آخر', en: 'Add Another' },
            products_title: { ar: 'قائمة المنتجات', en: 'Product List' },
            products_hint: { ar: 'المنتجات مثل عباية فستان مخور وغيره', en: 'Products like abaya, dress, mukhawar, etc.' },
            product_name_ph: { ar: 'اسم المنتج', en: 'Product Name' },
            price_ph: { ar: 'السعر', en: 'Price' },
            product_images_label: { ar: 'صور المنتج', en: 'Product Images' },
            review_title: { ar: 'مراجعة البيانات', en: 'Review Information' },
            submit: { ar: 'تأكيد وإنشاء الحساب', en: 'Confirm & Create Account' },
            submitting: { ar: 'جارٍ الإنشاء...', en: 'Creating...' },
            success_title: { ar: 'تم التسجيل بنجاح!', en: 'Registration Successful!' },
            success_desc: { ar: 'تم إنشاء حسابك وإضافة منتجاتك.\nسيتم التواصل معكم فور جاهزية الموقع للإطلاق الرسمي\nشكرا لكم', en: 'Account created and products added.\nWe will contact you once the website is ready for official launch.\nThank you' },
            go_first: { ar: 'العودة للرئيسية', en: 'Go Home' },
            add_more: { ar: 'إضافة المزيد', en: 'Add More' },
            saved_locally: { ar: 'تم حفظ المسودة محلياً.', en: 'Draft saved locally.' },
            saved_last_banner: { ar: 'لديك تسجيل سابق غير مكتمل', en: 'You have an incomplete registration' },
            auto_restored: { ar: 'تم استرجاع البيانات السابقة تلقائياً.', en: 'Previous data restored automatically.' },
            restore_data: { ar: 'استرجاع', en: 'Restore' },
            clear_saved: { ar: 'مسح', en: 'Clear' },
            duplicate_phone_registered: { ar: 'هذا الرقم مسجل مسبقاً.', en: 'This phone number is already registered.' },
            login_now: { ar: 'تسجيل الدخول', en: 'Log in' },
            close: { ar: 'إغلاق', en: 'Close' },
            supported_formats_short: { ar: 'الصيغ المدعومة: JPG, PNG', en: 'Supported formats: JPG, PNG' },
            error_unsupported_image: { ar: 'صيغة الصورة غير مدعومة.', en: 'Unsupported image format.' },
            error_image_too_large: { ar: 'حجم الصورة أكبر من 5MB.', en: 'Image size exceeds 5MB.' },
            error_file: { ar: 'الملف', en: 'File' },
            images_skipped_title: { ar: 'تم تخطي بعض الصور ولم تتم إضافتها:', en: 'Some images were skipped and not added:' },
            upload_warnings_title: { ar: 'تنبيه: بعض الصور لم تُرفع ولم تُضاف للمنتجات:', en: 'Warning: some images failed to upload and were not added to products:' },
            add_more_images: { ar: 'إضافة صور', en: 'Add images' },
            max_images_reached: { ar: 'الحد الأقصى 10 صور لكل منتج.', en: 'Maximum 10 images per product.' },
            images_count: { ar: 'صور', en: 'images' },
            add_image: { ar: 'إضافة صورة', en: 'Add image' },
            max_images_hint: { ar: 'حتى 10 صور', en: 'Up to 10 images' },
            welcome_b1: { ar: 'بيانات المتجر', en: 'Shop Details' },
            welcome_b2: { ar: 'إضافة المنتجات', en: 'Add Products' },
            welcome_b3: { ar: 'المراجعة', en: 'Review' },
            category_label: { ar: 'التصنيف', en: 'Category' },
            choose_option: { ar: 'اختر...', en: 'Select...' },
            remove_product: { ar: 'حذف', en: 'Remove' },
            review_note: { ar: 'يرجى التأكد من صحة البيانات قبل الإرسال.', en: 'Please ensure data is correct before submitting.' },
            data_summary: { ar: 'ملخص الحساب', en: 'Account Summary' },
            uid_label: { ar: 'المعرف', en: 'ID' },
            auto_generated: { ar: '(تلقائي)', en: '(auto)' },
            phone_login_label: { ar: 'الهاتف', en: 'Phone' },
            shop_name_label: { ar: 'المحل', en: 'Shop' },
            email_short: { ar: 'الايميل', en: 'Email' },
            email_temp_label: { ar: 'ايميل مؤقت', en: 'Temp Email' },
            account_type_label: { ar: 'النوع', en: 'Type' },
            region_value_label: { ar: 'المنطقة', en: 'Region' },
            not_specified: { ar: 'غير محدد', en: 'N/A' },
            none: { ar: 'لا يوجد', en: 'None' },
            board_image_label: { ar: 'صورة الواجهة', en: 'Cover Img' },
            storage_label: { ar: 'المسار', en: 'Path' },
            products_header: { ar: 'المنتجات', en: 'Products' },
        };
        return (dict[key] && dict[key][lang]) || key;
    };

    const normalizePhone = (phone) => {
        let digits = (phone || '').replace(/[^0-9]/g, '');
        if (digits.startsWith('968')) digits = digits.slice(3);
        return digits;
    };

    const generateTempEmailFromPhone = (phoneDigits) => {
        const digits = (phoneDigits || '').replace(/[^0-9]/g, '');
        return `${digits}@khuyoot.app`;
    };

    const validateStep1 = () => {
        const errors = [];
        if (!formData.phone || !formData.phone.trim()) {
            errors.push('رقم الهاتف مطلوب / Phone number required');
        } else if (normalizePhone(formData.phone).length < 8) {
            errors.push('رقم هاتف غير صحيح / Invalid phone number');
        }
        if (!formData.shopName || !formData.shopName.trim()) {
            errors.push('اسم المحل مطلوب / Shop name required');
        }
        // Board image required only if none is already available as preview
        if (!uploads.boardImageFile && !uploads.boardPreviewUrl) {
            errors.push('صورة لوحة المحل مطلوبة / Board image required');
        }
        if (!formData.location || !formData.location.trim()) {
            errors.push('الموقع مطلوب / Location is required');
        }
        return errors;
    };

    const validateStep2 = () => {
        const errors = [];
        if (products.length === 0) {
            errors.push('أضف منتجًا واحدًا على الأقل / Add at least one product');
            return errors;
        }
        products.forEach((p, idx) => {
            if (!p.name || !p.name.trim()) {
                errors.push(`منتج ${idx + 1}: الاسم مطلوب / Product ${idx + 1}: Name required`);
            }
            if (p.price === '' || p.price === null || p.price === undefined) {
                errors.push(`منتج ${idx + 1}: السعر مطلوب / Product ${idx + 1}: Price required`);
            } else {
                const convertedPrice = convertArabicNumbers(p.price);
                const numPrice = Number(convertedPrice);
                if (isNaN(numPrice) || numPrice < 0) {
                    errors.push(`منتج ${idx + 1}: السعر يجب أن يكون رقم صحيح / Product ${idx + 1}: Price must be a valid number`);
                }
            }
            if (!p.images || p.images.length === 0) {
                errors.push(`منتج ${idx + 1}: أضف صورة واحدة على الأقل / Product ${idx + 1}: Add at least one image`);
            }
            if (!p.category || !p.category.trim()) {
                errors.push(`منتج ${idx + 1}: اختر التصنيف / Product ${idx + 1}: Choose a category`);
            }
        });
        return errors;
    };

    const handleSubmitStep1 = async (e) => {
        e.preventDefault();
        setError(null);
        const errors = validateStep1();
        if (errors.length > 0) { setError(errors.join('\n')); return; }
        const userRef = doc(collection(db, 'users'));
        const newUid = userRef.id;
        setUid(newUid);
        const normalized = normalizePhone(formData.phone);
        setFormData(prev => ({ ...prev, phone: normalized }));
        nextStep();
    };

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
    const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/jpg,image/png';

    const shortenFileName = (name, maxLen = 32) => {
        const safe = String(name || '');
        if (safe.length <= maxLen) return safe;
        const head = Math.max(10, Math.floor(maxLen / 2) - 1);
        const tail = Math.max(8, maxLen - head - 1);
        return `${safe.slice(0, head)}…${safe.slice(-tail)}`;
    };

    const formatFileInfo = (file) => {
        if (!file) return '';
        const fileName = shortenFileName(file.name);
        const fileType = file.type ? file.type.replace('image/', '').toUpperCase() : '';
        return fileType ? `${fileName} (${fileType})` : fileName;
    };

    const handleBoardImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError(`${t('error_unsupported_image')} ${t('supported_formats_short')}\n${t('error_file')}: ${formatFileInfo(file)}`);
            return;
        }
        if (file.size > MAX_SIZE) {
            setError(`${t('error_image_too_large')}\n${t('error_file')}: ${formatFileInfo(file)}`);
            return;
        }
        if (previewUrlsRef.current.board) {
            URL.revokeObjectURL(previewUrlsRef.current.board);
        }
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.board = url;
        setUploads(prev => ({ ...prev, boardImageFile: file, boardPreviewUrl: url }));
    };

    const removeProductImage = (localId, index) => {
        const existingUrls = previewUrlsRef.current.products[localId] || [];
        const url = existingUrls[index];
        if (url) {
            try { URL.revokeObjectURL(url); } catch { }
        }
        const nextUrls = existingUrls.filter((_, i) => i !== index);
        previewUrlsRef.current.products[localId] = nextUrls;
        setProductPreviews(prev => ({ ...prev, [localId]: nextUrls }));
        setProducts(list => {
            const copy = [...list];
            const idx = copy.findIndex(p => p.localId === localId);
            if (idx === -1) return copy;
            const nextFiles = (copy[idx].images || []).filter((_, i) => i !== index);
            copy[idx] = { ...copy[idx], images: nextFiles };
            return copy;
        });
    };

    const handleProductImagesChange = (localId, files) => {
        if (!files || files.length === 0) return;

        const selectedFiles = Array.from(files);
        const existingUrls = previewUrlsRef.current.products[localId] || [];
        const existingCount = existingUrls.length;
        const remaining = Math.max(0, 10 - existingCount);

        const acceptedFiles = [];
        const skipped = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const f = selectedFiles[i];

            if (acceptedFiles.length >= remaining) {
                skipped.push({ file: formatFileInfo(f), reason: t('max_images_reached') });
                continue;
            }
            if (!ALLOWED_TYPES.includes(f.type)) {
                skipped.push({ file: formatFileInfo(f), reason: `${t('error_unsupported_image')} ${t('supported_formats_short')}` });
                continue;
            }
            if (f.size > MAX_SIZE) {
                skipped.push({ file: formatFileInfo(f), reason: t('error_image_too_large') });
                continue;
            }

            acceptedFiles.push(f);
        }

        if (acceptedFiles.length === 0) {
            if (skipped.length > 0) {
                setError(`${t('images_skipped_title')}\n${skipped.map(s => `- ${s.file}: ${s.reason}`).join('\n')}`);
            }
            return;
        }

        const newUrls = acceptedFiles.map(f => URL.createObjectURL(f));
        const nextUrls = [...existingUrls, ...newUrls];
        previewUrlsRef.current.products[localId] = nextUrls;
        setProductPreviews(prev => ({ ...prev, [localId]: nextUrls }));

        setProducts(list => {
            const copy = [...list];
            const idx = copy.findIndex(p => p.localId === localId);
            if (idx === -1) return copy;
            const existingFiles = Array.isArray(copy[idx].images) ? copy[idx].images : [];
            copy[idx] = { ...copy[idx], images: [...existingFiles, ...acceptedFiles] };
            return copy;
        });

        if (skipped.length > 0) {
            setError(`${t('images_skipped_title')}\n${skipped.map(s => `- ${s.file}: ${s.reason}`).join('\n')}`);
        }
    };

    const removeProduct = (localId) => {
        const urls = previewUrlsRef.current.products[localId] || [];
        urls.forEach(url => URL.revokeObjectURL(url));
        delete previewUrlsRef.current.products[localId];
        setProducts(list => list.filter(p => p.localId !== localId));
        setProductPreviews(prev => { const n = { ...prev }; delete n[localId]; return n; });
    };

    const handleUploadBoardImage = async (userUid) => {
        const effectiveUid = userUid || uid;
        if (!effectiveUid || !uploads.boardImageFile) throw new Error('UID or board image not set');
        setSubmitProgress({ percent: 15, message: 'Compressing image...' });
        const boardFile = uploads.boardImageFile;
        const { blob, error } = await compressImage(boardFile);
        setSubmitProgress({ percent: 18, message: 'Uploading board...' });
        const shouldUseCompressed = !!blob && !error;
        const uploadData = shouldUseCompressed ? blob : boardFile;
        const contentType = shouldUseCompressed ? 'image/jpeg' : (boardFile.type || 'application/octet-stream');
        const ext = shouldUseCompressed
            ? 'jpg'
            : (boardFile.type === 'image/png' ? 'png' : 'jpg');
        const boardRef = ref(storage, `users/${effectiveUid}/board_${Date.now()}.${ext}`);
        await uploadBytes(boardRef, uploadData, { contentType });
        const boardUrl = await getDownloadURL(boardRef);
        const profileUrl = boardUrl;
        setUploads(prev => ({ ...prev, boardImageUrl: boardUrl, profileImageUrl: profileUrl }));
        return { boardUrl, profileUrl };
    };

    const handleUploadProductImages = async (productFiles, productId, productName, userUid) => {
        const effectiveUid = userUid || uid;
        const imageUrls = [];
        const failedFiles = [];
        for (const file of productFiles) {
            try {
                const { blob, error } = await compressImage(file);
                const shouldUseCompressed = !!blob && !error;
                if (!shouldUseCompressed && error) {
                    console.warn(`Failed to compress (uploading original): ${file.name}`);
                }
                const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                const uploadData = shouldUseCompressed ? blob : file;
                const contentType = shouldUseCompressed ? 'image/jpeg' : (file.type || 'application/octet-stream');
                const ext = shouldUseCompressed
                    ? 'jpg'
                    : (file.type === 'image/png' ? 'png' : 'jpg');
                const imgRef = ref(storage, `users/${effectiveUid}/products/${productId}/${fileId}.${ext}`);
                await uploadBytes(imgRef, uploadData, { contentType });
                const url = await getDownloadURL(imgRef);
                imageUrls.push(url);
            } catch (e) {
                failedFiles.push(formatFileInfo(file));
                console.warn('Failed to upload product image:', file?.name, e);
                continue;
            }
        }
        if (imageUrls.length === 0) {
            const details = failedFiles.length > 0 ? `\n${failedFiles.map(n => `- ${n}`).join('\n')}` : '';
            throw new Error(`فشل رفع صور المنتج: ${productName}. أعد المحاولة${details}`);
        }
        return { imageUrls, failedFiles };
    };

    const handleSubmitAll = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const errors = validateStep2();
            if (errors.length > 0) { setError(errors.join('\n')); setLoading(false); return; }

            const uploadIssues = [];

            const normalizedPhone = normalizePhone(formData.phone);
            const effectiveEmail = (formData.email && formData.email.trim()) ? formData.email.trim() : generateTempEmailFromPhone(normalizedPhone);

            if (!isOnline) {
                setError(t('offline_submit'));
                setLoading(false);
                return;
            }

            const currentUser = firebaseService.auth?.currentUser || null;
            let authUid = currentUser?.uid || '';
            if (!currentUser) {
                try {
                    if (firebaseService.isInitialized()) {
                        const existingByPhone = await firebaseService.findUserByLoginId(normalizedPhone);
                        if (existingByPhone) {
                            setError('Duplicate phone.');
                            setDuplicatePhone(normalizedPhone);
                            setLoading(false);
                            return;
                        }
                    }
                } catch { }
            }

            if (!currentUser) {
                setSubmitProgress({ percent: 10, message: 'Creating Account...' });
                const maxAttempts = 3;
                let credential = null;
                let lastAuthError = null;
                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        credential = await createUserWithEmailAndPassword(firebaseService.auth, effectiveEmail, defaultPw);
                        authUid = credential.user.uid;
                        await updateProfile(credential.user, { displayName: formData.shopName });
                        break;
                    } catch (authError) {
                        lastAuthError = authError;
                        if (authError.code === 'auth/network-request-failed' && attempt < maxAttempts) {
                            await wait(500 * attempt);
                            continue;
                        }
                        throw new Error(formatAuthErrorMessage(authError));
                    }
                }
                if (!credential) throw new Error(formatAuthErrorMessage(lastAuthError));
                setUid(authUid);
            } else {
                setUid(authUid);
            }

            let boardUrl = null, profileUrl = null;
            if (uploads.boardImageFile) {
                const uploaded = await handleUploadBoardImage(authUid);
                boardUrl = uploaded.boardUrl;
                profileUrl = uploaded.profileUrl;
            } else if (uploads.boardPreviewUrl) {
                boardUrl = uploads.boardPreviewUrl;
                profileUrl = uploads.boardPreviewUrl;
            }
            setSubmitProgress({ percent: 25, message: 'Saving Profile...' });
            const effectiveFormData = { ...formData, phone: normalizedPhone, email: effectiveEmail };
            const userDoc = buildUserDoc({ uid: authUid, formData: effectiveFormData, boardImageUrl: boardUrl || undefined, profileImageUrl: profileUrl || undefined });
            if (!boardUrl) { delete userDoc.boardImage; }
            if (!profileUrl) { delete userDoc.profileImage; }
            await setDoc(doc(db, 'users', authUid), userDoc, { merge: true });

            setSubmitProgress({ percent: 40, message: 'Uploading Products...' });
            const productCount = products.length;
            const progressPerProduct = 50 / productCount;
            for (let i = 0; i < products.length; i++) {
                const p = products[i];
                const productRef = doc(collection(db, `users/${authUid}/products`));
                const productId = productRef.id;
                setSubmitProgress(prev => ({ percent: Math.min(40 + (i * progressPerProduct), 90), message: `Product: ${p.name}...` }));
                const { imageUrls, failedFiles } = await handleUploadProductImages(p.images, productId, p.name, authUid);
                if (failedFiles && failedFiles.length > 0) {
                    uploadIssues.push({ productName: p.name || '', files: failedFiles });
                }
                const catId = p.category || 'dishdasha';
                const categoryLabel = categoryNameById.get(catId) || catId;

                const productDoc = {
                    id: productId,
                    name: p.name.trim(),
                    price: Number(convertArabicNumbers(p.price)),
                    currency: 'OMR',
                    images: imageUrls,
                    coverImageIndex: 0,
                    image: imageUrls[0] || '',
                    tailorId: authUid,
                    tailorName: effectiveFormData.shopName || '',
                    rating: 0,
                    likes: 0,
                    location: effectiveFormData.location || effectiveFormData.region || '',
                    duration: '',
                    categoryId: catId,
                    category: categoryLabel,
                    isDraft: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                await setDoc(productRef, productDoc);
            }

            setSubmitProgress({ percent: 100, message: 'Done!' });
            try {
                const localSnapshot = { uid, formData: effectiveFormData, boardImageUrl: boardUrl, profileImageUrl: profileUrl, products: products.map(p => ({ localId: p.localId, name: p.name, price: p.price, imageCount: (p.images || []).length })), createdAt: Date.now() };
                localStorage.setItem('tailorJoinLastSubmission', JSON.stringify(localSnapshot));
            } catch { }
            setUploadWarnings(uploadIssues);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-gray-700 animate-fade-in-up">
                    <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/50 mb-6">
                        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t('success_title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{t('success_desc')}</p>
                    {Array.isArray(uploadWarnings) && uploadWarnings.length > 0 && (
                        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-start text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-100">
                            <div className="font-bold mb-2">{t('upload_warnings_title')}</div>
                            <div className="text-sm whitespace-pre-line break-words">
                                {uploadWarnings.map((w, idx) => {
                                    const title = w.productName ? `${idx + 1}. ${w.productName}` : `${idx + 1}.`;
                                    const lines = Array.isArray(w.files) ? w.files.map(f => `- ${f}`).join('\n') : '';
                                    return `${title}\n${lines}`;
                                }).join('\n\n')}
                            </div>
                        </div>
                    )}
                    <div className="space-y-3">
                        <button onClick={resetToFirstPage} className="w-full py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors transform active:scale-95 duration-200">{t('go_first')}</button>
                        <button onClick={goAddMoreProducts} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95 duration-200">{t('add_more')}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-10 px-4 transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
            <AnimationStyles />
            <div className="max-w-3xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{t('title')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('subtitle')}</p>
                    </div>
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                        {['ar', 'en'].map(l => (
                            <button key={l} onClick={() => { setLang(l); setFormData(p => ({ ...p, preferredLanguage: l })); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${lang === l ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-indigo-600 dark:text-gray-400'}`}>
                                {l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {!isOnline && (
                    <div className="mb-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-200 animate-fade-in">
                        <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="font-medium">{t('offline_banner')}</span>
                    </div>
                )}

                {/* Error Toast */}
                {error && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                        <div className="bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-start gap-3 font-medium max-w-[92vw] sm:max-w-xl backdrop-blur-md bg-opacity-95">
                            <div className="mt-0.5 shrink-0"><Icons.Alert /></div>
                            <div className="whitespace-pre-line break-words text-sm leading-relaxed flex-1">{error}</div>
                            <button
                                type="button"
                                aria-label={t('close')}
                                onClick={() => setError(null)}
                                className="shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
                            >
                                <Icons.X />
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden relative transition-all duration-300">
                    
                    {/* Stepper (Only show if started) */}
                    {step > 0 && (
                        <div className="pt-8 px-8">
                            <StepIndicator step={step} totalSteps={3} />
                        </div>
                    )}

                    <div className="p-6 md:p-10">
                        
                        {/* WELCOME SCREEN */}
                        {step === 0 && (
                            <div className="text-center py-10 animate-fade-in-up">
                                <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                                    <Icons.Store />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">{t('welcome_title')}</h2>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-md mx-auto leading-relaxed">
                                    {t('welcome_desc')}
                                </p>
                                <button
                                    onClick={() => { setStep(1); navigate('/join-tailor/1'); }}
                                    className="px-10 py-4 bg-indigo-600 text-white text-lg font-bold rounded-2xl hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                                >
                                    {t('welcome_start')}
                                </button>
                            </div>
                        )}

                        {/* STEP 1: SHOP INFO */}
                        {step === 1 && (
                            <form onSubmit={handleSubmitStep1} className="space-y-6 animate-fade-in">
                                {lastSubmission && (
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
                                        <div className="text-sm text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-2">
                                            <Icons.Check />
                                            {t('saved_last_banner')}
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => restoreFromSnapshot(lastSubmission)} className="text-xs font-bold text-indigo-600 bg-white dark:bg-gray-700 dark:text-indigo-300 px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors">{t('restore_data')}</button>
                                            <button type="button" onClick={() => { localStorage.removeItem('tailorJoinLastSubmission'); setLastSubmission(null); }} className="text-xs font-bold text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-2 transition-colors">{t('clear_saved')}</button>
                                        </div>
                                    </div>
                                )}

                                {/* Account Type Tabs */}
                                <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                                    {[{ key: 'tailor', label: t('account_tailor') }, { key: 'shop', label: t('account_shop') }, { key: 'boutique', label: t('account_boutique') }].map(a => (
                                        <button key={a.key} type="button" onClick={() => setFormData(p => ({ ...p, accountKind: a.key }))}
                                            className={`py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${formData.accountKind === a.key ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-200/50'}`}>
                                            {a.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        label={t('phone_label')} icon={Icons.Phone} required
                                        type="tel" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder={t('phone_placeholder')} disabled={loading}
                                    />
                                    <InputField
                                        label={t('shop_label')} icon={Icons.Store} required
                                        type="text" value={formData.shopName} onChange={(e) => setFormData(p => ({ ...p, shopName: e.target.value }))} disabled={loading}
                                    />
                                </div>

                                <InputField
                                    label={t('location_label')} icon={Icons.Location} required
                                    type="text" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} disabled={loading}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label={t('email_label')} icon={Icons.Mail} type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} disabled={loading} />
                                    <InputField label={t('region_label')} type="text" value={formData.region} onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))} disabled={loading} />
                                </div>

                                {/* Gender Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('specialization_label')}</label>
                                    <div className="flex gap-4">
                                        {['male', 'female'].map(opt => (
                                            <button key={opt} type="button" onClick={() => setFormData(p => ({ ...p, specializationOptions: p.specializationOptions.includes(opt) ? [] : [opt] }))}
                                                className={`flex-1 py-3 border-2 rounded-xl text-sm font-bold transition-all duration-200 ${formData.specializationOptions.includes(opt) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-indigo-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                {opt === 'male' ? t('male') : t('female')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <ImageUpload label={t('board_label')} onChange={(e) => handleBoardImageChange(e)} previewUrl={uploads.boardPreviewUrl} accept={ACCEPTED_IMAGE_TYPES} subtext={t('supported_formats_short')} />

                                <div className="flex justify-between items-center pt-6">
                                    <button type="button" onClick={prevStep} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">{t('back')}</button>
                                    <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transform active:scale-95">
                                        {t('next')} <Icons.ArrowRight flip={isRtl} />
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 2: PRODUCTS */}
                        {step === 2 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products_title')}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{t('products_hint')}</p>
                                    </div>
                                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-4 py-2 rounded-full self-start sm:self-auto shadow-sm">
                                        {products.length} Items
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {products.map((p, idx) => (
                                        <div key={p.localId} className="group relative bg-white dark:bg-gray-700/40 rounded-3xl border border-gray-100 dark:border-gray-600 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                            <button onClick={() => removeProduct(p.localId)} className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 dark:hover:bg-red-900/30 transform hover:scale-110">
                                                <Icons.Trash />
                                            </button>

                                            <div className="mb-5">
                                                {/* Image Area - Improved Grid Logic */}
                                                <label className={`block w-full rounded-2xl overflow-hidden cursor-pointer relative bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-colors
                                                    ${(!productPreviews[p.localId] || productPreviews[p.localId].length === 0) ? 'h-40 flex items-center justify-center' : 'p-2'}`}>
                                                    
                                                    {(!productPreviews[p.localId] || productPreviews[p.localId].length === 0) ? (
                                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                                            <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-2"><Icons.Upload /></div>
                                                            <span className="text-xs font-semibold">{t('add_image')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {/* Main Cover Image */}
                                                            <div className="col-span-4 h-40 rounded-xl overflow-hidden relative group/img">
                                                                <img src={productPreviews[p.localId][0]} className="w-full h-full object-cover" alt="cover" />
                                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full">Cover</span>
                                                                </div>
                                                            </div>
                                                            {/* Thumbnails */}
                                                            {productPreviews[p.localId].slice(1, 4).map((url, i) => (
                                                                <div key={i} className="h-16 rounded-lg overflow-hidden relative">
                                                                    <img src={url} className="w-full h-full object-cover" alt="thumb" />
                                                                </div>
                                                            ))}
                                                            {/* Add More Button / Counter */}
                                                            {productPreviews[p.localId].length < 10 && (
                                                                <div className="h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                                                    <Icons.Plus />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <input type="file" className="hidden" multiple accept={ACCEPTED_IMAGE_TYPES} onChange={(e) => handleProductImagesChange(p.localId, e.target.files)} />
                                                </label>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="group/input relative">
                                                    <input
                                                        type="text"
                                                        placeholder=" "
                                                        value={p.name}
                                                        onChange={(e) => setProducts(l => { const c = [...l]; const i = c.findIndex(x => x.localId === p.localId); if (i !== -1) c[i].name = e.target.value; return c; })}
                                                        className="peer block w-full border-0 border-b-2 border-gray-200 dark:border-gray-600 bg-transparent py-2.5 px-0 text-sm text-gray-900 dark:text-white focus:border-indigo-600 focus:ring-0 font-semibold"
                                                    />
                                                    <label className="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:start-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-indigo-600 rtl:origin-[100%]">
                                                        {t('product_name_ph')}
                                                    </label>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="relative flex-1 group/input">
                                                        <input
                                                            type="number"
                                                            placeholder=" "
                                                            value={p.price}
                                                            onChange={(e) => setProducts(l => { const c = [...l]; const i = c.findIndex(x => x.localId === p.localId); if (i !== -1) c[i].price = e.target.value; return c; })}
                                                            className="peer block w-full border-0 border-b-2 border-gray-200 dark:border-gray-600 bg-transparent py-2.5 px-0 text-sm text-gray-900 dark:text-white focus:border-indigo-600 focus:ring-0 font-mono"
                                                        />
                                                        <label className="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:start-0 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-indigo-600 rtl:origin-[100%]">
                                                            {t('price_ph')}
                                                        </label>
                                                        <span className="absolute right-0 rtl:left-0 rtl:right-auto bottom-2 text-xs font-bold text-gray-400">OMR</span>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="relative">
                                                            {categoriesLoading ? (
                                                                <div className="flex items-center justify-center py-2.5 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                                                    <span className="ml-2 text-xs text-gray-500">Loading...</span>
                                                                </div>
                                                            ) : categoriesError ? (
                                                                <div className="text-center py-2 px-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                                    <button
                                                                        type="button"
                                                                        onClick={loadCategories}
                                                                        className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
                                                                    >
                                                                        Retry
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <select
                                                                    value={p.category}
                                                                    onChange={(e) => setProducts(l => { const c = [...l]; const i = c.findIndex(x => x.localId === p.localId); if (i !== -1) c[i].category = e.target.value; return c; })}
                                                                    className="block w-full rounded-lg border-0 bg-gray-100 dark:bg-gray-800 py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600"
                                                                    disabled={productCategories.length === 0}
                                                                >
                                                                    <option value="">{productCategories.length === 0 ? (selectedGender ? 'لا توجد تصنيفات' : 'اختر التخصص أولاً') : t('category_label')}...</option>
                                                                    {productCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Button Card */}
                                    <button
                                        onClick={() => setProducts(l => [...l, { localId: `p_${Date.now()}`, name: '', price: '', images: [], category: '' }])}
                                        className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-indigo-300 transition-all text-gray-400 hover:text-indigo-500 group"
                                    >
                                        <div className="p-4 bg-white dark:bg-gray-700 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform"><Icons.Plus /></div>
                                        <span className="font-bold text-lg">{t('add_product')}</span>
                                    </button>
                                </div>

                                <div className="flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <button onClick={prevStep} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">{t('back')}</button>
                                    <button onClick={() => { const err = validateStep2(); if (err.length) setError(err.join('\n')); else { setError(null); nextStep(); } }} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transform active:scale-95 transition-transform">
                                        {t('next')} <Icons.ArrowRight flip={isRtl} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: REVIEW */}
                        {step === 3 && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-800 backdrop-blur-sm">
                                    <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-100 mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-indigo-200 dark:bg-indigo-800 rounded-lg"><Icons.Store /></div> 
                                        {t('data_summary')}
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                                        <div className="flex justify-between border-b border-indigo-200/50 dark:border-indigo-800 pb-2">
                                            <span className="text-gray-500 dark:text-gray-400">{t('shop_name_label')}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{formData.shopName}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-indigo-200/50 dark:border-indigo-800 pb-2">
                                            <span className="text-gray-500 dark:text-gray-400">{t('phone_login_label')}</span>
                                            <span className="font-bold text-gray-900 dark:text-white font-mono">{formData.phone}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-indigo-200/50 dark:border-indigo-800 pb-2">
                                            <span className="text-gray-500 dark:text-gray-400">{t('account_type_label')}</span>
                                            <span className="font-bold text-gray-900 dark:text-white uppercase bg-white dark:bg-gray-700 px-2 py-0.5 rounded shadow-sm">{formData.accountKind}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-indigo-200/50 dark:border-indigo-800 pb-2">
                                            <span className="text-gray-500 dark:text-gray-400">{t('products_header')}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{products.length} Items</span>
                                        </div>
                                    </div>

                                    {uploads.boardPreviewUrl && (
                                        <div className="mt-6">
                                            <div className="text-xs text-indigo-400 mb-3 uppercase tracking-wide font-bold">{t('board_image_label')}</div>
                                            <div className="h-32 w-full rounded-2xl overflow-hidden shadow-md">
                                                <img src={uploads.boardPreviewUrl} className="w-full h-full object-cover" alt="board" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {submitProgress.message && (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
                                        <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">
                                            <span>{submitProgress.message}</span>
                                            <span>{Math.round(submitProgress.percent)}%</span>
                                        </div>
                                        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out" style={{ width: `${submitProgress.percent}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4 pt-4">
                                    <button onClick={handleSubmitAll} disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-2xl hover:from-indigo-700 hover:to-indigo-800 shadow-xl shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] text-lg">
                                        {loading ? t('submitting') : t('submit')}
                                    </button>
                                    <button onClick={prevStep} disabled={loading} className="w-full py-3 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-colors">
                                        {t('back')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-center mt-8 text-xs text-gray-400 dark:text-gray-600 font-medium">
                    &copy; {new Date().getFullYear()} Khuyoot. Secure Registration.
                </div>
            </div>
        </div>
    );
}