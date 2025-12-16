import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Video, Trash2, Eye, Heart, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  addPortfolioItem, 
  getPortfolioItems, 
  deletePortfolioItem 
} from '../services/interactionService';
import { uploadPortfolioImage } from '../services/storageService';
import { PortfolioItem } from '../types';
import { ImageUpload } from '../components/ImageUpload';

export default function PortfolioManagement() {
  const { user } = useApp();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form state
  const [newItem, setNewItem] = useState({
    type: 'image' as 'image' | 'video',
    title: '',
    description: '',
    tags: '',
    mediaFile: null as File | null,
    videoUrl: ''
  });

  useEffect(() => {
    loadPortfolio();
  }, [user]);

  const loadPortfolio = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const items = await getPortfolioItems(user.id);
      setPortfolioItems(items);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user) return;
    
    try {
      setUploadProgress(10);
      
      let mediaUrl = '';
      let thumbnailUrl = '';

      if (newItem.type === 'image') {
        if (!newItem.mediaFile) {
          alert('الرجاء اختيار صورة');
          return;
        }
        
        setUploadProgress(30);
        const imageId = `portfolio_${Date.now()}`;
        const uploadedUrl = await uploadPortfolioImage(newItem.mediaFile, user.id, imageId);
        mediaUrl = uploadedUrl;
        setUploadProgress(70);
      } else {
        if (!newItem.videoUrl) {
          alert('الرجاء إدخال رابط الفيديو');
          return;
        }
        mediaUrl = newItem.videoUrl;
        setUploadProgress(50);
      }

      const tagsArray = newItem.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const portfolioItem = await addPortfolioItem({
        ownerId: user.id,
        ownerName: user.name,
        type: newItem.type,
        mediaUrl,
        thumbnailUrl,
        title: newItem.title,
        description: newItem.description,
        tags: tagsArray
      });

      setUploadProgress(100);
      setPortfolioItems([portfolioItem, ...portfolioItems]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      alert('فشل إضافة العنصر');
    } finally {
      setUploadProgress(0);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
      await deletePortfolioItem(itemId);
      setPortfolioItems(portfolioItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('فشل حذف العنصر');
    }
  };

  const resetForm = () => {
    setNewItem({
      type: 'image',
      title: '',
      description: '',
      tags: '',
      mediaFile: null,
      videoUrl: ''
    });
  };

  if (!user || (user.role !== 'tailor' && user.role !== 'boutique' && user.role !== 'shop')) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-600">هذه الصفحة متاحة للخياطين والبوتيكات والمحلات فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">معرض الأعمال</h1>
            <p className="text-gray-600 mt-1">أضف صور وفيديوهات لأعمالك السابقة</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            إضافة عمل جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">إجمالي الأعمال</p>
                <p className="text-3xl font-bold text-gray-800">{portfolioItems.length}</p>
              </div>
              <ImageIcon className="w-12 h-12 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">إجمالي المشاهدات</p>
                <p className="text-3xl font-bold text-gray-800">
                  {portfolioItems.reduce((sum, item) => sum + (item.views || 0), 0)}
                </p>
              </div>
              <Eye className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">إجمالي الإعجابات</p>
                <p className="text-3xl font-bold text-gray-800">
                  {portfolioItems.reduce((sum, item) => sum + (item.likes || 0), 0)}
                </p>
              </div>
              <Heart className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد أعمال بعد</h3>
            <p className="text-gray-600 mb-6">ابدأ بإضافة أعمالك لعرضها للعملاء</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              إضافة أول عمل
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden group">
                {/* Media */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="absolute top-2 left-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {/* Stats Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {item.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {item.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">إضافة عمل جديد</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع العمل</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewItem({ ...newItem, type: 'image' })}
                    className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition ${
                      newItem.type === 'image'
                        ? 'border-purple-600 bg-purple-50 text-purple-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ImageIcon className="w-6 h-6" />
                    صورة
                  </button>
                  <button
                    onClick={() => setNewItem({ ...newItem, type: 'video' })}
                    className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition ${
                      newItem.type === 'video'
                        ? 'border-purple-600 bg-purple-50 text-purple-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className="w-6 h-6" />
                    فيديو
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان *</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="مثال: فستان عماني تقليدي"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="وصف مختصر عن العمل..."
                />
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">الوسوم</label>
                <input
                  type="text"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="افصل بينها بفاصلة: ملابس تقليدية، عماني، فستان"
                />
              </div>

              {/* Media Upload */}
              {newItem.type === 'image' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الصورة *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewItem({ ...newItem, mediaFile: file });
                      }
                    }}
                    className="w-full"
                  />
                  {newItem.mediaFile && (
                    <p className="text-sm text-green-600 mt-2">
                      تم اختيار: {newItem.mediaFile.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رابط الفيديو (YouTube أو Vimeo) *
                  </label>
                  <input
                    type="url"
                    value={newItem.videoUrl}
                    onChange={(e) => setNewItem({ ...newItem, videoUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress}%</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddItem}
                  disabled={uploadProgress > 0}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploadProgress > 0 ? 'جاري الرفع...' : 'إضافة'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
