import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, User, Search, X, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { firebaseService } from '../../../services/firebase';
import { collection, getDocs, addDoc, query, where, getFirestore } from 'firebase/firestore';

interface UserOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'tailor' | 'admin' | 'shop_owner';
}

type NotificationType = 'order' | 'payment' | 'delivery' | 'info' | 'warning' | 'success';
type RecipientType = 'specific' | 'all_customers' | 'all_tailors' | 'all_shops' | 'all_users';

const WA_WINDOW_NAME = "khuyoot_whatsapp";

export const NotificationsSender = () => {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [recipientType, setRecipientType] = useState<RecipientType>('specific');
  const [notificationType, setNotificationType] = useState<NotificationType>('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<Array<{key: string, value: string}>>([]);
  const [openedWindows, setOpenedWindows] = useState<Array<{name: string, url: string, closed: boolean}>>([]);

  // Load users from Firestore
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      console.log('📥 جاري تحميل المستخدمين...');
      
      // استخدام firebaseService بدلاً من db مباشرة
      const users = await firebaseService.getUsers();
      
      const loadedUsers: UserOption[] = users.map(user => {
        const rawRole = (user.role || 'customer') as string;
        const normalizedRole: UserOption['role'] = rawRole === 'user'
          ? 'customer'
          : rawRole === 'shop'
          ? 'shop_owner'
          : (rawRole as UserOption['role']);
        return {
          id: user.id,
          name: user.name || user.email || 'مستخدم',
          email: user.email || '',
          phone: user.phone || '',
          role: normalizedRole
        };
      });
      
      console.log(`✅ تم تحميل ${loadedUsers.length} مستخدم`);
      setUsers(loadedUsers);
      setFilteredUsers(loadedUsers);
    } catch (error: any) {
      console.error('❌ خطأ في تحميل المستخدمين');
      setErrorMessage(`فشل تحميل المستخدمين: ${error.message}`);
    }
  };

  const handleUserSelect = (user: UserOption) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm('');
    setShowUserDropdown(false);
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const getRecipients = (): UserOption[] => {
    switch (recipientType) {
      case 'all_customers':
        return users.filter(u => u.role === 'customer');
      case 'all_tailors':
        return users.filter(u => u.role === 'tailor');
      case 'all_shops':
        return users.filter(u => u.role === 'shop_owner');
      case 'all_users':
        return users;
      case 'specific':
      default:
        return selectedUsers;
    }
  };

  const sendWhatsAppMessages = () => {
    const recipients = getRecipients();
    const recipientsWithPhone = recipients.filter(r => r.phone && r.phone.trim());
    
    if (recipientsWithPhone.length === 0) {
      setErrorMessage('لا يوجد مستخدمين لديهم أرقام هواتف مسجلة');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (!message.trim()) {
      setErrorMessage('يرجى إدخال نص الرسالة');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    // Debug: Collect window information
    const debugData: Array<{key: string, value: string}> = [
      { key: 'Window name', value: window.name || '(empty)' },
      { key: 'Window location', value: window.location.href },
      { key: 'Window frames length', value: String(window.length) },
      { key: 'Has opener', value: window.opener ? 'Yes' : 'No' },
      { key: 'Has parent', value: window.parent !== window ? 'Yes' : 'No' },
      { key: 'Has top', value: window.top !== window ? 'Yes' : 'No' },
      { key: 'Recipients with phone', value: String(recipientsWithPhone.length) },
    ];
    
    // Try to access window references (may be blocked by CORS)
    try {
      if (window.opener) {
        debugData.push({ key: 'Opener name', value: window.opener.name || '(empty)' });
      }
    } catch (e) {
      debugData.push({ key: 'Opener access', value: 'Blocked by CORS' });
    }
    
    setDebugInfo(debugData);
    console.log('🪟 === DEBUG: Window Info ===', debugData);

    // Track opened windows
    const windowsTracking: Array<{name: string, url: string, closed: boolean}> = [];

    // Open first recipient immediately, then update the same window for others
    recipientsWithPhone.forEach((recipient, index) => {
      // Clean phone number (remove spaces, dashes, etc)
      let cleanPhone = recipient.phone!.replace(/[\s\-\(\)]/g, '');
      
      // Add country code if not present (assuming Oman +968)
      if (!cleanPhone.startsWith('+') && !cleanPhone.startsWith('968')) {
        cleanPhone = '968' + cleanPhone;
      } else if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1);
      }
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message.trim())}`;
      
      windowsTracking.push({
        name: `${recipient.name} (${cleanPhone})`,
        url: whatsappUrl,
        closed: false
      });
      
      // Only open/update on first recipient (no delays, reuses same window)
      if (index === 0) {
        window.open(whatsappUrl, WA_WINDOW_NAME, 'width=800,height=600');
        setOpenedWindows(windowsTracking);
      }
    });

    setSuccessMessage(`تم فتح ${recipientsWithPhone.length} محادثة واتساب`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSendNotification = async () => {
    console.log('🔔 🔔 🔔 تم الضغط على زر الإرسال!');
    console.log('العنوان:', title);
    console.log('الرسالة:', message);
    console.log('نوع المستلمين:', recipientType);
    
    // Validation
    if (!title.trim() || !message.trim()) {
      setErrorMessage('يرجى إدخال العنوان والرسالة');
      console.log('❌ فشل: العنوان أو الرسالة فارغة');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const recipients = getRecipients();
    console.log(`📋 عدد المستلمين: ${recipients.length}`);
    console.log('المستلمون:', recipients);
    
    if (recipients.length === 0) {
      setErrorMessage('يرجى اختيار مستلم واحد على الأقل');
      console.log('❌ فشل: لا يوجد مستلمين');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('📤 جاري الإرسال إلى Firebase...');
      
      // استخدام firebaseService لإرسال الإشعارات
      const timestamp = new Date().toISOString();
      let successCount = 0;

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        console.log(`  → إرسال إشعار ${i + 1}/${recipients.length} إلى ${recipient.name} (${recipient.id})`);
        
        try {
          await firebaseService.createNotification({
            userId: recipient.id,
            type: notificationType,
            title: title.trim(),
            message: message.trim(),
            read: false,
            createdAt: timestamp,
            sentBy: 'admin'
          });
          successCount++;
        } catch (err) {
          console.error(`خطأ في إرسال إشعار لـ ${recipient.name}:`, err);
        }
      }

      console.log(`✅ تم إرسال ${successCount} إشعار بنجاح من أصل ${recipients.length}!`);

      setSuccessMessage(`✅ تم إرسال ${recipients.length} إشعار بنجاح إلى: ${recipients.map(r => r.name).join(', ')}`);
      
      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      setRecipientType('specific');
      
      // Hide success message after 8 seconds
      setTimeout(() => setSuccessMessage(''), 8000);
    } catch (error: any) {
      console.error('❌ خطأ في إرسال الإشعارات:', error);
      console.error('تفاصيل الخطأ:', error.message);
      console.error('كود الخطأ:', error.code);
      setErrorMessage(`حدث خطأ في إرسال الإشعارات: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
      console.log('✔️ انتهى الإرسال');
    }
  };

  const recipientCount = getRecipients().length;

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Bell className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إرسال الإشعارات</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              أرسل إشعارات داخل التطبيق للمستخدمين
            </p>
          </div>
        </div>

        {/* Debug Info Table */}
        {debugInfo.length > 0 && (
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">🪟 Window Debug Info</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-600">
                  <th className="text-right py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Key</th>
                  <th className="text-right py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">Value</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.map((item, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700 last:border-0">
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.key}</td>
                    <td className="py-2 px-3 text-slate-900 dark:text-white font-mono text-xs break-all">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setDebugInfo([])}
              className="mt-3 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Clear debug info
            </button>
          </div>
        )}

        {/* Opened Windows Tracking */}
        {openedWindows.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-600 rounded-xl">
            <h3 className="text-sm font-bold text-green-900 dark:text-green-100 mb-3">📱 Opened WhatsApp Windows</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-green-300 dark:border-green-600">
                  <th className="text-right py-2 px-3 font-semibold text-green-700 dark:text-green-300">Recipient</th>
                  <th className="text-right py-2 px-3 font-semibold text-green-700 dark:text-green-300">URL</th>
                  <th className="text-right py-2 px-3 font-semibold text-green-700 dark:text-green-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {openedWindows.map((win, index) => (
                  <tr key={index} className="border-b border-green-200 dark:border-green-700 last:border-0">
                    <td className="py-2 px-3 text-green-800 dark:text-green-200">{win.name}</td>
                    <td className="py-2 px-3 text-green-700 dark:text-green-300 font-mono text-xs break-all max-w-xs truncate">{win.url}</td>
                    <td className="py-2 px-3 text-green-900 dark:text-green-100">{win.closed ? '❌ Closed' : '✅ Open'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setOpenedWindows([])}
              className="mt-3 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              Clear tracking
            </button>
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-xl flex items-start gap-3 shadow-lg animate-pulse">
            <CheckCircle className="text-green-600 dark:text-green-400 shrink-0 animate-bounce" size={24} />
            <div className="flex-1">
              <p className="text-sm font-bold text-green-900 dark:text-green-100 mb-1">✅ نجح الإرسال!</p>
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl flex items-start gap-3 shadow-lg">
            <AlertCircle className="text-red-600 dark:text-red-400 shrink-0" size={24} />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">❌ فشل الإرسال</p>
              <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-xl flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">جاري الإرسال...</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">يرجى الانتظار، جاري إرسال الإشعارات لـ {recipientCount} مستخدم</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          
          {/* Recipient Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              نوع المستلمين
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { value: 'specific' as RecipientType, label: 'مستخدمين محددين', icon: User },
                { value: 'all_customers' as RecipientType, label: 'جميع العملاء', icon: Users },
                { value: 'all_tailors' as RecipientType, label: 'جميع الخياطين', icon: Users },
                { value: 'all_shops' as RecipientType, label: 'جميع المتاجر', icon: Users },
                { value: 'all_users' as RecipientType, label: 'الجميع', icon: Users },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setRecipientType(option.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center gap-2 ${
                    recipientType === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <option.icon size={16} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Users Selector */}
          {recipientType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                اختر المستخدمين
              </label>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <span className="text-sm text-blue-900 dark:text-blue-100">{user.name}</span>
                      <button
                        onClick={() => handleUserRemove(user.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="text-slate-400" size={18} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  placeholder="ابحث عن مستخدم..."
                  className="w-full pr-10 pl-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Dropdown */}
                {showUserDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.slice(0, 10).map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        disabled={selectedUsers.some(u => u.id === user.id)}
                        className="w-full px-4 py-3 text-right hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border-b border-slate-100 dark:border-slate-600 last:border-0"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recipient Count */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <Users className="inline-block ml-1" size={16} />
              سيتم إرسال الإشعار إلى <strong>{recipientCount}</strong> مستخدم
            </p>
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              نوع الإشعار
            </label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as NotificationType)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="info">معلومة (Info)</option>
              <option value="success">نجاح (Success)</option>
              <option value="warning">تحذير (Warning)</option>
              <option value="order">طلب (Order)</option>
              <option value="payment">دفع (Payment)</option>
              <option value="delivery">توصيل (Delivery)</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              عنوان الإشعار
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إشعار مهم"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              نص الرسالة
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Send Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setTitle('');
                setMessage('');
                setSelectedUsers([]);
                setRecipientType('specific');
                setErrorMessage('');
              }}
            >
              إعادة تعيين
            </Button>
            <Button
              variant="secondary"
              onClick={sendWhatsAppMessages}
              disabled={loading || !message.trim() || recipientCount === 0}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <MessageCircle size={18} />
              واتساب ({getRecipients().filter(r => r.phone).length})
            </Button>
            <Button
              onClick={(e) => {
                console.log('🖱️ تم الضغط على الزر!');
                console.log('معطّل؟', loading || !title.trim() || !message.trim() || recipientCount === 0);
                console.log('loading:', loading);
                console.log('title:', title);
                console.log('message:', message);
                console.log('recipientCount:', recipientCount);
                handleSendNotification();
              }}
              disabled={loading || !title.trim() || !message.trim() || recipientCount === 0}
            >
              <Send size={18} />
              {loading ? 'جاري الإرسال...' : `إرسال إشعار لـ ${recipientCount}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
