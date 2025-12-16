import { Order, User, NotificationChannel } from '../types';

export interface NotificationService {
  sendWhatsApp: (phoneNumber: string, message: string) => Promise<boolean>;
  sendEmail: (email: string, subject: string, message: string) => Promise<boolean>;
  sendSMS: (phoneNumber: string, message: string) => Promise<boolean>;
}

class NotificationManager implements NotificationService {
  
  /**
   * إرسال رسالة واتساب
   */
  async sendWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log('📱 إرسال واتساب إلى:', phoneNumber);
      console.log('الرسالة:', message);
      
      // في الإنتاج، يمكن استخدام WhatsApp Business API
      // مثال: Twilio WhatsApp API
      /*
      const response = await fetch('https://api.twilio.com/...', {
        method: 'POST',
        headers: { ... },
        body: JSON.stringify({
          to: `whatsapp:${phoneNumber}`,
          body: message
        })
      });
      return response.ok;
      */
      
      // في الوقت الحالي نستخدم simulation
      return true;
    } catch (error) {
      console.error('خطأ في إرسال واتساب:', error);
      return false;
    }
  }

  /**
   * إرسال بريد إلكتروني
   */
  async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    try {
      console.log('📧 إرسال بريد إلى:', email);
      console.log('الموضوع:', subject);
      console.log('الرسالة:', message);
      
      // في الإنتاج، يمكن استخدام خدمة بريد إلكتروني
      // مثال: SendGrid, AWS SES, Mailgun
      /*
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }],
            subject
          }],
          from: { email: 'noreply@khuyoot.com' },
          content: [{
            type: 'text/html',
            value: message
          }]
        })
      });
      return response.ok;
      */
      
      return true;
    } catch (error) {
      console.error('خطأ في إرسال البريد:', error);
      return false;
    }
  }

  /**
   * إرسال رسالة SMS
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log('📱 إرسال SMS إلى:', phoneNumber);
      console.log('الرسالة:', message);
      
      // في الإنتاج، يمكن استخدام خدمة SMS
      // مثال: Twilio SMS, AWS SNS
      
      return true;
    } catch (error) {
      console.error('خطأ في إرسال SMS:', error);
      return false;
    }
  }

  /**
   * إرسال إشعار جاهزية الطلب
   */
  async sendOrderReadyNotification(order: Order, user: User): Promise<NotificationChannel[]> {
    const sentChannels: NotificationChannel[] = [];
    
    const message = `
🎉 طلبك جاهز!

عزيزي ${user.name}،

نحن سعداء بإعلامك أن طلبك جاهز للاستلام:

📦 المنتج: ${order.productName}
🔢 رقم الطلب: #${order.id}
🏪 الخياط: ${order.tailorName}

يرجى اختيار طريقة الاستلام:
• الاستلام من المحل
• التوصيل للمنزل

للمزيد من التفاصيل، يرجى فتح التطبيق.

شكراً لاختياركم خيوط 🧵
    `.trim();

    // إرسال واتساب إذا كان الرقم متوفراً
    if (user.phone) {
      const whatsappSent = await this.sendWhatsApp(user.phone, message);
      if (whatsappSent) {
        sentChannels.push('whatsapp');
      }
    }

    // إرسال بريد إلكتروني
    if (user.email) {
      const emailMessage = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 طلبك جاهز!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <p style="font-size: 18px; color: #1f2937; margin-bottom: 10px;">عزيزي ${user.name}،</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
              نحن سعداء بإعلامك أن طلبك جاهز للاستلام!
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-bottom: 15px;">تفاصيل الطلب:</h3>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">المنتج:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${order.productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">رقم الطلب:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">#${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">الخياط:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">${order.tailorName}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin-bottom: 10px;">اختر طريقة الاستلام:</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 8px 0; color: #047857;">✓ الاستلام من المحل</li>
                <li style="padding: 8px 0; color: #047857;">✓ التوصيل للمنزل</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="#/order/${order.id}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                افتح التطبيق
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>شكراً لاختياركم خيوط 🧵</p>
            <p style="font-size: 12px; margin-top: 10px;">
              هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه
            </p>
          </div>
        </div>
      `;
      
      const emailSent = await this.sendEmail(
        user.email,
        `🎉 طلبك جاهز - ${order.productName}`,
        emailMessage
      );
      
      if (emailSent) {
        sentChannels.push('email');
      }
    }

    return sentChannels;
  }

  /**
   * إرسال إشعار تغيير حالة الطلب
   */
  async sendOrderStatusUpdate(order: Order, user: User, newStatus: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      'measuring': 'جاري أخذ المقاسات',
      'cutting': 'جاري قص القماش',
      'sewing': 'بدأ الخياط في التفصيل',
      'ready': 'الطلب جاهز للاستلام',
      'delivered': 'تم تسليم الطلب'
    };

    const message = `
تحديث حالة الطلب #${order.id}

${statusMessages[newStatus] || newStatus}

${order.productName}
${order.tailorName}

للمزيد من التفاصيل، افتح التطبيق.
    `.trim();

    if (user.phone) {
      await this.sendWhatsApp(user.phone, message);
    }
  }

  /**
   * إرسال تذكير بالدفع
   */
  async sendPaymentReminder(order: Order, user: User): Promise<void> {
    const message = `
تذكير بالدفع 💳

عزيزي ${user.name}،

قبل الخياط طلبك! يرجى إتمام الدفع لبدء التفصيل.

المبلغ: ${order.price} ر.ع
الطلب: ${order.productName}

افتح التطبيق للدفع الآن.
    `.trim();

    if (user.phone) {
      await this.sendWhatsApp(user.phone, message);
    }

    if (user.email) {
      await this.sendEmail(
        user.email,
        'تذكير بالدفع - طلبك في انتظار الدفع',
        message
      );
    }
  }
}

export const notificationService = new NotificationManager();
