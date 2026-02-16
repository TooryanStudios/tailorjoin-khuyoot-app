import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, RefreshCw, Package } from 'lucide-react';
import { Category, ProductTemplate, CategoryTreeNode, CategoryFormData, ProductTemplateFormData } from './types';
import {
  getAllCategories,
  buildCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProductTemplates,
  createProductTemplate,
  updateProductTemplate,
  deleteProductTemplate
} from './services';
import { CategoryForm } from './components/CategoryForm';
import { ProductTemplateForm } from './components/ProductTemplateForm';

type TabType = 'categories' | 'templates';

const PRODUCT_TABS: ReadonlyArray<TabType> = ['categories', 'templates'];

type CategoryRow = {
  node: CategoryTreeNode;
  level: number;
};

function flattenCategoryTree(nodes: CategoryTreeNode[], level = 0, acc: CategoryRow[] = []): CategoryRow[] {
  nodes.forEach((node) => {
    acc.push({ node, level });
    if (node.children && node.children.length > 0) {
      flattenCategoryTree(node.children, level + 1, acc);
    }
  });
  return acc;
}

function getProductsTabFromPathname(pathname: string): TabType {
  const parts = String(pathname || '').split('/').filter(Boolean);
  // parts: ['admin', 'products', ':tab?']
  const tab = parts[2];
  if (PRODUCT_TABS.includes(tab as TabType)) return tab as TabType;
  return 'categories';
}

