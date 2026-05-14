# الدليل الإرشادي: إعداد النسخ الاحتياطي التلقائي لـ Firebase

لضمان عدم ضياع بيانات تطبيق "متحف الفكر" أو أي جهد للمستخدمين والأعضاء، يُنصح بتفعيل نظام النسخ الاحتياطي التلقائي باستخدام إضافة **Firebase Cloud Functions**. تتيح لك هذه الوظيفة جدولة وأخذ نسخة احتياطية من كافة المجموعات (Collections) في سحابة Google Cloud Storage كل 24 ساعة.

## المتطلبات الأساسية
- حساب Firebase مبني على خطة السداد (Blaze Plan) لتمكين وظائف Cloud Functions.
- تثبيت أدوات Firebase البرمجية (Firebase CLI) على جهازك للإعداد.

---

## خطوات إنشاء النسخ الاحتياطي

### 1- تنصيب أدوات التطوير (Firebase CLI) وتهيئة الوظائف
افتح الطرفية (Terminal) في بيئة التطوير الخاصة بك واكتب الأوامر التالية:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

عند المطالبة بالإعدادات:
- اختر المشروع الخاص بك "Museum of Thought".
- اختر اللغة **TypeScript**.
- اختر **نعم** لتثبيت الامتدادات والحزم المطلوبة (ESLint, npm dependencies).

### 2- كتابة دالة النسخ الاحتياطي السحابي
تأكد من فتح المجلد `functions/src/index.ts` واستبدل المحتوى بالشيفرة التالية:

```typescript
import * as functions from "firebase-functions";
import * as firestore from "@google-cloud/firestore";

const client = new firestore.v1.FirestoreAdminClient();

// يمكنك تغيير "every 24 hours" لتصبح بناءً على توقيت محدد 
// مثال: "every day 00:00" لتتم في منتصف الليل
export const scheduledFirestoreExport = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    
    // استدعاء متغيرات النظام لمعرفة اسم المشروع
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    if (!projectId) {
      throw new Error("لم يتم التعرف على اسم المشروع");
    }

    const databaseName = client.databasePath(projectId, '(default)');
    // تحديد الدلو (Bucket) الذي ستحفظ فيه النسخ الاحتياطية
    const bucket = `gs://${projectId}-firestore-backups`;

    try {
      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        // اترك المصفوفة فارغة لتصدير كافة الجداول/المجموعات بشكل كامل
        // collectionIds: ['users', 'ideas', 'comments', 'audit_logs']
        collectionIds: []
      });

      console.log(`بدأت عملية النسخ الاحتياطي بنجاح. معرف العملية: ${responses[0]['name']}`);
    } catch (err) {
      console.error("حدث خطأ أثناء أخذ النسخ الاحتياطي للبيانات:", err);
      throw new Error('فشلت محاولة النسخ الاحتياطي');
    }
  });
```

### 3- إنشاء الدلو (Storage Bucket) لتخزين النسخ
الدالة بالأعلى ستحاول حفظ النسخ في مسار `gs://<project-id>-firestore-backups`. لذلك:
1. انتقل إلى لوحة تحكم Google Cloud Console.
2. اختر **Cloud Storage** ثم انقر على **Create Bucket**.
3. قم بتسمية الدلو ليكون `<تأكد-من-كتابة-ال-ID-الخاص-بالمشروع>-firestore-backups`.
4. اترك باقي الخيارات كما هي واضغط على حفظ.

### 4- نشر الوظيفة (Deployment)
بمجرد كتابة الكود بشكل صحيح، قم بنشر الوظيفة على Firebase باستخدام الأمر التالي:

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 🛡️ نصائح هامة ومراجعة أمان
- **الصلاحيات (Permissions):** الدالة تستخدم الحساب الخدمي الافتراضي لـ App Engine. تأكد من أن هذا الحساب يمتلك صلاحية `Cloud Datastore Import Export Admin` وصلاحية `Storage Admin`. يمكنك تعديل ذلك من صفحة **IAM & Admin** في لوحة التحكم Google Cloud.
- **التكلفة:** الوظائف المجدولة تحتاج لتفعيل (Google Cloud Scheduler) و(Pub/Sub)، وتكلفتها ضئيلة أو تقع ضمن الباقة المجانية، ولكنها تتطلب تفعيل الفوترة (Billing).
- **الاسترجاع (Restoration):** في حالة الحاجة لاسترجاع البيانات، يمكنك استخدام أداة `gcloud` لقولبة البيانات واسترجاعها إلى Firestore.

الآن، قاعدة البيانات الخاصة بمشروع "متحف الفكر" بأمان تام ولها نسخ احتياطي مبرمج ليعمل تلقائياً.
