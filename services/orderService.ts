import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, OrderStatus } from '../types';

// ==========================================
// توليد رقم طلب ذكي
// ==========================================
function generateOrderNumber(tailorName: string, tailorId: string): string {
  // استخراج أول 3 أحرف من اسم الخياط
  const tailorCode = tailorName
    .replace(/\s+/g, '')
    .substring(0, 3)
    .toUpperCase();
  
  // الشهر والسنة الحالية
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // رقم عشوائي من 4 أرقام
  const sequence = Math.floor(1000 + Math.random() * 9000);
  
  return `${tailorCode}-${year}${month}-${sequence}`;
}

// ==========================================
// إضافة طلب تفصيل جديد
// ==========================================
export async function createOrder(orderData: Omit<Order, 'id' | 'orderDate' | 'orderNumber'>): Promise<Order> {
  try {
    // توليد رقم طلب ذكي
    const orderNumber = generateOrderNumber(
      orderData.tailorName || 'خياط',
      orderData.tailorId
    );

    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      orderNumber,
      orderDate: new Date().toISOString(),
      status: 'pending' as OrderStatus,
      acceptedByTailor: false,
      canEdit: true,
      createdAt: Timestamp.now()
    });

    return {
      id: docRef.id,
      ...orderData,
      orderNumber,
      orderDate: new Date().toISOString(),
      status: 'pending',
      acceptedByTailor: false,
      canEdit: true
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('فشل إنشاء الطلب');
  }
}

// ==========================================
// جلب طلبات المستخدم
// ==========================================
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('orderDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
}

// ==========================================
// جلب طلبات الخياط
// ==========================================
export async function getTailorOrders(tailorId: string, status?: OrderStatus): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    let q;
    
    if (status) {
      q = query(
        ordersRef,
        where('tailorId', '==', tailorId),
        where('status', '==', status),
        orderBy('orderDate', 'desc')
      );
    } else {
      q = query(
        ordersRef,
        where('tailorId', '==', tailorId),
        orderBy('orderDate', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Partial<Order>;
      return {
        id: doc.id,
        ...data
      } as Order;
    });
  } catch (error) {
    console.error('Error getting tailor orders:', error);
    return [];
  }
}

// ==========================================
// تحديث حالة الطلب
// ==========================================
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus,
  additionalData?: Partial<Order>
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData
    };

    // إذا تم قبول الطلب، نمنع التعديل
    if (status !== 'pending' && status !== 'cancelled') {
      updateData.canEdit = false;
    }

    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('فشل تحديث حالة الطلب');
  }
}

// ==========================================
// قبول الطلب من الخياط
// ==========================================
export async function acceptOrder(orderId: string, notes?: string): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      acceptedByTailor: true,
      acceptedAt: new Date().toISOString(),
      status: 'measuring' as OrderStatus,
      canEdit: false,
      tailorNotes: notes || '',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    throw new Error('فشل قبول الطلب');
  }
}

// ==========================================
// رفض الطلب من الخياط
// ==========================================
export async function rejectOrder(orderId: string, reason: string): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      acceptedByTailor: false,
      status: 'cancelled' as OrderStatus,
      rejectionReason: reason,
      canEdit: false,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    throw new Error('فشل رفض الطلب');
  }
}

// ==========================================
// إرسال ملاحظات للزبون
// ==========================================
export async function sendNoteToCustomer(
  orderId: string, 
  note: string,
  requestChanges: boolean = false
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('الطلب غير موجود');
    }

    const currentNotes = orderDoc.data().tailorNotes || '';
    const updatedNotes = currentNotes 
      ? `${currentNotes}\n\n[${new Date().toLocaleString('ar-SA')}]\n${note}`
      : note;

    await updateDoc(orderRef, {
      tailorNotes: updatedNotes,
      needsCustomerAction: requestChanges,
      canEdit: requestChanges, // السماح بالتعديل إذا طلبت تغييرات
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error sending note to customer:', error);
    throw new Error('فشل إرسال الملاحظة');
  }
}

// ==========================================
// تحديث الطلب من قبل العميل
// ==========================================
export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('الطلب غير موجود');
    }

    const orderData = orderDoc.data() as Order;
    
    // التحقق من إمكانية التعديل
    if (!orderData.canEdit) {
      throw new Error('لا يمكن تعديل هذا الطلب');
    }

    await updateDoc(orderRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// ==========================================
// حذف الطلب
// ==========================================
export async function deleteOrder(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('الطلب غير موجود');
    }

    const orderData = orderDoc.data() as Order;
    
    // يمكن حذف الطلب فقط إذا كان في حالة pending أو لم يتم قبوله
    if (orderData.status !== 'pending' && orderData.acceptedByTailor) {
      throw new Error('لا يمكن حذف طلب تم قبوله من الخياط');
    }

    await deleteDoc(orderRef);
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

// ==========================================
// جلب تفاصيل طلب واحد
// ==========================================
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return null;
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data()
    } as Order;
  } catch (error) {
    console.error('Error getting order:', error);
    return null;
  }
}

// ==========================================
// تحديث مرحلة التفصيل
// ==========================================
export async function updateOrderProgress(
  orderId: string,
  status: OrderStatus,
  notes?: string
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };

    if (notes) {
      updateData.progressNotes = notes;
    }

    // إذا وصل الطلب لمرحلة "جاهز"
    if (status === 'ready') {
      updateData.readyNotificationSent = true;
      updateData.readyNotificationDate = new Date().toISOString();
    }

    // إذا تم تسليم الطلب
    if (status === 'delivered') {
      updateData.completionDate = new Date().toISOString();
    }

    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error updating order progress:', error);
    throw new Error('فشل تحديث مرحلة الطلب');
  }
}

// ==========================================
// إحصائيات طلبات الخياط
// ==========================================
export async function getTailorOrdersStats(tailorId: string) {
  try {
    const orders = await getTailorOrders(tailorId);
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      measuring: orders.filter(o => o.status === 'measuring').length,
      cutting: orders.filter(o => o.status === 'cutting').length,
      sewing: orders.filter(o => o.status === 'sewing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.price, 0)
    };
  } catch (error) {
    console.error('Error getting tailor stats:', error);
    return null;
  }
}

// ==========================================
// جلب الطلبات النشطة لمنتج معين
// ==========================================
export async function getActiveOrdersForProduct(productId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('productId', '==', productId),
      where('status', 'in', ['pending', 'measuring', 'cutting', 'sewing', 'finishing', 'ready'])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error getting active orders for product:', error);
    return [];
  }
}