export const ProductsManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = getProductsTabFromPathname(location.pathname);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Category Form Modal
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);

  // Product Form Modal
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductTemplate | null>(null);
  const categoryRows = React.useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const pathname = location.pathname;
    const parts = String(pathname || '').split('/').filter(Boolean);
    if (parts[0] !== 'admin' || parts[1] !== 'products') return;

    const rawTab = parts[2];
    const canonical = `/admin/products/${getProductsTabFromPathname(pathname)}`;

    if (!rawTab || !PRODUCT_TABS.includes(rawTab as TabType)) {
      if (pathname !== canonical) navigate(canonical, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(query) ||
          p.nameEn.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCategories, tree, allProducts] = await Promise.all([
        getAllCategories(),
        buildCategoryTree(),
        getAllProductTemplates()
      ]);
      setCategories(allCategories);
      setCategoryTree(tree);
      setProducts(allProducts);
      setFilteredProducts(allProducts);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  // Category Handlers
  const handleAddCategory = (parentId?: string) => {
    setEditingCategory(null);
    setParentCategoryId(parentId);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setParentCategoryId(undefined);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      await loadData();
      setShowCategoryForm(false);
      setEditingCategory(null);
      setParentCategoryId(undefined);
    } catch (error) {
      console.error('خطأ في حفظ التصنيف:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      await loadData();
    } catch (error: any) {
      console.error('خطأ في حذف التصنيف:', error);
      alert(error.message || 'حدث خطأ أثناء حذف التصنيف');
    }
  };

  // Product Handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: ProductTemplate) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (data: ProductTemplateFormData) => {
    try {
      if (editingProduct) {
        await updateProductTemplate(editingProduct.id, data);
      } else {
        await createProductTemplate(data);
      }
      await loadData();
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('خطأ في حفظ المنتج:', error);
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    const confirmMessage = product 
      ? `هل أنت متأكد من حذف المنتج "${product.nameAr}" (${product.nameEn})؟\n\nملاحظة: لا يمكن التراجع عن هذا الإجراء.`
      : 'هل أنت متأكد من حذف هذا المنتج؟\n\nملاحظة: لا يمكن التراجع عن هذا الإجراء.';
    
    if (confirm(confirmMessage)) {
      try {
        await deleteProductTemplate(id);
        await loadData();
      } catch (error: any) {
        console.error('خطأ في حذف المنتج:', error);
        alert(error.message || 'حدث خطأ أثناء حذف المنتج');
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.nameAr : 'غير محدد';
  };

  const getCategoryLevel = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return typeof category?.level === 'number' ? category.level : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 md:p-6 min-h-[85vh] font-['Tajawal'] bg-[#ededed] dark:bg-zinc-950">
      {/* الرأس */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-end gap-3">
            <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 flex items-center justify-center">
              <Package size={24} className="text-theme-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-zinc-900 dark:text-white tracking-tight">
                إدارة المنتجات
              </h1>
              <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest mt-0.5">
                إدارة التصنيفات وقوالب المنتجات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold rounded-2xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              title="تحديث البيانات"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              تحديث
            </button>
            <button
              onClick={() =>
                activeTab === 'categories' ? handleAddCategory() : handleAddProduct()
              }
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl transition-colors shadow-sm text-xs"
            >
              <Plus size={16} />
              {activeTab === 'categories' ? 'إضافة تصنيف' : 'إضافة منتج'}
            </button>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-2 flex gap-1 w-fit">
        <button
          onClick={() => navigate('/admin/products/categories')}
          className={`px-4 py-2 rounded-2xl text-xs font-normal transition-all ${
            activeTab === 'categories'
              ? 'bg-theme-primary text-white shadow-sm font-bold'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          التصنيفات ({categories.length})
        </button>
        <button
          onClick={() => navigate('/admin/products/templates')}
          className={`px-4 py-2 rounded-2xl text-xs font-normal transition-all ${
            activeTab === 'templates'
              ? 'bg-theme-primary text-white shadow-sm font-bold'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
          }`}
        >
          قوالب المنتجات ({products.length})
        </button>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'categories' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-normal text-zinc-900 dark:text-white">
                التصنيفات الهرمية
              </h2>
            </div>
            {categoryRows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                  لا توجد تصنيفات بعد
                </p>
                <button
                  onClick={() => handleAddCategory()}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-colors"
                >
                  إضافة أول تصنيف
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                    <tr className="text-zinc-700 dark:text-zinc-300">
                      <th className="px-4 py-3 text-right font-normal">التصنيف</th>
                      <th className="px-4 py-3 text-right font-normal">المستوى</th>
                      <th className="px-4 py-3 text-right font-normal">الحالة</th>
                      <th className="px-4 py-3 text-right font-normal">المنتجات</th>
                      <th className="px-4 py-3 text-right font-normal">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {categoryRows.map(({ node, level }) => (
                      <tr key={node.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="px-4 py-3 text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-2" style={{ paddingRight: `${level * 16}px` }}>
                            {node.image ? (
                              <img
                                src={node.image}
                                alt={node.nameAr}
                                className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800" />
                            )}
                            <div className="min-w-0">
                              <div className="truncate">{node.nameAr}</div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{node.nameEn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{node.level}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-2xl text-[11px] font-normal ${
                            node.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {node.isActive ? 'مفعل' : 'معطل'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {node.productsCount ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCategory(node)}
                              className="px-3 py-1.5 text-xs rounded-2xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleAddCategory(node.id)}
                              className="px-3 py-1.5 text-xs rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                            >
                              فرعي
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(node.id)}
                              className="px-3 py-1.5 text-xs rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* البحث */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-4">
            <div className="relative">
              <Search
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* قائمة المنتجات */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                  {searchQuery ? 'لا توجد نتائج' : 'لا توجد منتجات بعد'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAddProduct}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl transition-colors"
                  >
                    إضافة أول منتج
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        الصورة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        الاسم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        التصنيف
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        الحالة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <img
                              src={product.defaultImage}
                              alt={product.nameAr}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              {product.nameAr}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {product.nameEn}
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              ID: {product.id}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                          <div>
                            <p>{getCategoryName(product.categoryId)}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              Category ID: {product.categoryId}
                              {getCategoryLevel(product.categoryId) !== null
                                ? ` • Level: ${getCategoryLevel(product.categoryId)}`
                                : ''}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              product.isActive
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {product.isActive ? 'مفعل' : 'معطل'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-2xl transition-colors"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-2xl transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* النماذج */}
      <CategoryForm
        isOpen={showCategoryForm}
        onClose={() => {
          setShowCategoryForm(false);
          setEditingCategory(null);
          setParentCategoryId(undefined);
        }}
        onSave={handleSaveCategory}
        documentId={editingCategory?.id}
        documentLevel={editingCategory?.level}
        initialData={
          editingCategory
            ? {
                nameAr: editingCategory.nameAr,
                nameEn: editingCategory.nameEn,
                slug: editingCategory.slug,
                parentId: editingCategory.parentId,
                categoryType: editingCategory.categoryType,
                image: editingCategory.image,
                icon: editingCategory.icon,
                descriptionAr: editingCategory.descriptionAr,
                descriptionEn: editingCategory.descriptionEn,
                order: editingCategory.order,
                isActive: editingCategory.isActive
              }
            : parentCategoryId
            ? { parentId: parentCategoryId }
            : undefined
        }
        title={editingCategory ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
      />

      <ProductTemplateForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        documentId={editingProduct?.id}
        initialData={
          editingProduct
            ? {
                categoryId: editingProduct.categoryId,
                nameAr: editingProduct.nameAr,
                nameEn: editingProduct.nameEn,
                slug: editingProduct.slug,
                defaultImage: editingProduct.defaultImage,
                images: editingProduct.images,
                descriptionAr: editingProduct.descriptionAr,
                descriptionEn: editingProduct.descriptionEn,
                order: editingProduct.order,
                isActive: editingProduct.isActive
              }
            : undefined
        }
        title={editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
      />
    </div>
  );
};
