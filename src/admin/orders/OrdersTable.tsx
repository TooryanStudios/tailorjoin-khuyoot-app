
import React from 'react';
import { Button } from '../../../components/Button';
import { Order } from '../../../types';

interface OrdersTableProps {
  orders: Order[];
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">جدول الطلبات</h2>
         <Button size="sm">تصدير CSV</Button>
       </div>
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
         <table className="w-full text-right text-sm">
           <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
             <tr>
               <th className="p-4">رقم الطلب</th>
               <th className="p-4">المنتج</th>
               <th className="p-4">الخياط</th>
               <th className="p-4">السعر</th>
               <th className="p-4">الحالة</th>
               <th className="p-4">التاريخ</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
             {orders.map(order => (
               <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                 <td className="p-4 font-mono text-slate-500">#{order.id}</td>
                 <td className="p-4 font-bold text-slate-800 dark:text-white">{order.productName}</td>
                 <td className="p-4 text-slate-500">{order.tailorName}</td>
                 <td className="p-4 text-blue-500 font-bold">{order.price.toFixed(3)} ر.ع</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                     order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                     'bg-blue-100 text-blue-600'
                   }`}>
                     {order.status}
                   </span>
                 </td>
                 <td className="p-4 text-slate-500">{order.orderDate}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  );
};
