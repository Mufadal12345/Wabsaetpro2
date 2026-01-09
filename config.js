// config.js - ملف إعدادات Firebase
// الإعدادات المأخوذة من: https://console.firebase.google.com/u/0/project/newpro-d5360/settings/general/web:ZTUxZGRhYmYtYTY1Ny00MjJjLWE5Y2ItYmNiMGJiZmZiMDc2

// إعدادات Firebase - استخدم الإصدار 12.7.0 كما في كودك
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB8JN73w75NQB7MifQMdOl1VcwifklyVZU",
    authDomain: "newpro-d5360.firebaseapp.com",
    databaseURL: "https://newpro-d5360-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "newpro-d5360",
    storageBucket: "newpro-d5360.firebasestorage.app",
    messagingSenderId: "732050035324",
    appId: "1:732050035324:web:5a38e03134de3b287b2ff9",
    measurementId: "G-9TYX1QYJQG"
};

// بيانات المدير - يمكنك تغييرها حسب الحاجة
const ADMIN_CREDENTIALS = {
    name: "Rasha",
    specialty: "20250929"
};

// قوالب البيانات الأولية للإقسام
const INITIAL_SECTIONS = [
    {
        id: 'sec-1',
        order: 1,
        menuTitle: '🧭 لماذا هذا المشروع مهم؟',
        title: '🧭 لماذا هذا المشروع مهم؟',
        type: 'basic_highlight',
        fields: {
            p1: "في كل طالب، هناك عالم غير مكتشف: فكرة عميقة، لوحة لم تُعرض، أو كلمة لم تجد من يسمعها.",
            p2: "متحف الفكر ليس مشروعًا عاديًا…",
            p3_highlight: "إنه منصة تصنع التاريخ الشخصي والفكري لكل طالب.",
            p4: "هنا، نُحوّل الأفكار الصامتة إلى أثر خالد داخل الجامعة."
        }
    },
    {
        id: 'sec-2',
        order: 2,
        menuTitle: '🏛️ ما هو متحف الفكر؟',
        title: '🏛️ ما هو متحف الفكر؟',
        type: 'list_items',
        fields: {
            intro: "هو مساحة فكرية حرة داخل الجامعة — زاوية أو جدار أو قاعة — تجمع بين الفلسفة، الفن، والإبداع.",
            listTitle: "مكان يُعبّر فيه الطلاب عن ذواتهم من خلال:",
            listItems: "تأملاتهم وأفكارهم.\nلوحاتهم ورسوماتهم الرمزية.\nاقتباساتهم ومقالاتهم القصيرة.\nأسئلتهم الوجودية ورسائلهم للأجيال القادمة."
        }
    },
    {
        id: 'sec-3',
        order: 3,
        menuTitle: '💡 ما الذي يجعل هذا المشروع مختلفًا؟',
        title: '💡 ما الذي يجعل هذا المشروع مختلفًا؟',
        type: 'quote_block',
        fields: {
            p1: "لأنه يمسّ جوهر الإنسان.",
            p2: "نحن لا نعرض الدرجات أو الشهادات، بل نُظهر ما يجعلنا بشرًا: التفكير، الإحساس، الإبداع.",
            quote: "أنت لست مجرد رقم جامعي، أنت فكرة تستحق أن تُخلّد."
        }
    },
    {
        id: 'sec-4',
        order: 4,
        menuTitle: '🌿 ما الفائدة التي سيجنيها المشاركون؟',
        title: '🌿 ما الفائدة التي سيجنيها المشاركون؟',
        type: 'list_items',
        fields: {
            intro: "لكل طالب أو دكتور يشارك… هناك قيمة حقيقية تعود إليه:",
            listTitle: "الفوائد الرئيسية:",
            listItems: "الشهرة الفكرية: سيكون اسمك موقّعًا في 'دفتر الذاكرة الفكرية' الذي سيبقى للأجيال.\nالبوابة الأولى لأعمالك: مقالك، رسوماتك، أو أفكارك ستكون البداية لمسيرتك الإبداعية.\nمجتمع فكري حقيقي: تلتقي بعقول تشبهك، تناقش، وتترك أثرك في ذاكرة المكان.\nتجربة إنسانية فريدة: ستعود بعد سنوات لتجد آثارك الفكرية باقية… تشهد على من كنت يومًا."
        }
    },
    {
        id: 'sec-5',
        order: 5,
        menuTitle: '🚀 لماذا يجب أن تدعم هذا المشروع؟',
        title: '🚀 لماذا يجب أن تدعم هذا المشروع؟',
        type: 'quote_block',
        fields: {
            p1: "لأنك حين تدعم متحف الفكر، فأنت لا تدعم ركنًا جامعيًا… بل تدعم فكرة أن الإنسان يصنع أثره بالفكر لا بالمال.",
            p2: "كل لوحة، كل اقتباس، كل مشاركة — هي استثمار في روح الجامعة.",
            quote: "من يدعم الفكرة اليوم، سيُذكر غدًا بأنه ساهم في بناء ذاكرة الجامعة الفكرية الأولى."
        }
    },
    {
        id: 'sec-6',
        order: 6,
        menuTitle: '🎭 المستقبل والتوسّع',
        title: '🎭 المستقبل والتوسّع',
        type: 'list_items',
        fields: {
            intro: "متحف الفكر ليس لحظة مؤقتة، بل بذرة مشروع ثقافي دائم.",
            listTitle: "مع الوقت، ستقام من خلاله:",
            listItems: "معارض فكرية وفنية دورية.\nمسابقات تحفيزية لأفضل المشاركات.\nندوات حول الفلسفة والإبداع والوعي الذاتي."
        }
    },
    {
        id: 'sec-7',
        order: 7,
        menuTitle: '✨ الدعوة الأخيرة',
        title: '✨ الدعوة الأخيرة',
        type: 'final_call',
        fields: {
            call_title: "شارك بفكرة، كلمة، لوحة، أو حتى سؤال وجودي.",
            call_subtitle: "اترك أثرًا يُشبهك، لأن ما تزرعه اليوم سيكون ذاكرة الجامعة غدًا.",
            final_signature: "متحف الفكر — لأن الفكر هو ما يجعلنا خالدين."
        }
    }
];

