import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Package } from 'lucide-react';
import { firebaseService } from '../../../services/firebase';
import { Button } from '../../../components/Button';

interface OrphanedProduct {
  id: string;
  name: string;
  tailorId: string;
  tailorName?: string;
  price: number;
  category: string;
  image?: string;
  createdAt?: string;
}

export const OrphanedProducts: React.FC = () => {
  const [products, setProducts] = useState<OrphanedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [deletingAll, setDeletingAll] = useState(false);

  const loadOrphanedProducts = async () => {
    setLoading(true);
    try {
      // Use dynamic import to ensure Firebase is ready
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../services/firebase');
      
      if (!db) {
        throw new Error('Firebase not initialized');
      }
      
      // Get all products from root collection
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      const orphanedList: OrphanedProduct[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        orphanedList.push({
          id: doc.id,
          name: data.name || 'بدون اسم',
          tailorId: data.tailorId || 'unknown',
          tailorName: data.tailorName || 'غير معروف',
          price: data.price || 0,
          category: data.category || 'غير محدد',
          image: data.image || data.imageUrls?.[0],
          createdAt: data.createdAt
        });
      });

      setProducts(orphanedList);
    } catch (error) {
      console.error('Error loading orphaned products:', error);
      alert('فشل تحميل المنتجات: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrphanedProducts();
  }, []);

  const deleteProduct = async (productId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    setDeleting(prev => ({ ...prev, [productId]: true }));
    try {
      await firebaseService.deleteOldProduct(productId);
      
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('تم حذف المنتج بنجاح');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('فشل حذف المنتج: ' + (error as Error).message);
    } finally {
      setDeleting(prev => ({ ...prev, [productId]: false }));
    }
  };

  const deleteAllProducts = async () => {
    if (!confirm(`هل أنت متأكد من حذف جميع المنتجات اليتيمة (${products.length} منتج)؟\n\nهذا الإجراء لا يمكن التراجع عنه!`)) {
      return;
    }

    if (!confirm('تأكيد نهائي: سيتم حذف جميع المنتجات من المجموعة القديمة. هل تريد المتابعة؟')) {
      return;
    }

    setDeletingAll(true);
    let deleted = 0;
    let failed = 0;

    try {
      for (const product of products) {
        try {
          await firebaseService.deleteOldProduct(product.id);
          deleted++;
        } catch (error) {
          console.error(`Failed to delete product ${product.id}:`, error);
          failed++;
        }
      }

      alert(`تم حذف ${deleted} منتج بنجاح${failed > 0 ? `\nفشل حذف ${failed} منتج` : ''}`);
      await loadOrphanedProducts();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      alert('حدث خطأ أثناء الحذف الجماعي');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">المنتجات اليتيمة</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            المنتجات في المجموعة القديمة (products/) التي لا تنتمي لمستخدم فعال
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadOrphanedProducts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            تحديث
          </Button>
          {products.length > 0 && (
            <Button
              onClick={deleteAllProducts}
              disabled={deletingAll}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Trash2 size={16} />
              حذف الكل ({products.length})
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Package className="mx-auto text-slate-400 mb-4" size={64} />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
            لا توجد منتجات يتيمة
          </h3>
          <p className="text-slate-500">
            جميع المنتجات منظمة بشكل صحيح في المجموعات الفرعية للمستخدمين
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
              <AlertTriangle size={20} />
              <span className="text-sm font-medium">
                تم العثور على {products.length} منتج في المجموعة القديمة
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">صورة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">اسم المنتج</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">التصنيف</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">السعر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Tailor ID</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Product ID</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                          <Package size={20} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {product.tailorName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {product.price.toFixed(3)} ر.ع
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {product.tailorId}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {product.id}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteProduct(product.id)}
                        disabled={deleting[product.id]}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deleting[product.id] ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
