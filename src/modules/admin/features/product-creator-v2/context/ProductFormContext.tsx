import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '../../../../../../types';
import { useApp } from '../../../../../../context/AppContext';
import { firebaseService } from '../../../../../../services/firebase';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';

interface ProductFormState {
  name: string;
  category: string;
  categoryId: string;
  price: string;
  duration: string;
  description: string;
  tags: string;
  allProductImages: string[];
  pendingImageFiles: File[];
  coverImageIndex: number;
  loading: boolean;
  uploadError: string;
}

interface ProductFormContextValue extends ProductFormState {
  setName: (name: string) => void;
  setCategory: (category: string) => void;
  setCategoryId: (id: string) => void;
  setPrice: (price: string) => void;
  setDuration: (duration: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string) => void;
  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;
  setCoverImage: (index: number) => void;
  publishProduct: () => Promise<void>;
  saveDraft: () => Promise<void>;
  reset: () => void;
}

const ProductFormContext = createContext<ProductFormContextValue | undefined>(undefined);

export const useProductForm = () => {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error('useProductForm must be used within ProductFormProvider');
  }
  return context;
};

export const ProductFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useApp();
  const storage = getStorage();
  
  const [state, setState] = useState<ProductFormState>({
    name: '',
    category: '',
    categoryId: '',
    price: '',
    duration: '',
    description: '',
    tags: '',
    allProductImages: [],
    pendingImageFiles: [],
    coverImageIndex: 0,
    loading: false,
    uploadError: ''
  });

  const setName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setState(prev => ({ ...prev, category }));
  }, []);

  const setCategoryId = useCallback((id: string) => {
    setState(prev => ({ ...prev, categoryId: id }));
  }, []);

  const setPrice = useCallback((price: string) => {
    setState(prev => ({ ...prev, price }));
  }, []);

  const setDuration = useCallback((duration: string) => {
    setState(prev => ({ ...prev, duration }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState(prev => ({ ...prev, description }));
  }, []);

  const setTags = useCallback((tags: string) => {
    setState(prev => ({ ...prev, tags }));
  }, []);

  const addImages = useCallback((files: File[]) => {
    const totalImages = state.allProductImages.length + state.pendingImageFiles.length;
    const remainingSlots = 10 - totalImages;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(`يمكنك رفع ${remainingSlots} صور فقط`);
    }

    // Create blob URLs for preview
    const blobUrls = filesToAdd.map(file => URL.createObjectURL(file));
    
    setState(prev => ({
      ...prev,
      pendingImageFiles: [...prev.pendingImageFiles, ...filesToAdd],
      allProductImages: [...prev.allProductImages, ...blobUrls],
      uploadError: ''
    }));
  }, [state.allProductImages.length, state.pendingImageFiles.length]);

  const removeImage = useCallback((index: number) => {
    const urlToDelete = state.allProductImages[index];
    if (urlToDelete.startsWith('blob:')) {
      URL.revokeObjectURL(urlToDelete);
      // Remove from pending files
      setState(prev => {
        const blobIndex = prev.allProductImages.slice(0, index).filter(u => u.startsWith('blob:')).length;
        return {
          ...prev,
          pendingImageFiles: prev.pendingImageFiles.filter((_, i) => i !== blobIndex),
          allProductImages: prev.allProductImages.filter((_, i) => i !== index),
          coverImageIndex: index === prev.coverImageIndex && prev.allProductImages.length > 1 
            ? 0 
            : index < prev.coverImageIndex 
              ? prev.coverImageIndex - 1 
              : prev.coverImageIndex
        };
      });
    } else {
      setState(prev => ({
        ...prev,
        allProductImages: prev.allProductImages.filter((_, i) => i !== index),
        coverImageIndex: index === prev.coverImageIndex && prev.allProductImages.length > 1 
          ? 0 
          : index < prev.coverImageIndex 
            ? prev.coverImageIndex - 1 
            : prev.coverImageIndex
      }));
    }
  }, [state.allProductImages]);

  const setCoverImage = useCallback((index: number) => {
    setState(prev => ({ ...prev, coverImageIndex: index }));
  }, []);

  const uploadPendingImages = async (): Promise<string[]> => {
    if (!user?.id) return [];
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };

    let pendingIndex = 0;
    const finalUrls: string[] = [];

    for (const url of state.allProductImages) {
      if (url.startsWith('blob:')) {
        const file = state.pendingImageFiles[pendingIndex++];
        if (!file) continue;
        
        const compressedFile = await imageCompression(file, options);
        const uniqueId = `${Date.now()}_${pendingIndex - 1}_${Math.random().toString(36).substring(7)}`;
        const storageRef = ref(storage, `products/${user.id}/${uniqueId}_${file.name}`);
        await uploadBytes(storageRef, compressedFile, {
          cacheControl: 'public, max-age=31536000'
        });
        const uploadedUrl = await getDownloadURL(storageRef);
        finalUrls.push(uploadedUrl);
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        finalUrls.push(url);
      }
    }

    return finalUrls;
  };

  const saveProduct = useCallback(async (isDraft: boolean) => {
    if (!user?.id) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!state.name || !state.price || !state.categoryId) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة (الاسم، السعر، التصنيف)');
      return;
    }

    if (state.allProductImages.length === 0) {
      alert('يجب إضافة صورة واحدة على الأقل');
      return;
    }

    setState(prev => ({ ...prev, loading: true, uploadError: '' }));

    try {
      const uploadedUrls = await uploadPendingImages();
      
      if (uploadedUrls.length === 0) {
        alert('يجب إضافة صورة واحدة على الأقل');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const trimmedDescription = state.description.trim();
      const parsedTags = state.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const newProduct: Product = {
        id: '',
        name: state.name,
        category: state.category,
        categoryId: state.categoryId,
        price: parseFloat(state.price),
        duration: state.duration,
        image: uploadedUrls[state.coverImageIndex] || uploadedUrls[0],
        coverImageIndex: state.coverImageIndex,
        images: uploadedUrls,
        rating: 0,
        location: user.location || 'عمان',
        tailorId: user.id,
        tailorName: user.name,
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
        isDraft
      };

      await firebaseService.addProduct(newProduct);

      alert(isDraft ? 'تم حفظ المنتج كمسودة!' : 'تم نشر المنتج بنجاح!');
      reset();
    } catch (error) {
      console.error('Error publishing product:', error);
      setState(prev => ({ 
        ...prev, 
        uploadError: 'حدث خطأ أثناء نشر المنتج. يرجى المحاولة مرة أخرى.' 
      }));
      alert('حدث خطأ أثناء نشر المنتج');
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state, user]);

  const publishProduct = useCallback(async () => {
    await saveProduct(false);
  }, [saveProduct]);

  const saveDraft = useCallback(async () => {
    await saveProduct(true);
  }, [saveProduct]);

  const reset = useCallback(() => {
    // Revoke blob URLs
    state.allProductImages.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });

    setState({
      name: '',
      category: '',
      categoryId: '',
      price: '',
      duration: '',
      description: '',
      tags: '',
      allProductImages: [],
      pendingImageFiles: [],
      coverImageIndex: 0,
      loading: false,
      uploadError: ''
    });
  }, [state.allProductImages]);

  return (
    <ProductFormContext.Provider
      value={{
        ...state,
        setName,
        setCategory,
        setCategoryId,
        setPrice,
        setDuration,
        setDescription,
        setTags,
        addImages,
        removeImage,
        setCoverImage,
        publishProduct,
        saveDraft,
        reset
      }}
    >
      {children}
    </ProductFormContext.Provider>
  );
};