// تعريفات القوالب
const TEMPLATES = {
    'basic_highlight': {
        editorFields: [
            { key: 'p1', label: 'الفقرة الافتتاحية', type: 'textarea' },
            { key: 'p2', label: 'الفقرة الثانية', type: 'textarea' },
            { key: 'p3_highlight', label: 'الجملة البارزة والملخصة', type: 'textarea' },
            { key: 'p4', label: 'فقرة الختام', type: 'textarea' }
        ],
        render: (fields) => `
            <p class="text-xl">${fields.p1}</p>
            <p class="mt-4">${fields.p2}</p>
            <p class="mt-4 text-2xl font-extrabold text-blue-900 leading-snug border-b-2 border-amber-500 pb-2">${fields.p3_highlight}</p>
            <p class="mt-4 text-lg text-amber-600">${fields.p4}</p>
        `
    },
    'list_items': {
        editorFields: [
            { key: 'intro', label: 'نص المقدمة', type: 'textarea' },
            { key: 'listTitle', label: 'عنوان القائمة الفرعي', type: 'input' },
            { key: 'listItems', label: 'عناصر القائمة', type: 'textarea' }
        ],
        render: (fields) => {
            const items = (fields.listItems || '').split('\n').filter(item => item.trim() !== '');
            const iconList = ['✍️', '🎨', '💬', '📚', '⭐', '💎', '💡', '🏆'];
            let listHtml = items.map((item, index) => {
                const icon = iconList[index % iconList.length];
                return `<li class="flex items-start text-lg"><span class="ml-2 text-2xl text-blue-700">${icon}</span> <span class="font-medium">${item.trim()}</span></li>`;
            }).join('');

            return `
                <p class="text-xl">${fields.intro}</p>
                <p class="mt-4 font-bold text-lg">${fields.listTitle}</p>
                <ul class="space-y-3 list-none pr-0">${listHtml}</ul>
            `;
        }
    },
    'quote_block': {
        editorFields: [
            { key: 'p1', label: 'الفقرة الأولى', type: 'textarea' },
            { key: 'p2', label: 'الفقرة الثانية', type: 'textarea' },
            { key: 'quote', label: 'الاقتباس الرئيسي', type: 'textarea' }
        ],
        render: (fields) => `
            <p class="text-xl">${fields.p1}</p>
            <p class="mt-4 text-lg">${fields.p2}</p>
            <blockquote class="highlight-quote">${fields.quote}</blockquote>
        `
    },
    'final_call': {
        editorFields: [
            { key: 'call_title', label: 'جملة الدعوة الرئيسية', type: 'textarea' },
            { key: 'call_subtitle', label: 'جملة التشجيع', type: 'textarea' },
            { key: 'final_signature', label: 'عبارة الختام الرئيسية', type: 'input' }
        ],
        render: (fields) => `
            <div class="p-6 bg-blue-100 rounded-xl shadow-lg text-center">
                <p class="text-3xl font-extrabold mb-4 leading-tight text-blue-900">${fields.call_title}</p>
                <p class="text-xl font-light italic text-gray-700">${fields.call_subtitle}</p>
            </div>
            <p class="mt-8 text-2xl font-extrabold text-blue-900 text-center">🎓 ${fields.final_signature}</p>
        `
    }
};

