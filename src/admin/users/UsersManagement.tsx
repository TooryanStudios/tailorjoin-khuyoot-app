import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Users, RefreshCw, ChevronRight, ChevronLeft, ChevronRight as ChevronR, Store, Scissors, Package, CheckCircle2, AlertCircle, Search, Edit2, X, Filter, Trash2, Clock, Star, ExternalLink, Upload, ImagePlus, Image as ImageIcon, ArrowLeft, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import { User, AgeGroup, PopularRegion } from '../../../types';
import { firebaseService } from '../../../services/firebase';
import { ImagePrepModal } from '../../components/image/ImagePrepModal';
import { useQueryClient } from '@tanstack/react-query';

const ADMIN_SECTION_KEYS = [
  'dashboard',
  'orders',
  'approvals',
  'users',
  'tailors',
  'boutiques',
  'shops',
  'products',
  'orphaned-products',
  'fabrics',
  'measurements',
  'family',
  'ai',
  'store',
  'images',
  'tryon-templates',
  'notifications',
  'ads',
  'regions',
  'financial',
  'credits',
  'settings',
  'config',
  'debug-tools',
  'logs',
] as const;

const ADMIN_SECTION_LABELS: Record<string, string> = {
  dashboard: 'لوحة المعلومات',
  orders: 'الطلبات',
  approvals: 'الموافقات',
  users: 'المستخدمون',
  tailors: 'الخياطون',
  boutiques: 'البوتيكات',
  shops: 'المتاجر',
  products: 'المنتجات',
  'orphaned-products': 'المنتجات اليتيمة',
  fabrics: 'الأقمشة',
  measurements: 'القياسات',
  family: 'العائلة',
  ai: 'الذكاء الاصطناعي',
  store: 'المتجر',
  images: 'الصور',
  'tryon-templates': 'قوالب التجربة',
  notifications: 'الإشعارات',
  ads: 'الإعلانات',
  regions: 'المناطق',
  financial: 'المالية',
  credits: 'الأرصدة',
  settings: 'إدارة الاستبيان',
  config: 'الإعدادات العامة',
  'debug-tools': 'أدوات التشخيص',
  logs: 'السجلات',
};

const ADMIN_SECTION_GROUPS: Array<{ title: string; keys: ReadonlyArray<(typeof ADMIN_SECTION_KEYS)[number]> }> = [
  { title: 'عام', keys: ['dashboard', 'orders', 'approvals', 'notifications'] },
  { title: 'المستخدمون والمتاجر', keys: ['users', 'tailors', 'boutiques', 'shops', 'family'] },
  { title: 'الكتالوج والمنتجات', keys: ['products', 'orphaned-products', 'fabrics', 'measurements', 'images', 'tryon-templates'] },
  { title: 'التسويق والتشغيل', keys: ['ads', 'regions', 'financial', 'credits'] },
  { title: 'النظام', keys: ['ai', 'store', 'settings', 'config', 'debug-tools', 'logs'] },
];

const ADMIN_CONFIG_KEYS = [
  'general',
  'homepage',
  'landing-page',
  'designer',
  'product-page',
  'texts',
  'social',
  'seo',
  'advanced',
  'debug-tools',
] as const;

const ADMIN_CONFIG_LABELS: Record<string, string> = {
  general: 'عام',
  homepage: 'الصفحة الرئيسية',
  'landing-page': 'صفحة الهبوط',
  designer: 'المصمم',
  'product-page': 'صفحة المنتج',
  texts: 'النصوص',
  social: 'السوشيال',
  seo: 'SEO',
  advanced: 'متقدم',
  'debug-tools': 'أدوات التشخيص',
};

const ADMIN_CONFIG_GROUPS: Array<{ title: string; keys: ReadonlyArray<(typeof ADMIN_CONFIG_KEYS)[number]> }> = [
  { title: 'الواجهة والمحتوى', keys: ['general', 'homepage', 'landing-page', 'designer', 'product-page', 'texts'] },
  { title: 'التسويق والتحسين', keys: ['social', 'seo'] },
  { title: 'متقدم', keys: ['advanced', 'debug-tools'] },
];

const splitCsv = (value: string): string[] =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isLimitedAdminUser = (user: any): boolean => {
  if (!user || user.role !== 'admin') return false;
  const accessMode = user?.adminAccess?.mode;
  const permissionsMode = user?.adminPermissions?.mode;
  return accessMode === 'limited' || permissionsMode === 'limited';
};

