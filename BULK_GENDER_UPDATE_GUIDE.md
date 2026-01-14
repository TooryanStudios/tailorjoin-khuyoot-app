# تعليمات تحديث التخصص (Gender) بالجملة للتصنيفات

## الحل السريع - استخدام Console في المتصفح

افتح المتصفح على صفحة:
```
http://localhost:3006/admin/products/categories
```

ثم افتح Console (اضغط F12) وقم بتشغيل هذا الكود:

### لتحديث جميع التصنيفات كـ "نسائي":
```javascript
(async function() {
  const { collection, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const { db } = await import('./services/firebase.js');
  
  const snapshot = await getDocs(collection(db, 'productCategories'));
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    await updateDoc(doc(db, 'productCategories', docSnap.id), {
      gender: 'female',
      updatedAt: new Date().toISOString()
    });
    count++;
    console.log(`✅ Updated ${count}/${snapshot.size}: ${docSnap.data().nameAr}`);
  }
  
  console.log(`🎉 تم! تحديث ${count} تصنيف إلى "نسائي"`);
})();
```

### لتحديث جميع التصنيفات كـ "رجالي":
```javascript
(async function() {
  const { collection, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const { db } = await import('./services/firebase.js');
  
  const snapshot = await getDocs(collection(db, 'productCategories'));
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    await updateDoc(doc(db, 'productCategories', docSnap.id), {
      gender: 'male',
      updatedAt: new Date().toISOString()
    });
    count++;
    console.log(`✅ Updated ${count}/${snapshot.size}: ${docSnap.data().nameAr}`);
  }
  
  console.log(`🎉 تم! تحديث ${count} تصنيف إلى "رجالي"`);
})();
```

### لتحديث تصنيفات محددة فقط:
```javascript
(async function() {
  // حدد أسماء التصنيفات المراد تحديثها
  const categoriesToUpdate = ['المشاليح', 'الدشاديش', 'الثياب'];
  const newGender = 'female'; // أو 'male' أو 'unisex' أو null
  
  const { collection, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const { db } = await import('./services/firebase.js');
  
  const snapshot = await getDocs(collection(db, 'productCategories'));
  let count = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (categoriesToUpdate.includes(data.nameAr)) {
      await updateDoc(doc(db, 'productCategories', docSnap.id), {
        gender: newGender,
        updatedAt: new Date().toISOString()
      });
      count++;
      console.log(`✅ Updated: ${data.nameAr} → ${newGender}`);
    }
  }
  
  console.log(`🎉 تم! تحديث ${count} تصنيف`);
})();
```

## ملاحظات:
- القيم الصحيحة للتخصص:  `'male'`, `'female'`, `'unisex'`, `null`
- بعد التشغيل، قم بتحديث الصفحة لرؤية التغييرات
- يمكنك تعديل الكود حسب احتياجاتك

## للرجوع إلى الواجهة:
بعد إضافة خاصية `selected` و `onToggleSelect` إلى CategoryTreeItem، ستتمكن من تحديد التصنيفات بالواجهة وتحديثها بالجملة.