// تصنيفات الاقتراحات
const SUGGESTION_CATEGORIES = {
    'design': { text: '🎨 تصميم وواجهة', color: 'bg-purple-100 text-purple-800' },
    'content': { text: '📚 محتوى وأفكار', color: 'bg-blue-100 text-blue-800' },
    'features': { text: '⚙️ ميزات جديدة', color: 'bg-green-100 text-green-800' },
    'experience': { text: '👤 تجربة المستخدم', color: 'bg-amber-100 text-amber-800' },
    'other': { text: '📝 أخرى', color: 'bg-gray-100 text-gray-800' }
};

// حالات الاقتراحات
const SUGGESTION_STATUSES = {
    'pending': { text: '📍 قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
    'reviewed': { text: '👁️ تمت المراجعة', color: 'bg-blue-100 text-blue-800' },
    'implemented': { text: '✅ تم التنفيذ', color: 'bg-green-100 text-green-800' },
    'rejected': { text: '❌ مرفوض', color: 'bg-red-100 text-red-800' }
};

// إصدار SDK - استخدم الإصدار 12.7.0 كما في كودك
const FIREBASE_SDK_VERSION = "12.7.0";

// معلومات الإصدار
const APP_INFO = {
    name: "متحف الفكر",
    version: "2.0.0",
    lastUpdated: "2024",
    developer: "Rasha"
};

// مفتاح التخزين المحلي للنسخة الاحتياطية
const LOCAL_STORAGE_KEY = 'muf_backup_data';

// تصدير المتغيرات للاستخدام في الملفات الأخرى
if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = FIREBASE_CONFIG;
    window.ADMIN_CREDENTIALS = ADMIN_CREDENTIALS;
    window.INITIAL_SECTIONS = INITIAL_SECTIONS;
    window.TEMPLATES = TEMPLATES;
    window.SUGGESTION_CATEGORIES = SUGGESTION_CATEGORIES;
    window.SUGGESTION_STATUSES = SUGGESTION_STATUSES;
    window.FIREBASE_SDK_VERSION = FIREBASE_SDK_VERSION;
    window.APP_INFO = APP_INFO;
    window.LOCAL_STORAGE_KEY = LOCAL_STORAGE_KEY;
}

// تصدير للاستخدام في الوحدات النمطية (ES6 Modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FIREBASE_CONFIG,
        ADMIN_CREDENTIALS,
        INITIAL_SECTIONS,
        TEMPLATES,
        SUGGESTION_CATEGORIES,
        SUGGESTION_STATUSES,
        FIREBASE_SDK_VERSION,
        APP_INFO,
        LOCAL_STORAGE_KEY
    };
}

// دالة مساعدة للتحقق من إعدادات Firebase
function validateFirebaseConfig() {
    const requiredKeys = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingKeys = requiredKeys.filter(key => !FIREBASE_CONFIG[key]);
    
    if (missingKeys.length > 0) {
        console.error('❌ إعدادات Firebase ناقصة:', missingKeys);
        return false;
    }
    
    console.log('✅ إعدادات Firebase صحيحة');
    return true;
}

// التحقق التلقائي عند التحميل
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        console.log('متحف الفكر - الإصدار:', APP_INFO.version);
        console.log('Firebase SDK الإصدار:', FIREBASE_SDK_VERSION);
        validateFirebaseConfig();
    });
}