export const UsersManagement = () => {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [mergedDuplicateUsers, setMergedDuplicateUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<PopularRegion[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [showManageProducts, setShowManageProducts] = useState(false);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSaving, setProductSaving] = useState<Record<string, boolean>>({});
  const [newProdUrl, setNewProdUrl] = useState<Record<string, string>>({});
  const dragRef = useRef<{ productId: string; index: number } | null>(null);
  const [uploadingProd, setUploadingProd] = useState<Record<string, boolean>>({});
  const [productCategories, setProductCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [leafCategoryIds, setLeafCategoryIds] = useState<Set<string>>(new Set());

  // Form state for upgrade
  const [newRole, setNewRole] = useState<'tailor' | 'shop'>('tailor');
  const [shopType, setShopType] = useState<string>('tailor');
  const [location, setLocation] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [showPromoteAdminModal, setShowPromoteAdminModal] = useState(false);
  const [promoteTargetUser, setPromoteTargetUser] = useState<User | null>(null);
  const [promotingAdmin, setPromotingAdmin] = useState(false);
  const [promoteAdminMode, setPromoteAdminMode] = useState<'full' | 'limited'>('limited');
  const [promoteAdminSections, setPromoteAdminSections] = useState<string[]>([]);
  const [promoteAdminConfigSections, setPromoteAdminConfigSections] = useState<string[]>([]);

  // Form state for edit
  const [editForm, setEditForm] = useState({
    name: '',
    shopName: '',
    email: '',
    phone: '',
    loginId: '',
    region: '',
    ageGroup: '' as AgeGroup | '',
    shopType: '' as string,
    location: '',
    specialization: '',
    experience: '',
    profileImage: '',
    boardImage: '',
    bio: '',
    createdByAdmin: false,
    requirePasswordChange: false,
    approvalStatus: 'pending' as string,
    isFeatured: false,
    adminAccessMode: 'full' as 'full' | 'limited',
    adminSections: '',
    adminDeniedSections: '',
    adminConfigSections: '',
    adminDeniedConfigSections: ''
  });
  const [imagePrepOpen, setImagePrepOpen] = useState(false);
  const [imagePrepFile, setImagePrepFile] = useState<File | null>(null);
  const [imagePrepType, setImagePrepType] = useState<'profile' | 'board'>('profile');

  // Handle image prep modal for profile/board images
  const handleImagePrepApply = async (processedFile: File) => {
    if (!selectedUser) return;
    try {
      if (typeof (firebaseService as any).uploadUserImage === 'function') {
        const url = await (firebaseService as any).uploadUserImage(selectedUser.id, imagePrepType, processedFile);
        if (imagePrepType === 'profile') {
          setEditForm(prev => ({ ...prev, profileImage: url }));
          showToast('✅ تم رفع صورة الملف الشخصي', 'success');
        } else {
          setEditForm(prev => ({ ...prev, boardImage: url }));
          showToast('✅ تم رفع صورة الواجهة/اللوحة', 'success');
        }
      } else {
        const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const storage = getStorage();
        const path = `users/${selectedUser.id}/${imagePrepType}_${Date.now()}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, processedFile, {
          cacheControl: 'public, max-age=31536000'
        });
        const url = await getDownloadURL(storageRef);
        if (imagePrepType === 'profile') {
          setEditForm(prev => ({ ...prev, profileImage: url }));
          showToast('✅ تم رفع صورة الملف الشخصي', 'success');
        } else {
          setEditForm(prev => ({ ...prev, boardImage: url }));
          showToast('✅ تم رفع صورة الواجهة/اللوحة', 'success');
        }
      }
      setImagePrepOpen(false);
      setImagePrepFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      showToast(`❌ فشل رفع ${imagePrepType === 'profile' ? 'صورة الملف الشخصي' : 'صورة الواجهة/اللوحة'}`, 'error');
    }
  };
  const [saving, setSaving] = useState(false);

  // Toast notifications (non-blocking)
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({ open: false, message: '', type: 'info' });
  const toastTimer = useRef<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3500) => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    setToast({ open: true, message, type });
    toastTimer.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }));
      toastTimer.current = null;
    }, duration);
  };

  useEffect(() => {
    loadUsers();
    loadRegions();
  }, []);

  useEffect(() => {
    // Filter users based on search and role filter
    const sourceUsers = roleFilter === 'merged_duplicates' ? mergedDuplicateUsers : users;
    let filtered = sourceUsers;
    
    // Apply role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'merged_duplicates') {
        // already switched sourceUsers above
      } else if (roleFilter === 'limited_admin') {
        filtered = filtered.filter((u: any) => isLimitedAdminUser(u));
      } else {
        filtered = filtered.filter(u => u.role === roleFilter);
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users, mergedDuplicateUsers]);

  const loadRegions = async () => {
    try {
      const data = await firebaseService.getPopularRegions();
      setRegions(data.filter(r => r.enabled));
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Load active + merged duplicates from Firebase
      const [data, mergedData] = await Promise.all([
        firebaseService.getAllUsers(),
        typeof (firebaseService as any).getMergedDuplicateUsers === 'function'
          ? (firebaseService as any).getMergedDuplicateUsers()
          : Promise.resolve([]),
      ]);
      
      console.log(`📥 Loaded ${data.length} users from Firestore`);
      
      setUsers(data);
      setMergedDuplicateUsers(mergedData);
      setFilteredUsers(roleFilter === 'merged_duplicates' ? mergedData : data);
    } catch {
      console.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpgrade = (user: User) => {
    setSelectedUser(user);
    setLocation('');
    setSpecialization('');
    setExperience('');
    setNewRole('tailor');
    setShopType('tailor');
    setShowUpgradeModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    const userAny = user as any;
    const adminAccess = userAny.adminAccess || userAny.adminPermissions || {};
    const adminAccessMode = adminAccess.mode === 'limited' ? 'limited' : 'full';
    const allowedSectionsFromData = Array.isArray(adminAccess.sections) ? adminAccess.sections : [];
    const deniedSectionsFromData = Array.isArray(adminAccess.deniedSections) ? adminAccess.deniedSections : [];
    const allowedConfigFromData = Array.isArray(adminAccess.configSections) ? adminAccess.configSections : [];
    const deniedConfigFromData = Array.isArray(adminAccess.deniedConfigSections) ? adminAccess.deniedConfigSections : [];

    const normalizedAllowedSections =
      adminAccessMode === 'limited'
        ? (allowedSectionsFromData.length > 0
            ? allowedSectionsFromData
            : ADMIN_SECTION_KEYS.filter((section) => !deniedSectionsFromData.includes(section)))
        : [];

    const normalizedAllowedConfigSections =
      adminAccessMode === 'limited'
        ? (allowedConfigFromData.length > 0
            ? allowedConfigFromData
            : ADMIN_CONFIG_KEYS.filter((section) => !deniedConfigFromData.includes(section)))
        : [];
    setEditForm({
      name: user.name || '',
      shopName: (user as any).shopName || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      loginId: (user as any).loginId || user.phone || user.email || '',
      region: user.region || user.location || '',  // Use location as fallback for region
      ageGroup: user.ageGroup || '',
      shopType: user.shopType || 'tailor',
      location: user.location || user.region || '',
      specialization: user.specialization || '',
      experience: user.experience || '',
      profileImage: (user as any).profileImage || '',
      boardImage: (user as any).boardImage || '',
      bio: user.bio || '',
      createdByAdmin: Boolean((user as any).createdByAdmin),
      requirePasswordChange: Boolean((user as any).requirePasswordChange),
      approvalStatus: user.approvalStatus || 'pending',
      isFeatured: Boolean((user as any).isFeatured),
      adminAccessMode,
      adminSections: normalizedAllowedSections.join(', '),
      adminDeniedSections: ADMIN_SECTION_KEYS.filter((section) => !normalizedAllowedSections.includes(section)).join(', '),
      adminConfigSections: normalizedAllowedConfigSections.join(', '),
      adminDeniedConfigSections: ADMIN_CONFIG_KEYS.filter((section) => !normalizedAllowedConfigSections.includes(section)).join(', ')
    });
    setShowEditModal(true);
    setShowManageProducts(false);
    setUserProducts([]);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !editForm.name.trim() || !editForm.email.trim()) {
      showToast('⚠️ الاسم والبريد الإلكتروني مطلوبان', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const updateData: Partial<User> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || '',
        loginId: editForm.loginId?.trim() || '',
        region: editForm.region || '',
        // extended fields - always include these fields to ensure they're saved
        profileImage: editForm.profileImage?.trim() || '',
        boardImage: editForm.boardImage?.trim() || '',
        bio: editForm.bio.trim() || '',
        createdByAdmin: editForm.createdByAdmin,
        requirePasswordChange: editForm.requirePasswordChange
      };

      // Add ageGroup only for regular users
      if (selectedUser.role === 'user') {
        updateData.ageGroup = editForm.ageGroup || '';
      }

      // Add merchant fields for tailors/shops
      if (selectedUser.role === 'tailor' || selectedUser.role === 'shop' || selectedUser.role === 'boutique') {
        updateData.shopType = editForm.shopType || 'tailor';
        
        // Update role based on shopType if it changed
        if (editForm.shopType) {
            if (editForm.shopType === 'tailor') {
                updateData.role = 'tailor';
            } else {
                updateData.role = 'shop';
            }
        }

        updateData.location = editForm.location.trim() || '';
        // specialization as gender type: 'male' | 'female'
        updateData.specialization = editForm.specialization || '';
        updateData.experience = editForm.experience.trim() || '';

        // Shop display name (used in product browsing UI)
        (updateData as any).shopName = (editForm.shopName || editForm.name).trim();

        // Use selected approval status
        updateData.approvalStatus = (editForm.approvalStatus as any) || 'pending';
        
        // Featured status
        (updateData as any).isFeatured = editForm.isFeatured || false;
      }

      if (selectedUser.role === 'admin') {
        const nextAdminAccess = {
          mode: editForm.adminAccessMode,
          sections: splitCsv(editForm.adminSections),
          deniedSections: splitCsv(editForm.adminDeniedSections),
          configSections: splitCsv(editForm.adminConfigSections),
          deniedConfigSections: splitCsv(editForm.adminDeniedConfigSections),
        };
        (updateData as any).adminAccess = nextAdminAccess;
        (updateData as any).adminPermissions = nextAdminAccess;
      }

      // Remove undefined values before sending
      const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<User>);
      
      console.log('📤 Sending user update request');

      // Debug snapshot
      setDebugInfo(prev => ({
        ...prev,
        lastSent: cleanedData,
        lastRole: selectedUser.role,
        lastForm: editForm
      }));
      
      // Optimistic update - update local state immediately
      const optimisticUser = { ...selectedUser, ...cleanedData };
      
      // Update users array optimistically
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? optimisticUser : u));
      setFilteredUsers(prev => prev.map(u => u.id === selectedUser.id ? optimisticUser : u));
      
      // Update selectedUser immediately to prevent flickering
      setSelectedUser(optimisticUser);
      
      // Update editForm with the optimistic data
      setEditForm(prev => ({
        ...prev,
        profileImage: cleanedData.profileImage || prev.profileImage,
        boardImage: cleanedData.boardImage || prev.boardImage,
      }));
      
      showToast('✅ تم تحديث البيانات بنجاح!', 'success');
      
      // Save to database in background
      await firebaseService.updateUser(selectedUser.id, cleanedData);
      
      // Invalidate React Query caches for home page data
      queryClient.invalidateQueries({ queryKey: ['home-popular-regions'] });
      queryClient.invalidateQueries({ queryKey: ['home-tailors'] });
      
      // Silently reload in background without affecting UI
      Promise.all([
        loadUsers(),
        loadRegions()
      ]).then(() => {
        console.log('🔄 Background refresh complete');
      }).catch(() => {
        console.error('Background refresh error');
      });
    } catch (error) {
      console.error('❌ Error updating user');
      setDebugInfo(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : String(error)
      }));
      showToast('❌ حدث خطأ أثناء التحديث: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- Per-user products management helpers ---
  const loadUserProducts = async (uid: string) => {
    setProductsLoading(true);
    try {
      const list = await firebaseService.getProductsByTailorId(uid);
      setUserProducts(list);
    } catch (e) {
      setUserProducts([]);
    } finally { setProductsLoading(false); }
  };

  const loadProductCategories = async () => {
    try {
      // Use the same hierarchical source as the Admin Categories page
      const { buildCategoryTree } = await import('../products/services');

      const tree = await buildCategoryTree();
      const flat: Array<{ id: string; name: string }> = [];
      const leafIds = new Set<string>();

      const getDisplayName = (node: any) => node?.nameAr || node?.nameEn || node?.name || node?.id || '';

      const walk = (nodes: any[], path: string[]) => {
        for (const node of nodes) {
          const nodeName = getDisplayName(node);
          const nextPath = [...path, nodeName].filter(Boolean);

          const hasChildren = Array.isArray(node.children) && node.children.length > 0;
          if (hasChildren) {
            walk(node.children, nextPath);
          } else {
            // Leaf node: selectable category (only level 2)
            if (node?.level === 2) {
              flat.push({ id: node.id, name: nodeName });
              leafIds.add(node.id);
            }
          }
        }
      };

      walk(tree, []);
      setProductCategories(flat);
      setLeafCategoryIds(leafIds);
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  const normalizedImages = (p: any): string[] => {
    if (Array.isArray(p.images) && p.images.length > 0) return p.images.filter(Boolean);
    if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) return p.imageUrls.filter(Boolean);
    if (p.image) return [p.image];
    return [];
  };

  const needsNormalization = (p: any) => {
    const hasImageUrls = Array.isArray(p.imageUrls) && p.imageUrls.length > 0;
    const hasImages = Array.isArray(p.images) && p.images.length > 0;
    const missingImage = !p.image;
    const missingCategoryId = !p.categoryId;
    const missingCoverIndex = typeof p.coverImageIndex !== 'number';
    return (hasImageUrls && !hasImages) || missingImage || missingCategoryId || missingCoverIndex;
  };

  const buildUpdate = (p: any) => {
    const images: string[] = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (Array.isArray(p.imageUrls) ? p.imageUrls.filter(Boolean) : []);
    const image = images[0] || p.image || '';
    const categoryId = (p.categoryId || (typeof p.category === 'string' ? p.category : '') || '').trim();
    return { images, image, coverImageIndex: 0, categoryId, updatedAt: new Date().toISOString() } as Partial<any>;
  };

  const updateProduct = async (p: any, updates: Partial<any>) => {
    if (!selectedUser) return;

    // Enforce: only leaf categories are allowed to be saved as categoryId
    if (Object.prototype.hasOwnProperty.call(updates, 'categoryId')) {
      const nextCategoryId = String((updates as any).categoryId || '').trim();
      if (nextCategoryId && leafCategoryIds.size > 0 && !leafCategoryIds.has(nextCategoryId)) {
        showToast('❌ اختر تصنيفًا فرعيًا فقط (Leaf)', 'error');
        return;
      }
    }

    await firebaseService.updateProduct(p.id, { tailorId: selectedUser.id, ...updates } as any);
    // Update local state to reflect the change immediately
    setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...updates } : x));
  };

  const transferImages = async (p: any) => {
    setProductSaving(prev => ({ ...prev, [p.id]: true }));
    try {
      const updates = buildUpdate(p);
      await updateProduct(p, updates);
      setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...updates } : x));
    } finally {
      setProductSaving(prev => ({ ...prev, [p.id]: false }));
    }
  };

  const arrayMove = (arr: string[], from: number, to: number) => {
    const a = arr.slice();
    const start = from < 0 ? a.length + from : from;
    if (start < 0 || start >= a.length) return a;
    const end = to < 0 ? a.length + to : to;
    if (end < 0 || end >= a.length) return a;
    const [item] = a.splice(start, 1);
    a.splice(end, 0, item);
    return a;
  };

  const reorderImages = async (p: any, fromIndex: number, toIndex: number) => {
    const imgs = normalizedImages(p);
    if (imgs.length === 0) return;
    const newImages = arrayMove(imgs, fromIndex, toIndex);
    let newCoverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
    if (fromIndex === newCoverIndex) newCoverIndex = toIndex;
    else if (fromIndex < newCoverIndex && toIndex >= newCoverIndex) newCoverIndex -= 1;
    else if (fromIndex > newCoverIndex && toIndex <= newCoverIndex) newCoverIndex += 1;
    setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImages[newCoverIndex] || '', coverImageIndex: newCoverIndex } : x));
    await updateProduct(p, { images: newImages, image: newImages[newCoverIndex] || '', coverImageIndex: newCoverIndex });
  };

  const setAsCover = async (p: any, index: number) => {
    const imgs = normalizedImages(p);
    const newImage = imgs[index] || '';
    setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, image: newImage, coverImageIndex: index, images: imgs } : x));
    await updateProduct(p, { image: newImage, coverImageIndex: index, images: imgs });
  };

  const addImageUrl = async (p: any) => {
    const url = (newProdUrl[p.id] || '').trim();
    if (!url) return;
    const imgs = normalizedImages(p);
    const newImages = [...imgs, url];
    let coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
    if (!p.image) coverIndex = 0;
    setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImages[coverIndex] || '', coverImageIndex: coverIndex } : x));
    await updateProduct(p, { images: newImages, image: newImages[coverIndex] || '', coverImageIndex: coverIndex });
    setNewProdUrl(prev => ({ ...prev, [p.id]: '' }));
  };

  const removeImageAt = async (p: any, idx: number) => {
    const imgs = normalizedImages(p);
    if (idx < 0 || idx >= imgs.length) return;
    const newImages = imgs.filter((_, i) => i !== idx);
    let coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
    if (idx < coverIndex) coverIndex -= 1;
    else if (idx === coverIndex) coverIndex = 0;
    const newImage = newImages[coverIndex] || '';
    setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImage, coverImageIndex: coverIndex } : x));
    await updateProduct(p, { images: newImages, image: newImage, coverImageIndex: coverIndex });
  };

  const uploadProductImageFile = async (p: any, file: File) => {
    if (!file || !selectedUser) return;
    setUploadingProd(prev => ({ ...prev, [p.id]: true }));
    try {
      // Resize image to max 900px height
      const options = {
        maxWidthOrHeight: 900,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
        initialQuality: 0.9
      };
      const compressedFile = await imageCompression(file, options);
      
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage();
      const fileId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const path = `users/${selectedUser.id}/products/${p.id}/${fileId}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, compressedFile, {
        cacheControl: 'public, max-age=31536000'
      });
      const url = await getDownloadURL(storageRef);
      const imgs = normalizedImages(p);
      const newImages = [...imgs, url];
      const coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
      const newImage = newImages[coverIndex] || '';
      setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImage, coverImageIndex: coverIndex } : x));
      await updateProduct(p, { images: newImages, image: newImage, coverImageIndex: coverIndex });
    } catch (e) {
      // no-op
    } finally {
      setUploadingProd(prev => ({ ...prev, [p.id]: false }));
    }
  };

  // Upload multiple images at once
  const uploadMultipleProductImages = async (p: any, files: File[]) => {
    if (!files.length || !selectedUser) return;
    setUploadingProd(prev => ({ ...prev, [p.id]: true }));
    try {
      const options = {
        maxWidthOrHeight: 900,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
        initialQuality: 0.9
      };

      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storage = getStorage();

      // Upload all files in parallel
      const uploadPromises = files.map(async (file) => {
        const compressedFile = await imageCompression(file, options);
        const fileId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const path = `users/${selectedUser.id}/products/${p.id}/${fileId}.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, compressedFile, {
          cacheControl: 'public, max-age=31536000'
        });
        return await getDownloadURL(storageRef);
      });

      const newUrls = await Promise.all(uploadPromises);
      const imgs = normalizedImages(p);
      const newImages = [...imgs, ...newUrls];
      const coverIndex = typeof p.coverImageIndex === 'number' ? p.coverImageIndex : 0;
      const newImage = newImages[coverIndex] || newImages[0] || '';
      
      setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImage, coverImageIndex: coverIndex } : x));
      await updateProduct(p, { images: newImages, image: newImage, coverImageIndex: coverIndex });
    } catch (e) {
      console.error('Multi-upload error:', e);
    } finally {
      setUploadingProd(prev => ({ ...prev, [p.id]: false }));
    }
  };

  // Admin Impersonation (Login as user)
  const handleLoginAsUser = async (user: User) => {
    try {
      // Store impersonation intent locally; your app can read this and perform server-side custom token exchange.
      localStorage.setItem('admin_impersonate_uid', user.id);
      localStorage.setItem('admin_impersonate_name', user.name || '');
      showToast(`🔑 ستسجل الدخول كـ ${user.name}. افتح الواجهة العامة للمساعدة.`, 'info');
      // Optionally navigate to client side in a new tab
      const clientUrl = `${window.location.origin}/#/`;
      window.open(clientUrl + '?impersonate=' + encodeURIComponent(user.id), '_blank');
    } catch (e) {
      console.error('Error starting impersonation:', e);
      showToast('❌ تعذر بدء تسجيل الدخول بحساب المستخدم', 'error');
    }
  };

  // Send password reset email
  const handleSendPasswordReset = async (user: User) => {
    try {
      if (!user.email) {
        showToast('⚠️ لا يوجد بريد إلكتروني لهذا المستخدم', 'error');
        return;
      }
      // Prefer service method if available
      if (typeof (firebaseService as any).sendPasswordReset === 'function') {
        await (firebaseService as any).sendPasswordReset(user.email);
      } else {
        // Fallback to Firebase Auth if service method not present
        const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
        const auth = getAuth();
        await sendPasswordResetEmail(auth, user.email);
      }
      showToast('📧 تم إرسال رابط إعادة تعيين كلمة المرور', 'success');
    } catch (e) {
      console.error('Error sending password reset:', e);
      showToast('❌ فشل إرسال رابط إعادة التعيين', 'error');
    }
  };

  const handleMigrateUsers = async () => {
    setMigrating(true);
    console.log('\n' + '='.repeat(70));
    console.log('🚀 KHUYOOT USER SCHEMA MIGRATION V1');
    console.log('='.repeat(70) + '\n');
    
    try {
      const { Timestamp } = await import('firebase/firestore');
      let updatedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const user of users) {
        const userAny = user as any;
        const userId = userAny.id || userAny.uid || '';
        const isTailor = user.role === 'tailor' || user.role === 'shop' || user.role === 'boutique' || userAny.shopType;
        
        console.log('\n👤 Processing user record');
        
        const updates: any = {};
        let needsUpdate = false;
        const now = Timestamp.now();
        
        // Helper to add field
        const addField = (field: string, value: any, log: string) => {
          if (userAny[field] === undefined) {
            updates[field] = value;
            needsUpdate = true;
            console.log(`  ➕ ${log}`);
          }
        };
        
        // System fields
        addField('uid', userId, 'Adding uid');
        addField('accountStatus', 
          userAny.blockedByAdmin ? 'banned' : 
          userAny.approvalStatus === 'approved' ? 'active' : 
          userAny.approvalStatus === 'rejected' ? 'suspended' : 'pending_review',
          'Adding accountStatus'
        );
        addField('dataVersion', 1, 'Adding dataVersion');
        
        // Timestamps
        addField('createdAt', userAny.joinDate || now, 'Adding createdAt');
        addField('updatedAt', now, 'Adding updatedAt');
        addField('lastLoginAt', userAny.createdAt || now, 'Adding lastLoginAt');
        
        // Verification
        addField('isEmailVerified', false, 'Adding isEmailVerified');
        addField('isPhoneVerified', !!user.phone, 'Adding isPhoneVerified');
        addField('authProvider', 'password', 'Adding authProvider');
        addField('passwordUpdatedAt', userAny.createdAt || now, 'Adding passwordUpdatedAt');
        
        // Language & Notifications
        addField('preferredLanguage', 'ar', 'Adding preferredLanguage');
        addField('notificationPreferences', { email: true, sms: true, push: true, whatsapp: true }, 'Adding notificationPreferences');
        
        // Core content fields - Migrate avatar to profileImage
        if (!userAny.profileImage && userAny.avatar) {
          updates.profileImage = userAny.avatar;
          needsUpdate = true;
          console.log('  ➕ Copying avatar to profileImage');
        } else if (!userAny.profileImage) {
          updates.profileImage = '';
          needsUpdate = true;
          console.log('  ➕ Adding profileImage');
        }
        addField('boardImage', '', 'Adding boardImage');
        addField('bio', '', 'Adding bio');
        addField('loginId', user.phone || user.email || '', 'Adding loginId');
        addField('createdByAdmin', false, 'Adding createdByAdmin');
        addField('requirePasswordChange', false, 'Adding requirePasswordChange');
        
        // Location - Fix region/location inconsistency
        if (!user.region && user.location) {
          updates.region = user.location;
          needsUpdate = true;
          console.log('  ➕ Adding region from location');
        } else if (!user.region) {
          updates.region = '';
          needsUpdate = true;
          console.log('  ➕ Adding empty region');
        }
        
        addField('coordinates', { lat: 0, lng: 0 }, 'Adding coordinates');
        addField('serviceAreas', user.region ? [user.region] : user.location ? [user.location] : [], 'Adding serviceAreas');
        
        // Tailor-specific fields
        if (isTailor) {
          addField('shopName', user.name || 'محل الخياطة', 'Adding shopName');
          addField('services', [], 'Adding services');
          addField('specializations', userAny.specialization ? [userAny.specialization] : [], 'Adding specializations');
          addField('workingHours', { days: 'السبت - الخميس', from: '09:00', to: '18:00' }, 'Adding workingHours');
          addField('deliveryAvailable', false, 'Adding deliveryAvailable');
          addField('homeVisitAvailable', false, 'Adding homeVisitAvailable');
          addField('verificationStatus', 
            userAny.approvalStatus === 'approved' ? 'verified' : 
            userAny.approvalStatus === 'pending' ? 'pending' : 
            userAny.approvalStatus === 'rejected' ? 'rejected' : 'unverified',
            'Adding verificationStatus'
          );
          addField('businessLicense', '', 'Adding businessLicense');
          addField('verificationDocuments', [], 'Adding verificationDocuments');
          addField('socialMedia', { instagram: '', tiktok: '', snapchat: '', website: '' }, 'Adding socialMedia');
          addField('priceRange', { min: 0, max: 0, currency: 'SAR' }, 'Adding priceRange');
          addField('acceptingOrders', userAny.accountStatus === 'active', 'Adding acceptingOrders');
          addField('maxActiveOrders', 10, 'Adding maxActiveOrders');
          addField('isVisible', userAny.approvalStatus === 'approved', 'Adding isVisible');
          addField('experience', '', 'Adding experience');
          addField('approvalStatus', 'approved', 'Adding approvalStatus');
          addField('location', user.region || '', 'Adding location');
          addField('specialization', '', 'Adding specialization');
        }
        
        // Regular user fields
        if (user.role === 'user') {
          addField('ageGroup', '', 'Adding ageGroup');
        }
        
        // Stats
        addField('ratingAvg', userAny.rating || 0, 'Adding ratingAvg');
        addField('ratingCount', userAny.reviewsCount || 0, 'Adding ratingCount');
        addField('completedOrdersCount', 0, 'Adding completedOrdersCount');
        
        // Monetization
        addField('subscription', { tier: 'free', expiresAt: null }, 'Adding subscription');
        
        // Compliance
        addField('termsAcceptedAt', userAny.createdAt || now, 'Adding termsAcceptedAt');
        addField('privacyAcceptedAt', userAny.createdAt || now, 'Adding privacyAcceptedAt');
        addField('reportsCount', 0, 'Adding reportsCount');
        addField('blockedByAdmin', false, 'Adding blockedByAdmin');
        
        if (needsUpdate) {
          try {
            await firebaseService.updateUser(user.id, updates);
            updatedCount++;
            console.log('  ✅ Updated successfully');
          } catch {
            errorCount++;
            console.error('  ❌ Error while updating record');
          }
        } else {
          skippedCount++;
          console.log('  ⏭️ No updates needed');
        }
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('📈 Migration Summary:');
      console.log('='.repeat(60));
      console.log(`✅ Updated:  ${updatedCount} users`);
      console.log(`⏭️ Skipped:  ${skippedCount} users`);
      console.log(`❌ Errors:   ${errorCount} users`);
      console.log(`📊 Total:    ${users.length} users`);
      console.log('='.repeat(60));
      
      await loadUsers();
      showToast(`✅ تم ترحيل ${updatedCount} مستخدم بنجاح!`, 'success', 5000);
    } catch {
      console.error('💥 Migration failed');
      showToast('❌ فشل الترحيل', 'error');
    } finally {
      setMigrating(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    if (user.role === 'admin') {
      showToast('⚠️ لا يمكن حذف حساب المدير', 'error');
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    try {
      await firebaseService.deleteUser(userToDelete.id);
      
      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setFilteredUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      showToast('✅ تم حذف المستخدم بنجاح', 'success');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Check for permission errors
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        showToast('❌ الصلاحيات غير كافية لحذف المستخدم. يرجى التحقق من قواعد Firestore', 'error');
      } else {
        showToast('❌ حدث خطأ أثناء الحذف: ' + (error?.message || 'خطأ غير معروف'), 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleUpgradeUser = async () => {
    if (!selectedUser || !location.trim()) {
      showToast('⚠️ الموقع مطلوب', 'error');
      return;
    }
    
    setUpgrading(true);
    try {
      // Update in Firebase
      await firebaseService.upgradeUserToMerchant(selectedUser.id, {
        shopType,
        location: location.trim(),
        specialization: specialization.trim(),
        experience: experience.trim()
      });
      
      // Update local state
      setUsers(prev => 
        prev.map(u => u.id === selectedUser.id 
          ? { 
              ...u, 
              role: shopType === 'tailor' ? 'tailor' : 'shop',
              shopType,
              location: location.trim(),
              specialization: specialization.trim(),
              experience: experience.trim(),
              approvalStatus: 'approved'
            } 
          : u
        )
      );
      
      setShowUpgradeModal(false);
      setSelectedUser(null);
      showToast('✅ تم تحويل الحساب بنجاح!', 'success');
    } catch (error) {
      console.error('Error upgrading user:', error);
      showToast('❌ حدث خطأ أثناء التحويل', 'error');
    } finally {
      setUpgrading(false);
    }
  };

  const toggleSelection = (value: string, list: string[], setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
      return;
    }
    setter([...list, value]);
  };

  const setEditAllowedAdminSections = (allowed: string[]) => {
    setEditForm((prev) => ({
      ...prev,
      adminSections: allowed.join(', '),
      adminDeniedSections: ADMIN_SECTION_KEYS.filter((section) => !allowed.includes(section)).join(', '),
    }));
  };

  const setEditAllowedConfigSections = (allowed: string[]) => {
    setEditForm((prev) => ({
      ...prev,
      adminConfigSections: allowed.join(', '),
      adminDeniedConfigSections: ADMIN_CONFIG_KEYS.filter((section) => !allowed.includes(section)).join(', '),
    }));
  };

  const handleOpenPromoteAdmin = (user: User) => {
    setPromoteTargetUser(user);
    setPromoteAdminMode('limited');
    setPromoteAdminSections(['dashboard', 'orders', 'products', 'users']);
    setPromoteAdminConfigSections(['general']);
    setShowPromoteAdminModal(true);
  };

  const handlePromoteToAdmin = async () => {
    if (!promoteTargetUser) return;
    if (promoteAdminMode === 'limited' && promoteAdminSections.length === 0) {
      showToast('⚠️ اختر صفحة واحدة على الأقل للوصول المحدود', 'error');
      return;
    }

    setPromotingAdmin(true);
    try {
      const nextAdminAccess =
        promoteAdminMode === 'full'
          ? {
              mode: 'full',
              sections: ['*'],
              deniedSections: [],
              configSections: ['*'],
              deniedConfigSections: [],
            }
          : {
              mode: 'limited',
              sections: promoteAdminSections,
              deniedSections: ADMIN_SECTION_KEYS.filter((section) => !promoteAdminSections.includes(section)),
              configSections: promoteAdminConfigSections,
              deniedConfigSections: ADMIN_CONFIG_KEYS.filter((section) => !promoteAdminConfigSections.includes(section)),
            };

      await firebaseService.updateUser(promoteTargetUser.id, {
        role: 'admin',
        ...(nextAdminAccess as any ? { adminAccess: nextAdminAccess as any, adminPermissions: nextAdminAccess as any } : {}),
      } as any);

      setUsers((prev) =>
        prev.map((u: any) =>
          u.id === promoteTargetUser.id
            ? { ...u, role: 'admin', adminAccess: nextAdminAccess, adminPermissions: nextAdminAccess }
            : u
        )
      );
      setShowPromoteAdminModal(false);
      setPromoteTargetUser(null);
      showToast('✅ تم تعيين المستخدم كمدير مع الصلاحيات المحددة', 'success');
    } catch (error) {
      console.error('Error promoting user to admin:', error);
      showToast('❌ تعذر تعيين المستخدم كمدير', 'error');
    } finally {
      setPromotingAdmin(false);
    }
  };

  // =====================
  // Debug Panel State
  // =====================
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ 
    regionsCount: number;
    lastSent?: Partial<User>;
    lastRole?: string;
    lastForm?: any;
    userAfterSave?: User;
    lastError?: string;
  }>({ regionsCount: 0 });

  useEffect(() => {
    setDebugInfo(prev => ({ ...prev, regionsCount: regions.length }));
  }, [regions]);

  const getShopTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      tailor: 'خياط',
      boutique: 'بوتيك',
      fabric_store: 'محل أقمشة',
      sewing_supplies: 'مستلزمات خياطة'
    };
    return types[type];
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      user: 'مستخدم عادي',
      tailor: 'تاجر/خياط',
      admin: 'مدير',
      shop: 'صاحب محل'
    };
    return roles[role] || role;
  };

  const getAgeGroupLabel = (ageGroup?: AgeGroup | string) => {
    if (!ageGroup) return '-';
    const groups: Record<string, string> = {
      '18-23': '18-23 سنة',
      '24-30': '24-30 سنة',
      '31-40': '31-40 سنة',
      '41-50': '41-50 سنة',
      '50+': '50+ سنة',
      'not_specified': 'غير محدد'
    };
    return groups[ageGroup] || ageGroup;
  };

  const stats = {
    total: users.length,
    regularUsers: users.filter(u => u.role === 'user').length,
    merchants: users.filter(u => u.role === 'tailor' || u.role === 'shop').length,
    admins: users.filter(u => u.role === 'admin').length,
    limitedAdmins: users.filter((u: any) => isLimitedAdminUser(u)).length
  };

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-3 space-y-3">
      {toast.open && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] max-w-md w-full rounded-xl p-4 shadow-2xl text-sm transition-all animate-in zoom-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 leading-tight">{toast.message}</div>
            <button
              onClick={() => setToast(prev => ({ ...prev, open: false }))}
              className="ml-2 opacity-90 hover:opacity-100 focus:outline-none"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            إدارة المستخدمين
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            عرض وإدارة جميع المستخدمين وتحويل الحسابات العادية إلى حسابات تجار
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleMigrateUsers}
            disabled={migrating || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            title="إضافة الحقول المفقودة لجميع المستخدمين"
          >
            <RefreshCw size={14} className={migrating ? 'animate-spin' : ''} />
            <span className="text-xs font-medium">ترحيل البيانات</span>
          </button>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs font-medium">تحديث</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">إجمالي</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{stats.total}</p>
            </div>
            <Users size={18} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">عاديين</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-0.5">{stats.regularUsers}</p>
            </div>
            <Users size={18} className="text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">تجار</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">{stats.merchants}</p>
            </div>
            <Store size={18} className="text-purple-500" />
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">مدراء</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{stats.admins}</p>
            </div>
            <CheckCircle2 size={18} className="text-red-500" />
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">مدراء محدودون</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{stats.limitedAdmins}</p>
            </div>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
        </div>
      </div>

      {/* Search Bar and Role Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
            className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="relative">
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-white appearance-none cursor-pointer"
            title="تصفية المستخدمين حسب الدور"
          >
            <option value="all">جميع المستخدمين</option>
            <option value="user">مستخدمين عاديين</option>
            <option value="tailor">خياطين</option>
            <option value="shop">محلات تجارية</option>
            <option value="admin">مدراء</option>
            <option value="limited_admin">مدراء بصلاحيات محدودة</option>
            <option value="merged_duplicates">سجلات مدمجة (مكررة)</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
              <tr>
                <th className="text-right px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">الاسم</th>
                <th className="text-right px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">البريد</th>
                <th className="text-right px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">الهاتف</th>
                <th className="text-right px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">الدور</th>
                <th className="text-right px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">المنطقة</th>
                <th className="text-right px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">الفئة</th>
                <th className="text-center px-2 py-1.5 text-[9px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-slate-400 text-xs">
                    {searchTerm || roleFilter !== 'all' ? 'لا توجد نتائج' : 'لا يوجد مستخدمين'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={
                      `transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ` +
                      (idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900')
                    }
                  >
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-white text-[11px]">{user.name}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span>{user.email}</span>
                        {(user as any).isMergedDuplicate && (user as any).mergedIntoUid && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono">
                            merged → {(user as any).mergedIntoUid}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-400">{user.phone || '-'}</td>
                    <td className="px-2 py-1.5">
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        user.role === 'user' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : user.role === 'admin'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {getRoleLabel(user.role)}
                        {user.shopType && ` (${getShopTypeLabel(user.shopType)})`}
                      </span>
                      {isLimitedAdminUser(user as any) && (
                        <span className="mr-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          محدود
                        </span>
                      )}
                      
                      {/* Pending Status Icon */}
                      {(user.role === 'tailor' || user.role === 'shop') && user.approvalStatus === 'pending' && (
                        <div className="mt-0.5 flex items-center gap-0.5 text-[9px] text-amber-600 font-medium animate-pulse">
                          <Clock size={9} />
                          <span>قيد الانتظار</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-400">{user.region || user.location || '-'}</td>
                    <td className="px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {user.role === 'user' ? getAgeGroupLabel(user.ageGroup) : '-'}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Upgrade Button (Right in RTL) */}
                        {user.role === 'user' && (
                          <button
                            onClick={() => handleOpenUpgrade(user)}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-100 rounded transition-all"
                            title="ترقية لتاجر"
                          >
                            <Store size={13} />
                          </button>
                        )}

                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleOpenPromoteAdmin(user)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded transition-all"
                            title="تعيين كمدير مع صلاحيات"
                          >
                            <Shield size={13} />
                          </button>
                        )}

                        {/* Edit Button (Middle) */}
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded transition-all"
                          title="تعديل البيانات"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Delete Button (Left in RTL) */}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded transition-all"
                            title="حذف المستخدم"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <td colSpan={7} className="px-2 py-1 text-[10px] text-slate-700 dark:text-slate-300 text-right">
                  عرض <span className="font-semibold text-slate-900 dark:text-white">{filteredUsers.length}</span> من
                  {' '}<span className="font-semibold text-slate-900 dark:text-white">{roleFilter === 'merged_duplicates' ? mergedDuplicateUsers.length : users.length}</span> مستخدمًا
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="mt-4">
        <button
          onClick={() => setDebugOpen(v => !v)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          {debugOpen ? 'إخفاء لوحة التشخيص' : 'إظهار لوحة التشخيص'}
        </button>
        {debugOpen && (
          <div className="mt-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-2">📊 الحالة العامة</div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <div>عدد المناطق المحملة: <strong className="text-blue-600 dark:text-blue-400">{debugInfo.regionsCount}</strong></div>
                  <div>تصفية الدور الحالية: <strong className="text-purple-600 dark:text-purple-400">{roleFilter}</strong></div>
                  <div>عدد المستخدمين: <strong className="text-green-600 dark:text-green-400">{users.length}</strong> | بعد التصفية: <strong className="text-green-600 dark:text-green-400">{filteredUsers.length}</strong></div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-2">📤 آخر بيانات مرسلة</div>
                <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 overflow-auto max-h-32 text-[10px]">
  {JSON.stringify({ role: debugInfo.lastRole, sent: debugInfo.lastSent, form: debugInfo.lastForm }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-2">✅ المستخدم بعد الحفظ (من Firestore)</div>
                <pre className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-2 overflow-auto max-h-32 text-[10px]">
  {JSON.stringify(debugInfo.userAfterSave ? { 
    id: debugInfo.userAfterSave.id, 
    name: debugInfo.userAfterSave.name, 
    region: debugInfo.userAfterSave.region, 
    ageGroup: debugInfo.userAfterSave.ageGroup 
  } : null, null, 2)}
                </pre>
                {debugInfo.userAfterSave && (
                  <div className="mt-2 space-y-0.5">
                    <div className={debugInfo.userAfterSave.region ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      المنطقة: {debugInfo.userAfterSave.region || '❌ غير محفوظة'}
                    </div>
                    <div className={debugInfo.userAfterSave.ageGroup ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      الفئة العمرية: {debugInfo.userAfterSave.ageGroup || '❌ غير محفوظة'}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-2">🔍 جميع المستخدمين (region & ageGroup)</div>
                <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 overflow-auto max-h-32 text-[10px]">
  {JSON.stringify(users.slice(0, 5).map(u => ({ 
    name: u.name, 
    region: u.region, 
    ageGroup: u.ageGroup 
  })), null, 2)}
                </pre>
                <div className="mt-1 text-slate-500 dark:text-slate-400">(أول 5 مستخدمين)</div>
              </div>
            </div>

            {debugInfo.lastError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <div className="font-semibold text-red-900 dark:text-red-200 mb-1">❌ آخر خطأ</div>
                <div className="text-red-700 dark:text-red-300">{debugInfo.lastError}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              تحويل حساب: {selectedUser.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              قم بتعبئة المعلومات التالية لتحويل الحساب من مستخدم عادي إلى تاجر/خياط
            </p>

              <div className="space-y-4">
              {/* Shop Type Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  نوع المتجر/الخدمة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'tailor', label: 'خياط', icon: Scissors },
                    { value: 'boutique', label: 'بوتيك', icon: Store },
                    { value: 'fabric_store', label: 'محل أقمشة', icon: Package },
                    { value: 'sewing_supplies', label: 'مستلزمات', icon: Package }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setShopType(value as string)}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${
                        shopType === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  الموقع/المدينة
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: الخوير، مسقط"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يمكنك تحديد موقع أكثر دقة من المنطقة المختارة
                </p>
              </div>

              {/* Specialization & Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    التخصص
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="مثال: دشاديش"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    سنوات الخبرة
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="مثال: 10 سنوات"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  سيتم الموافقة على الحساب تلقائياً لأنك تقوم بالتحويل من لوحة الإدارة. يمكن للتاجر البدء بإضافة منتجاته مباشرة.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpgradeUser}
                disabled={upgrading || !location}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:shadow-none"
              >
                {upgrading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    جاري التحويل...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    تأكيد التحويل
                  </>
                )}
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={upgrading}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showPromoteAdminModal && promoteTargetUser && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !promotingAdmin && setShowPromoteAdminModal(false)}
          />

          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              تعيين كمدير: {promoteTargetUser.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              اختر الصفحات التي يمكن لهذا المدير الوصول إليها. الصفحات غير المحددة لن تظهر له في الشريط الجانبي.
            </p>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20 p-3 mb-4">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                سيتم الحفظ في الحقول: adminAccess / adminPermissions
              </p>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPromoteAdminMode('full')}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  promoteAdminMode === 'full'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Full Access
              </button>
              <button
                type="button"
                onClick={() => setPromoteAdminMode('limited')}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  promoteAdminMode === 'limited'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Limited Access
              </button>
            </div>

            {promoteAdminMode === 'limited' && (
              <>
                <div className="mb-4">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">صفحات الإدارة</p>
                  <div className="space-y-3">
                    {ADMIN_SECTION_GROUPS.map((group) => (
                      <div key={group.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/50">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{group.title}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.keys.map((section) => {
                            const checked = promoteAdminSections.includes(section);
                            return (
                              <label key={section} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${checked ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSelection(section, promoteAdminSections, setPromoteAdminSections)}
                                  title={`صلاحية ${ADMIN_SECTION_LABELS[section] || section}`}
                                  aria-label={`صلاحية ${ADMIN_SECTION_LABELS[section] || section}`}
                                  className="rounded border-slate-300"
                                />
                                <span>{ADMIN_SECTION_LABELS[section] || section}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">تبويبات الإعدادات</p>
                  <div className="space-y-3">
                    {ADMIN_CONFIG_GROUPS.map((group) => (
                      <div key={group.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/50">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{group.title}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.keys.map((section) => {
                            const checked = promoteAdminConfigSections.includes(section);
                            return (
                              <label key={section} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${checked ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSelection(section, promoteAdminConfigSections, setPromoteAdminConfigSections)}
                                  title={`صلاحية إعدادات ${ADMIN_CONFIG_LABELS[section] || section}`}
                                  aria-label={`صلاحية إعدادات ${ADMIN_CONFIG_LABELS[section] || section}`}
                                  className="rounded border-slate-300"
                                />
                                <span>{ADMIN_CONFIG_LABELS[section] || section}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePromoteToAdmin}
                disabled={promotingAdmin}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-all"
              >
                {promotingAdmin ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    تأكيد تعيين المدير
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPromoteAdminModal(false)}
                disabled={promotingAdmin}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-0 animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-700/80 px-4 py-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تعديل بيانات: {selectedUser.name}
                </h3>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="h-8 px-2 text-xs rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                  className="h-8 px-2 text-xs rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-slate-50/80 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-60"
                >
                  إلغاء
                </button>
                {selectedUser?.email && (
                  <button
                    onClick={() => selectedUser && handleSendPasswordReset(selectedUser)}
                    disabled={saving}
                    className="h-8 px-2 text-xs rounded-md border border-amber-300/70 bg-amber-50/80 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-60"
                    title="إرسال رابط إعادة تعيين كلمة المرور"
                  >
                    إعادة ضبط كلمة المرور
                  </button>
                )}
                <button
                  onClick={() => selectedUser && handleLoginAsUser(selectedUser)}
                  disabled={saving}
                  className="h-8 px-2 text-xs rounded-md border border-indigo-400/70 bg-indigo-50/80 text-indigo-800 hover:bg-indigo-100 transition-colors disabled:opacity-60"
                  title="تسجيل الدخول بهذا الحساب"
                >
                  تسجيل دخول كمستخدم
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.name || !editForm.email}
                  className="h-8 px-3 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-1"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      جاري الحفظ
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      حفظ
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="px-4 pt-3 pb-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                قم بتحديث معلومات المستخدم ({getRoleLabel(selectedUser.role)})
              </p>

            <div className="space-y-3">
              {/* Shop Name (for tailor/shop only) */}
              {(selectedUser.role === 'tailor' || selectedUser.role === 'shop' || (selectedUser as any).shopType) && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                  <label className="block text-xs font-bold text-purple-900 dark:text-purple-100 mb-1.5">
                    اسم المتجر (Shop Name)
                  </label>
                  <input
                    type="text"
                    value={editForm.shopName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shopName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="مثال: خياط عمّاني"
                  />
                  <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-1">
                    يظهر هذا الاسم في واجهة عرض المنتجات
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                    title="اسم المستخدم"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    required
                    title="البريد الإلكتروني"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    title="رقم الهاتف"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Media: Profile & Board images (URL + Upload) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    صورة الملف الشخصي (URL)
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: profileImage</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editForm.profileImage}
                      onChange={(e) => setEditForm({...editForm, profileImage: e.target.value})}
                      placeholder="https://example.com/profile.jpg"
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <label className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer text-sm">
                      رفع
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedUser) {
                            setImagePrepFile(file);
                            setImagePrepType('profile');
                            setImagePrepOpen(true);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {editForm.profileImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={editForm.profileImage} alt="صورة الملف الشخصي" className="h-16 w-16 rounded-lg object-cover border" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    صورة الواجهة/اللوحة (URL)
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: boardImage</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editForm.boardImage}
                      onChange={(e) => setEditForm({...editForm, boardImage: e.target.value})}
                      placeholder="https://example.com/cover.jpg"
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                    <label className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer text-sm">
                      رفع
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && selectedUser) {
                            setImagePrepFile(file);
                            setImagePrepType('board');
                            setImagePrepOpen(true);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {editForm.boardImage && (
                    <div className="mt-2">
                      <img src={editForm.boardImage} alt="صورة الواجهة/اللوحة" className="h-16 w-28 rounded-lg object-cover border" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رقم الهاتف
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: phone</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="مثال: +968 9999 9999"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    المنطقة/الولاية
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: region</span>
                  </label>
                  <select
                    value={editForm.region}
                    onChange={(e) => {
                      const newRegion = e.target.value;
                      const oldRegion = editForm.region;
                      setEditForm({
                        ...editForm, 
                        region: newRegion,
                        // تعيين الموقع تلقائياً ليكون نفس المنطقة فقط إذا كان فارغاً أو يساوي المنطقة القديمة
                        location: (!editForm.location || editForm.location === oldRegion) ? newRegion : editForm.location
                      });
                    }}
                    title="المنطقة أو الولاية"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="">اختر المنطقة</option>
                    {regions.map(region => (
                      <option key={region.id} value={region.name}>{region.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Access & Security Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    رقم الدخول (Login ID)
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: loginId</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.loginId}
                    onChange={(e) => setEditForm({ ...editForm, loginId: e.target.value })}
                    placeholder="رقم الهاتف أو البريد"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">نوصي باستخدام رقم الهاتف كمعرّف دخول للخياطين.</p>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="createdByAdmin"
                    type="checkbox"
                    checked={editForm.createdByAdmin}
                    onChange={(e) => setEditForm({ ...editForm, createdByAdmin: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="createdByAdmin" className="text-sm text-slate-700 dark:text-slate-300">
                    تم إنشاء الحساب بواسطة الإدارة
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: createdByAdmin</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="requirePasswordChange"
                    type="checkbox"
                    checked={editForm.requirePasswordChange}
                    onChange={(e) => setEditForm({ ...editForm, requirePasswordChange: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="requirePasswordChange" className="text-sm text-slate-700 dark:text-slate-300">
                    طلب تغيير كلمة المرور عند أول تسجيل دخول
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: requirePasswordChange</span>
                  </label>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  بعد اكتمال البروفايل نطلب منهم تغيير الباسورد بأنفسهم. يمكنك إرسال رابط إعادة التعيين من صفحة المستخدم.
                </div>
              </div>

              {selectedUser.role === 'admin' && (
                <div className="rounded-lg border border-amber-300/70 bg-amber-50/70 dark:bg-amber-900/20 dark:border-amber-700 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-200">صلاحيات لوحة الإدارة</p>
                      <p className="text-xs text-amber-800/80 dark:text-amber-300/80">تُحفظ في الحقول: adminAccess / adminPermissions</p>
                    </div>
                    <select
                      value={editForm.adminAccessMode}
                      onChange={(e) => {
                        const mode = e.target.value as 'full' | 'limited';
                        if (mode === 'full') {
                          setEditForm((prev) => ({
                            ...prev,
                            adminAccessMode: 'full',
                            adminSections: '',
                            adminDeniedSections: '',
                            adminConfigSections: '',
                            adminDeniedConfigSections: '',
                          }));
                        } else {
                          const defaultAllowedSections = splitCsv(editForm.adminSections).length
                            ? splitCsv(editForm.adminSections)
                            : ['dashboard', 'orders', 'products', 'users'];
                          const defaultAllowedConfig = splitCsv(editForm.adminConfigSections).length
                            ? splitCsv(editForm.adminConfigSections)
                            : ['general'];
                          setEditForm((prev) => ({
                            ...prev,
                            adminAccessMode: 'limited',
                            adminSections: defaultAllowedSections.join(', '),
                            adminDeniedSections: ADMIN_SECTION_KEYS.filter((section) => !defaultAllowedSections.includes(section)).join(', '),
                            adminConfigSections: defaultAllowedConfig.join(', '),
                            adminDeniedConfigSections: ADMIN_CONFIG_KEYS.filter((section) => !defaultAllowedConfig.includes(section)).join(', '),
                          }));
                        }
                      }}
                      title="وضع صلاحيات المدير"
                      className="px-3 py-1.5 text-sm rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="full">Full Access</option>
                      <option value="limited">Limited Access</option>
                    </select>
                  </div>

                  {editForm.adminAccessMode === 'limited' && (
                    <>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">صفحات الإدارة</p>
                        <div className="space-y-3">
                          {ADMIN_SECTION_GROUPS.map((group) => (
                            <div key={group.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/50">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">{group.title}</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {group.keys.map((section) => {
                                  const selected = splitCsv(editForm.adminSections).includes(section);
                                  return (
                                    <label
                                      key={section}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${selected ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        title={`صلاحية ${ADMIN_SECTION_LABELS[section] || section}`}
                                        aria-label={`صلاحية ${ADMIN_SECTION_LABELS[section] || section}`}
                                        onChange={() => {
                                          const next = splitCsv(editForm.adminSections);
                                          if (next.includes(section)) {
                                            setEditAllowedAdminSections(next.filter((item) => item !== section));
                                          } else {
                                            setEditAllowedAdminSections([...next, section]);
                                          }
                                        }}
                                        className="rounded border-slate-300"
                                      />
                                      <span>{ADMIN_SECTION_LABELS[section] || section}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">تبويبات الإعدادات</p>
                        <div className="space-y-3">
                          {ADMIN_CONFIG_GROUPS.map((group) => (
                            <div key={group.title} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/50">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">{group.title}</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {group.keys.map((section) => {
                                  const selected = splitCsv(editForm.adminConfigSections).includes(section);
                                  return (
                                    <label
                                      key={section}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${selected ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        title={`صلاحية إعدادات ${ADMIN_CONFIG_LABELS[section] || section}`}
                                        aria-label={`صلاحية إعدادات ${ADMIN_CONFIG_LABELS[section] || section}`}
                                        onChange={() => {
                                          const next = splitCsv(editForm.adminConfigSections);
                                          if (next.includes(section)) {
                                            setEditAllowedConfigSections(next.filter((item) => item !== section));
                                          } else {
                                            setEditAllowedConfigSections([...next, section]);
                                          }
                                        }}
                                        className="rounded border-slate-300"
                                      />
                                      <span>{ADMIN_CONFIG_LABELS[section] || section}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          adminAccessMode: 'limited',
                          adminSections: 'dashboard, products, measurements, fabrics',
                          adminDeniedSections: ADMIN_SECTION_KEYS.filter((section) => !['dashboard', 'products', 'measurements', 'fabrics'].includes(section)).join(', '),
                          adminConfigSections: 'general',
                          adminDeniedConfigSections: ADMIN_CONFIG_KEYS.filter((section) => !['general'].includes(section)).join(', '),
                        }))
                      }
                      className="px-3 py-1.5 text-xs rounded-lg border border-amber-400/70 bg-amber-100 hover:bg-amber-200 text-amber-900"
                    >
                      تعبئة نموذج وصول محدود
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          adminAccessMode: 'full',
                          adminSections: '',
                          adminDeniedSections: '',
                          adminConfigSections: '',
                          adminDeniedConfigSections: '',
                        }))
                      }
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      مسح القيم والعودة لـ Full
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <p>الصفحات غير المحددة لن تظهر في الشريط الجانبي لهذا المدير.</p>
                    <p>عند اختيار Full Access سيتم منح الوصول الكامل لكل الصفحات.</p>
                  </div>
                </div>
              )}

              {/* Age Group - Only for regular users */}
              {selectedUser.role === 'user' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    الفئة العمرية
                    <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: ageGroup</span>
                  </label>
                  <select
                    value={editForm.ageGroup}
                    onChange={(e) => setEditForm({...editForm, ageGroup: e.target.value as AgeGroup})}
                    title="الفئة العمرية"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="">اختر الفئة العمرية</option>
                    <option value="18-23">18-23 سنة</option>
                    <option value="24-30">24-30 سنة</option>
                    <option value="31-40">31-40 سنة</option>
                    <option value="41-50">41-50 سنة</option>
                    <option value="50+">50+ سنة</option>
                    <option value="not_specified">أفضل عدم التحديد</option>
                  </select>
                </div>
              )}

              {/* Merchant Fields - Only for tailors/shops */}
              {(selectedUser.role === 'tailor' || selectedUser.role === 'shop') && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع المحل/الخدمة <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: shopType</span></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'tailor', label: 'خياط' },
                        { value: 'boutique', label: 'بوتيك' },
                        { value: 'fabric_store', label: 'محل أقمشة' },
                        { value: 'sewing_supplies', label: 'مستلزمات خياطة' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, shopType: opt.value })}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${editForm.shopType === opt.value ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      موقع المحل <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: location</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      placeholder="مثال: الخوير، مسقط"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">التخصص (نسائي/رجالي) <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: specialization</span></label>
                    <div className="flex gap-2">
                      {[
                        { value: 'male', label: 'رجالي' },
                        { value: 'female', label: 'نسائي' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, specialization: opt.value })}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${editForm.specialization === opt.value ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      سنوات الخبرة <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: experience</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.experience}
                      onChange={(e) => setEditForm({...editForm, experience: e.target.value})}
                      placeholder="مثال: 10 سنوات"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      نبذة عن المحل <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: bio</span>
                    </label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      placeholder="اكتب نبذة تعريفية..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">حالة الحساب <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: approvalStatus</span></label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'pending', label: 'قيد الانتظار' },
                        { value: 'approved', label: 'معتمد' },
                        { value: 'rejected', label: 'مرفوض' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, approvalStatus: opt.value })}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${editForm.approvalStatus === opt.value ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">* يمكنك تغيير حالة الحساب يدوياً. اختر "معتمد" لتفعيل الحساب فوراً.</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.isFeatured || false}
                        onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">⭐ خياط معتمد (يظهر في الصفحة الرئيسية) <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">key: isFeatured</span></span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 mr-7">* الخياطون المعتمدون يظهرون في قسم "خياطين معتمدين" في الصفحة الرئيسية</p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name || !editForm.email}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 disabled:shadow-none"
              >
                {saving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    حفظ التعديلات
                  </>
                )}
              </button>
              {selectedUser?.email && (
                <button
                  onClick={() => selectedUser && handleSendPasswordReset(selectedUser)}
                  disabled={saving}
                  className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                  title="إرسال رابط إعادة تعيين كلمة المرور"
                >
                  إرسال إعادة تعيين كلمة المرور
                </button>
              )}
              <button
                onClick={() => selectedUser && handleLoginAsUser(selectedUser)}
                disabled={saving}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
                title="تسجيل الدخول بهذا الحساب للمساعدة"
              >
                تسجيل الدخول بهذا الحساب
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>

            {/* Manage Products for this shop */}
            {(selectedUser.role === 'tailor' || selectedUser.role === 'shop' || (selectedUser as any).shopType) && (
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Package size={18} className="text-purple-600" />
                    إدارة منتجات المتجر
                  </h4>
                  <button
                    onClick={async () => {
                      const next = !showManageProducts;
                      setShowManageProducts(next);
                      if (next && selectedUser) {
                        await Promise.all([
                          loadUserProducts(selectedUser.id),
                          productCategories.length === 0 ? loadProductCategories() : Promise.resolve()
                        ]);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    {showManageProducts ? 'إخفاء' : 'عرض المنتجات'}
                  </button>
                </div>
                {showManageProducts && (
                  <div className="space-y-3">
                    {productsLoading ? (
                      <div className="text-sm text-slate-500 flex items-center gap-2 justify-center py-4">
                        <RefreshCw size={16} className="animate-spin" />
                        جارٍ التحميل...
                      </div>
                    ) : userProducts.length === 0 ? (
                      <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        <ImageIcon size={32} className="mx-auto mb-2 text-slate-400" />
                        لا توجد منتجات
                      </div>
                    ) : (
                      userProducts.map(p => {
                        const imgs = normalizedImages(p);
                        const need = needsNormalization(p);
                        const isEnabled = p.enabled !== false; // Default to true if not set
                        return (
                          <div key={p.id} className={`p-3 rounded-lg bg-gradient-to-br border shadow-sm transition-all ${
                            isEnabled 
                              ? 'from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700' 
                              : 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-600 opacity-60'
                          }`}>
                            {/* Product Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-semibold text-slate-800 dark:text-white text-sm">{p.name || 'منتج بدون اسم'}</div>
                                  {!isEnabled && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                                      معطل
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{p.id}</span>
                                  {need && <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">بحاجة لتحويل</span>}
                                </div>
                              </div>
                              <button
                                onClick={() => updateProduct(p, { enabled: !isEnabled })}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  isEnabled
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                                }`}
                                title={isEnabled ? 'تعطيل المنتج' : 'تفعيل المنتج'}
                              >
                                {isEnabled ? (
                                  <>
                                    <Eye size={14} />
                                    مفعل
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={14} />
                                    معطل
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Compact Product Info */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="relative">
                                <input 
                                  defaultValue={p.name} 
                                  onBlur={(e)=>{ const v=e.target.value; if(v!==p.name) updateProduct(p, { name: v }); }} 
                                  placeholder="اسم المنتج"
                                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none" 
                                />
                              </div>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="0.001" 
                                  defaultValue={p.price} 
                                  onBlur={(e)=>{ const v=parseFloat(e.target.value||'0'); if(v!==p.price) updateProduct(p, { price: v }); }} 
                                  placeholder="السعر"
                                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none" 
                                />
                              </div>
                              <select
                                value={p.categoryId || ''}
                                onChange={(e)=> updateProduct(p, { categoryId: e.target.value })}
                                title="تصنيف المنتج"
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              >
                                <option value="">— التصنيف —</option>
                                {productCategories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Image Cards Grid */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <ImageIcon size={14} />
                                  الصور ({imgs.length})
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {imgs.map((url: string, idx: number) => (
                                  <div
                                    key={`${p.id}_${idx}`}
                                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
                                    draggable
                                    onDragStart={() => { dragRef.current = { productId: p.id, index: idx }; }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                      if (dragRef.current && dragRef.current.productId === p.id) {
                                        reorderImages(p, dragRef.current.index, idx);
                                      }
                                      dragRef.current = null;
                                    }}
                                  >
                                    {/* Image */}
                                    <img src={url} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" />
                                    
                                    {/* Cover Badge */}
                                    {p.coverImageIndex === idx && (
                                      <div className="absolute top-1 right-1">
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-400 text-yellow-900 text-[9px] font-bold shadow-lg">
                                          <Star size={10} className="fill-yellow-900" />
                                          غلاف
                                        </div>
                                      </div>
                                    )}

                                    {/* Hover Overlay with Actions */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200">
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1">
                                        {/* Top Row: Open & Delete */}
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => window.open(url, '_blank')}
                                            className="p-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-lg transition-all"
                                            title="فتح في تبويب جديد"
                                          >
                                            <ExternalLink size={14} />
                                          </button>
                                          <button
                                            onClick={() => removeImageAt(p, idx)}
                                            className="p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all"
                                            title="حذف"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>

                                        {/* Middle Row: Set as Cover */}
                                        {p.coverImageIndex !== idx && (
                                          <button
                                            onClick={() => setAsCover(p, idx)}
                                            className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg shadow-lg transition-all text-[10px] font-bold flex items-center gap-1"
                                            title="تعيين كغلاف"
                                          >
                                            <Star size={12} />
                                            غلاف
                                          </button>
                                        )}

                                        {/* Bottom Row: Reorder */}
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => reorderImages(p, idx, Math.max(0, idx - 1))}
                                            disabled={idx === 0}
                                            className="p-1 bg-white/90 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded shadow-lg transition-all"
                                            title="تحريك لليسار"
                                          >
                                            <ArrowRight size={12} />
                                          </button>
                                          <button
                                            onClick={() => reorderImages(p, idx, Math.min(imgs.length - 1, idx + 1))}
                                            disabled={idx === imgs.length - 1}
                                            className="p-1 bg-white/90 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 rounded shadow-lg transition-all"
                                            title="تحريك لليمين"
                                          >
                                            <ArrowLeft size={12} />
                                          </button>
                                        </div>

                                        {/* Replace Image */}
                                        <label className="cursor-pointer">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                // Upload and replace at this index
                                                setUploadingProd(prev => ({ ...prev, [p.id]: true }));
                                                try {
                                                  // Resize image to max 900px height
                                                  const options = {
                                                    maxWidthOrHeight: 900,
                                                    useWebWorker: true,
                                                    fileType: 'image/jpeg' as const,
                                                    initialQuality: 0.9
                                                  };
                                                  const compressedFile = await imageCompression(file, options);
                                                  
                                                  const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
                                                  const storage = getStorage();
                                                  const fileId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
                                                  const path = `users/${selectedUser!.id}/products/${p.id}/${fileId}.jpg`;
                                                  const storageRef = ref(storage, path);
                                                  await uploadBytes(storageRef, compressedFile);
                                                  const newUrl = await getDownloadURL(storageRef);
                                                  
                                                  // Replace the image at this index
                                                  const newImages = [...imgs];
                                                  newImages[idx] = newUrl;
                                                  const coverIndex = p.coverImageIndex ?? 0;
                                                  const newImage = newImages[coverIndex] || newImages[0] || '';
                                                  
                                                  setUserProducts(prev => prev.map(x => x.id === p.id ? { ...x, images: newImages, image: newImage } : x));
                                                  await updateProduct(p, { images: newImages, image: newImage });
                                                } catch (err) {
                                                  console.error('Upload error:', err);
                                                } finally {
                                                  setUploadingProd(prev => ({ ...prev, [p.id]: false }));
                                                }
                                              }
                                              if (e.currentTarget) {
                                                e.currentTarget.value = '';
                                              }
                                            }}
                                          />
                                          <div className="px-2 py-1 bg-blue-500/90 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-all text-[10px] font-bold flex items-center gap-1">
                                            <Upload size={12} />
                                            استبدال
                                          </div>
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Add New Image Card - Multi-select and Drag & Drop */}
                                <label 
                                  className="group relative aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.add('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900/30');
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900/30');
                                  }}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900/30');
                                    
                                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                    if (files.length > 0) {
                                      await uploadMultipleProductImages(p, files);
                                    }
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={async (e) => {
                                      const files = Array.from(e.target.files || []);
                                      if (files.length > 0) {
                                        await uploadMultipleProductImages(p, files);
                                      }
                                      if (e.currentTarget) {
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                  />
                                  {uploadingProd[p.id] ? (
                                    <RefreshCw size={20} className="text-purple-500 animate-spin" />
                                  ) : (
                                    <>
                                      <ImagePlus size={24} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                                      <span className="text-[10px] text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 font-medium text-center px-2">
                                        إضافة صور<br/>
                                        <span className="text-[9px] opacity-70">اسحب أو اختر</span>
                                      </span>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            {/* Add by URL */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <input
                                value={newProdUrl[p.id] || ''}
                                onChange={(e) => setNewProdUrl(prev => ({ ...prev, [p.id]: e.target.value }))}
                                placeholder="أو أدخل رابط صورة"
                                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              />
                              <button
                                onClick={() => addImageUrl(p)}
                                disabled={!newProdUrl[p.id]?.trim()}
                                className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <ImagePlus size={12} />
                                إضافة
                              </button>
                            </div>

                            {/* Migration Button */}
                            {need && (
                              <button
                                onClick={() => transferImages(p)}
                                disabled={productSaving[p.id]}
                                className="w-full px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                              >
                                {productSaving[p.id] ? (
                                  <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    جارٍ التحويل...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw size={12} />
                                    تحويل الصور للطريقة الجديدة
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Debug Panel for User Details */}
            <div className="mt-6 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                  className="flex-1 flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    🔍 معلومات المستخدم التفصيلية (Debug)
                  </h4>
                  <ChevronRight size={18} className={`text-slate-600 dark:text-slate-400 transition-transform ${debugPanelOpen ? 'rotate-90' : ''}`} />
                </button>
                <button
                  onClick={async () => {
                    if (!selectedUser) return;
                    try {
                      const refreshedUser = await firebaseService.getUserProfile(selectedUser.id);
                      if (refreshedUser) {
                        setSelectedUser(refreshedUser);
                        showToast('✅ تم تحديث البيانات من Firestore', 'success');
                      }
                    } catch (error) {
                      console.error('Refresh error:', error);
                      showToast('❌ فشل تحديث البيانات', 'error');
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-all"
                >
                  🔄 تحديث من DB
                </button>
              </div>
              
              {debugPanelOpen && (
              <div className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Original User Object */}
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                    📦 كائن المستخدم الأصلي (selectedUser) - {Object.keys(selectedUser || {}).length} حقل
                  </div>
                  <pre className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 overflow-auto max-h-64 text-[9px] leading-relaxed">
{JSON.stringify(selectedUser, null, 2)}
                  </pre>
                </div>

                {/* Current Edit Form State */}
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                    📝 حالة النموذج الحالية (editForm)
                  </div>
                  <pre className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 overflow-auto max-h-48 text-[10px] leading-relaxed">
{JSON.stringify(editForm, null, 2)}
                  </pre>
                </div>

                {/* Image URLs Comparison */}
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                    🖼️ مقارنة روابط الصور
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
                    <div>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Profile Image:</span>
                      <div className="mt-1 break-all text-[9px]">
                        <div className="text-slate-500">Original: {(selectedUser as any)?.profileImage || '(empty)'}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 mt-1">Form: {editForm.profileImage || '(empty)'}</div>
                        <div className="mt-1">
                          {(selectedUser as any)?.profileImage === editForm.profileImage ? 
                            <span className="text-green-600">✅ متطابق</span> : 
                            <span className="text-amber-600">⚠️ مختلف</span>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">Board Image:</span>
                      <div className="mt-1 break-all text-[9px]">
                        <div className="text-slate-500">Original: {(selectedUser as any)?.boardImage || '(empty)'}</div>
                        <div className="text-emerald-600 dark:text-emerald-400 mt-1">Form: {editForm.boardImage || '(empty)'}</div>
                        <div className="mt-1">
                          {(selectedUser as any)?.boardImage === editForm.boardImage ? 
                            <span className="text-green-600">✅ متطابق</span> : 
                            <span className="text-amber-600">⚠️ مختلف</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type Information */}
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                    🏷️ معلومات النوع والحالة
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-1 text-[10px]">
                    <div><span className="text-slate-600 dark:text-slate-400">Role Type:</span> <span className="font-mono text-blue-600">{selectedUser?.role}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Shop Type:</span> <span className="font-mono text-purple-600">{selectedUser?.shopType || 'N/A'}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Approval Status:</span> <span className="font-mono text-green-600">{selectedUser?.approvalStatus || 'N/A'}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Created By Admin:</span> <span className="font-mono">{(selectedUser as any)?.createdByAdmin ? '✅ Yes' : '❌ No'}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Require Password Change:</span> <span className="font-mono">{(selectedUser as any)?.requirePasswordChange ? '✅ Yes' : '❌ No'}</span></div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-400">User ID:</span> <span className="font-mono text-[9px] text-slate-500">{selectedUser?.id}</span></div>
                  </div>
                </div>
                
                {/* Schema V1 Fields Status */}
                <div className="md:col-span-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                    🆕 حالة حقول Schema V1
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
                      {(() => {
                        const userAny = selectedUser as any;
                        const v1Fields = [
                          { name: 'uid', value: userAny?.uid },
                          { name: 'accountStatus', value: userAny?.accountStatus },
                          { name: 'dataVersion', value: userAny?.dataVersion },
                          { name: 'isEmailVerified', value: userAny?.isEmailVerified },
                          { name: 'isPhoneVerified', value: userAny?.isPhoneVerified },
                          { name: 'authProvider', value: userAny?.authProvider },
                          { name: 'preferredLanguage', value: userAny?.preferredLanguage },
                          { name: 'notificationPreferences', value: userAny?.notificationPreferences },
                          { name: 'coordinates', value: userAny?.coordinates },
                          { name: 'serviceAreas', value: userAny?.serviceAreas },
                          { name: 'shopName', value: userAny?.shopName, tailorOnly: true },
                          { name: 'services', value: userAny?.services, tailorOnly: true },
                          { name: 'workingHours', value: userAny?.workingHours, tailorOnly: true, checkValid: (v: any) => v && typeof v === 'object' && v.days },
                          { name: 'verificationStatus', value: userAny?.verificationStatus, tailorOnly: true },
                          { name: 'socialMedia', value: userAny?.socialMedia, tailorOnly: true },
                          { name: 'priceRange', value: userAny?.priceRange, tailorOnly: true },
                          { name: 'ratingAvg', value: userAny?.ratingAvg },
                          { name: 'ratingCount', value: userAny?.ratingCount },
                          { name: 'completedOrdersCount', value: userAny?.completedOrdersCount },
                          { name: 'subscription', value: userAny?.subscription },
                        ];
                        
                        const isTailor = selectedUser?.role === 'tailor' || selectedUser?.role === 'shop' || selectedUser?.role === 'boutique';
                        
                        return v1Fields
                          .filter(f => !f.tailorOnly || isTailor)
                          .map(field => {
                            let exists = field.value !== undefined && field.value !== null;
                            // Special validation for complex fields
                            if (exists && field.checkValid) {
                              exists = field.checkValid(field.value);
                            }
                            return (
                              <div key={field.name} className={`px-2 py-1 rounded ${exists ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`} title={exists ? 'موجود' : `مفقود أو غير صالح: ${JSON.stringify(field.value)}`}>
                                <span className="font-mono">{exists ? '✅' : '❌'} {field.name}</span>
                              </div>
                            );
                          });
                      })()}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="text-[10px] text-slate-600 dark:text-slate-400">
                        💡 اضغط على زر "ترحيل البيانات" أعلى الصفحة لإضافة الحقول المفقودة
                      </div>
                      <button
                        onClick={async () => {
                          if (!selectedUser) return;
                          const userAny = selectedUser as any;
                          const updates: any = {};
                          
                          // Check workingHours specifically
                          if (!userAny.workingHours || typeof userAny.workingHours !== 'object' || !userAny.workingHours.days) {
                            updates.workingHours = { days: 'السبت - الخميس', from: '09:00', to: '18:00' };
                          }
                          
                          if (Object.keys(updates).length > 0) {
                            try {
                              await firebaseService.updateUser(selectedUser.id, updates);
                              showToast('✅ تم إصلاح الحقول المفقودة', 'success');
                              await loadUsers();
                              setShowEditModal(false);
                            } catch (error) {
                              console.error('Fix error:', error);
                              showToast('❌ فشل إصلاح الحقول', 'error');
                            }
                          } else {
                            showToast('✅ جميع الحقول موجودة', 'success');
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[10px] rounded-lg transition-all"
                      >
                        🔧 إصلاح الحقول المفقودة لهذا المستخدم
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                حذف المستخدم
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                هل أنت متأكد من رغبتك في حذف المستخدم <span className="font-bold text-slate-900 dark:text-white">{userToDelete.name}</span>؟
                <br />
                <span className="text-red-500 text-xs mt-2 block">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30 hover:shadow-red-500/50 disabled:opacity-50 disabled:shadow-none"
                >
                  {deleting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      تأكيد الحذف
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Prep Modal */}
      <ImagePrepModal
        isOpen={imagePrepOpen}
        file={imagePrepFile}
        onCancel={() => {
          setImagePrepOpen(false);
          setImagePrepFile(null);
        }}
        onApply={handleImagePrepApply}
        mode="fabric"
      />
    </div>
  );
};
