import { firebaseService } from '@/src/services/firebase';
import { getAllCategories } from '@/src/admin/products/services';

export interface MeasurementPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
  name?: string;
  order?: number;
}

export interface MeasurementArrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  label?: string;
}

export interface MeasurementTemplate {
  id: string;
  name: string;
  baseImageUrl?: string;
  productType?: string;
  genderGroup?: 'male' | 'female';
  description?: string;
  points: MeasurementPoint[];
  arrows: MeasurementArrow[];
  videoUrl?: string;
  pointSize?: number;
  pointOpacity?: number;
  [key: string]: any;
}

export const measurementService = {
  /**
   * Loads all official and category-linked measurement templates.
   * Logic synchronized with useMeasurementTemplates.ts and ClientMeasurementsV2.tsx
   */
  async getTemplates(): Promise<MeasurementTemplate[]> {
    try {
      const saved = await firebaseService.getMeasurementTemplates();
      const categories = await getAllCategories();
      const categoriesMap = new Map(categories.map((c: any) => [c.id, c]));

      const getRootCategory = (category: any) => {
        let current: any | null = category;
        while (current?.parentId) {
          const parent = categoriesMap.get(current.parentId) || null;
          if (!parent) break;
          current = parent;
        }
        return current || category;
      };

      const normalizeGender = (value: unknown) => {
        const raw = String(value || '').toLowerCase();
        if (!raw) return undefined;
        if (raw === 'male' || raw === 'males' || raw === 'men') return 'male' as const;
        if (raw === 'female' || raw === 'females' || raw === 'women') return 'female' as const;
        return undefined;
      };

      const getGenderGroup = (category: any) => {
        let cursor: any | null = category;
        while (cursor) {
          const directGender = normalizeGender(cursor.gender);
          if (directGender) return directGender;
          if (!cursor.parentId) break;
          cursor = categoriesMap.get(cursor.parentId) || null;
        }

        const root = getRootCategory(category);
        const rootAr = String(root?.nameAr || '').trim();
        const rootEn = String(root?.nameEn || root?.name || '').toLowerCase();
        const rootSlug = String(root?.slug || '').toLowerCase();

        if (
          rootAr.includes('رجالي') ||
          rootAr.includes('الرجال') ||
          rootEn.includes('men') ||
          rootEn.includes('male') ||
          rootSlug.includes('men')
        ) {
          return 'male' as const;
        }

        if (
          rootAr.includes('نسائي') ||
          rootAr.includes('النساء') ||
          rootEn.includes('women') ||
          rootEn.includes('female') ||
          rootSlug.includes('women')
        ) {
          return 'female' as const;
        }

        return undefined;
      };

      const fashionRootIds = new Set(
        categories
          .filter((c: any) => c?.level === 0 && c?.categoryType === 'fashion')
          .map((c: any) => c.id)
      );

      const isFashionBranch = (category: any) => {
        const root = getRootCategory(category);
        if (!root) return false;
        if (fashionRootIds.size > 0) return fashionRootIds.has(root.id);
        const rootSlug = (root.slug?.toLowerCase?.() || '') as string;
        const rootNameEn = (root.nameEn?.toLowerCase?.() || '') as string;
        return (
          root.categoryType === 'fashion' ||
          rootSlug === 'fashion' ||
          rootNameEn === 'fashion' ||
          (typeof root.nameAr === 'string' && root.nameAr.includes('الأزياء'))
        );
      };

      let fashionCategories = categories.filter((c: any) => isFashionBranch(c));
      if (fashionCategories.length === 0) {
        fashionCategories = categories;
      }

      const merged: MeasurementTemplate[] = fashionCategories
        .map((cat: any) => {
          const t = saved.find((s) => s.id === cat.id);
          return {
            id: cat.id,
            name: (t?.name as any) || cat.nameAr || cat.nameEn || cat.id,
            productType: (t?.productType as any) || 'dishdasha',
            genderGroup: getGenderGroup(cat),
            description: (t?.description as any) || cat.descriptionAr || cat.descriptionEn || '',
            baseImageUrl: (t?.baseImageUrl as any) || '',
            points: (t?.points as any) || [],
            arrows: (t as any)?.arrows || [],
            pointSize: t?.pointSize || 44,
            pointOpacity: t?.pointOpacity || 90,
            ...(t || {}),
          } as MeasurementTemplate;
        })
        .sort((a, b) => {
          const ca = categoriesMap.get(a.id);
          const cb = categoriesMap.get(b.id);
          const la = (ca?.level ?? 0) as number;
          const lb = (cb?.level ?? 0) as number;
          if (la !== lb) return la - lb;
          const oa = (ca?.order ?? 0) as number;
          const ob = (cb?.order ?? 0) as number;
          if (oa !== ob) return oa - ob;
          return String(a.name || '').localeCompare(String(b.name || ''));
        });

      return merged;
    } catch (error) {
      console.error('[measurementService] Error loading templates:', error);
      return [];
    }
  },

  normalizeText(value: unknown): string {
    return String(value || '')
      .toLowerCase()
      .replace(/[\s\u200f\u200e]/g, '')
      .replace(/[\-–—]/g, '');
  },

  /**
   * Matches a product to its ideal measurement template.
   */
  async getTemplateForProduct(product: any, providedTemplates?: MeasurementTemplate[]): Promise<MeasurementTemplate | null> {
    if (!product) return null;
    
    const templates = providedTemplates || await this.getTemplates();
    if (!templates.length) return null;

    // 1. Try Match by ID (CategoryId)
    const categoryId = product.categoryId;
    const byId = templates.find((t) => t.id === categoryId) || null;
    if (byId && byId.points?.length > 0) return byId;

    // 2. Try Match by Normalized Name
    const categoryNameCandidates = [
      product.categoryName, 
      product.category, 
      product.categoryAr, 
      product.categoryEn,
      product.name, // Last resort
    ]
      .filter(Boolean)
      .map((x: any) => this.normalizeText(x));

    const byName = templates.find((t) => {
      const normalizedTemplateName = this.normalizeText(t.name);
      return categoryNameCandidates.some((n) => normalizedTemplateName === n || normalizedTemplateName.includes(n) || n.includes(normalizedTemplateName));
    }) || null;

    if (byName && byName.points?.length > 0) return byName;

    // 3. Match by Product Category Mapping (if applicable in product data)
    // ... possibly check more fields ...

    // 4. Default Fallback (Abaya or Dishdasha)
    const abaya = templates.find((t) => {
      const n = this.normalizeText(t.name);
      return n.includes('abaya') || n.includes('عباية');
    });

    if (abaya) return abaya;

    return templates[0] || null;
  },

  /**
   * Unified detection function as requested.
   * Returns all details needed for visual rendering and data entry.
   */
  async detectProductTemplateDetails(productId: string) {
    try {
      const product = await firebaseService.getProduct(productId);
      if (!product) return null;

      const template = await this.getTemplateForProduct(product);
      if (!template) return null;

      return {
        product,
        template,
        templateName: template.name,
        templateImage: template.baseImageUrl || template.categoryImageUrl,
        points: template.points || [],
        pointNames: (template.points || []).map(p => p.label || p.name),
        arrows: template.arrows || [],
        measurements: {} // Empty initially
      };
    } catch (error) {
      console.error('[measurementService] Error in detectProductTemplateDetails:', error);
      return null;
    }
  }
};
