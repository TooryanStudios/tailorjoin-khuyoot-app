import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy, collectionGroup, where } from 'firebase/firestore';
import { db } from '../../../../../services/firebase';
import { FeatureCardData } from '../components/ui';

export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  parentId: string | null;
  level: number;
  categoryType: 'fashion' | 'other';
  image: string;
  icon?: string;
  order: number;
  isActive: boolean;
  descriptionAr?: string;
  descriptionEn?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryId?: string;
  image?: string;
  images?: string[];
  price?: number | string;
  description?: string;
  tailorId?: string;
  isDraft?: boolean;
  status?: 'published' | 'draft' | 'hidden';
  createdAt?: any;
}

export interface CategoryWithProducts {
  category: Category;
  products: Product[];
  cards: FeatureCardData[];
}

export function useCategoriesWithProducts() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(
          query(collection(db, 'productCategories'), orderBy('order', 'asc'))
        );
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];

        // Fetch all products from subcollections
        const productsGroup = collectionGroup(db, 'products');
        const productsSnapshot = await getDocs(productsGroup);
        const productsData: Product[] = [];
        
        productsSnapshot.forEach(doc => {
          const data = doc.data() as any;
          // Include both published and draft products for admin view
          productsData.push({
            id: doc.id,
            name: data.name || data.nameAr || 'منتج بدون اسم',
            category: data.category || '',
            categoryId: data.categoryId || data.category || '',
            image: data.image || data.images?.[0] || '',
            images: data.images || (data.image ? [data.image] : []),
            price: data.price,
            description: data.description || data.descriptionAr || '',
            tailorId: data.tailorId,
            isDraft: data.isDraft || false,
            status: data.isDraft ? 'draft' : (data.isHidden ? 'hidden' : 'published'),
            createdAt: data.createdAt,
          });
        });

        setCategories(categoriesData);
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('حدث خطأ في جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group products by category and convert to card format
  const categorySections = useMemo(() => {
    // Get only level 1 categories (main categories, not parents)
    const mainCategories = categories.filter(c => c.level === 1 && c.isActive);

    return mainCategories.map(category => {
      // Find products that match this category (by id, slug, or nameAr)
      const categoryProducts = products.filter(p => 
        p.categoryId === category.id || 
        p.category === category.id ||
        p.category === category.slug ||
        p.category === category.nameAr ||
        p.category === category.nameEn
      );

      // Convert to FeatureCardData format
      const cards: FeatureCardData[] = categoryProducts.map(product => ({
        id: product.id,
        image: product.image || '',
        title: product.name,
        description: product.description || undefined,
        badge: product.isDraft 
          ? { text: 'مسودة', variant: 'new' as const }
          : product.createdAt && isNew(product.createdAt)
            ? { text: 'جديد', variant: 'new' as const }
            : undefined,
        onClick: () => {
          // TODO: Navigate to product edit
          console.log('Edit product:', product.id);
        },
      }));

      return {
        category,
        products: categoryProducts,
        cards,
      };
    }).filter(section => section.cards.length > 0); // Only show categories with products
  }, [categories, products]);

  // Get all products as flat list
  const allProductsList = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      image: product.image || '',
      category: getCategoryName(product.categoryId || product.category, categories) || product.category,
      price: typeof product.price === 'number' ? product.price.toFixed(2) : product.price || '0.00',
      status: (product.status || 'published') as 'published' | 'draft' | 'hidden',
      createdAt: formatDate(product.createdAt),
    }));
  }, [products, categories]);

  return {
    categories,
    products,
    categorySections,
    allProductsList,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Trigger useEffect by updating a dependency would be cleaner with a refetch counter
    },
  };
}

// Helper functions
function isNew(createdAt: any): boolean {
  if (!createdAt) return false;
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7; // Consider "new" if created within last 7 days
}

function getCategoryName(categoryId: string | undefined, categories: Category[]): string | undefined {
  if (!categoryId) return undefined;
  const category = categories.find(c => 
    c.id === categoryId || 
    c.slug === categoryId || 
    c.nameAr === categoryId
  );
  return category?.nameAr;
}

function formatDate(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString().split('T')[0];
}

export default useCategoriesWithProducts;
