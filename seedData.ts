import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

const TEST_POSTS = [
  {
    title: "مستقبل الذكاء الاصطناعي في التعليم",
    content: "كيف سيغير الذكاء الاصطناعي طريقة تعلمنا في الجامعات؟ هل سنرى معلمين آليين قريباً؟ https://www.youtube.com/watch?v=ad79nYk2keg #تعليم #ذكاء_اصطناعي",
    category: "تكنولوجيا",
    author: "أحمد محمد",
    authorRole: "user"
  },
  {
    title: "تأملات في الفلسفة الوجودية",
    content: "ما معنى الوجود في عصر التكنولوجيا المتسارع؟ هل فقدنا جوهرنا الإنساني؟ #فلسفة #تأمل",
    category: "فلسفة",
    author: "سارة خالد",
    authorRole: "user"
  },
  {
    title: "أهمية البرمجة في العصر الحديث",
    content: "البرمجة ليست مجرد كود، بل هي لغة العصر وأداة لحل المشكلات المعقدة. تعلم البرمجة يفتح آفاقاً لا حدود لها. #برمجة #تكنولوجيا",
    category: "تعليم",
    author: "ياسين علي",
    authorRole: "admin"
  },
  {
    title: "الفن والتعبير عن الذات",
    content: "كيف يمكن للفن أن يكون وسيلة للتحرر النفسي والتعبير عما يعجز اللسان عن قوله؟ #فن #إبداع",
    category: "فن",
    author: "ليلى محمود",
    authorRole: "user"
  },
  {
    title: "نصائح لتطوير مهارات التواصل",
    content: "التواصل الفعال هو مفتاح النجاح في الحياة المهنية والشخصية. إليكم بعض النصائح العملية. #تطوير_ذات #مهارات",
    category: "تعليم",
    author: "محمد إبراهيم",
    authorRole: "user"
  },
  {
    title: "تاريخ العلوم عند العرب",
    content: "إسهامات العلماء العرب والمسلمين في بناء الحضارة الإنسانية والعلوم الحديثة. #تاريخ #علوم",
    category: "تعليم",
    author: "د. عبد الله",
    authorRole: "admin"
  },
  {
    title: "أثر القراءة على العقل",
    content: "القراءة ليست مجرد هواية، بل هي غذاء للروح وتمرين للعقل. اقرأ لتنمو. #قراءة #ثقافة",
    category: "أخرى",
    author: "مريم يوسف",
    authorRole: "user"
  },
  {
    title: "تحديات الأمن السيبراني",
    content: "كيف نحمي بياناتنا في عالم مترابط رقمياً؟ أهمية الوعي الأمني. #أمن_سيبراني #تكنولوجيا",
    category: "تكنولوجيا",
    author: "خالد سعيد",
    authorRole: "user"
  },
  {
    title: "جماليات الخط العربي",
    content: "الخط العربي فن هندسي وروحي يعكس جمال اللغة العربية وعمقها. #خط_عربي #فن",
    category: "فن",
    author: "عمر الفاروق",
    authorRole: "user"
  },
  {
    title: "مفهوم السعادة في الفلسفة اليونانية",
    content: "كيف نظر أرسطو وأفلاطون إلى السعادة؟ هل هي غاية في ذاتها؟ #فلسفة #يونان",
    category: "فلسفة",
    author: "زينب حسن",
    authorRole: "user"
  },
  {
    title: "العمل الحر: الفرص والتحديات",
    content: "كيف تبدأ مسيرتك في العمل الحر وتواجه تقلبات السوق؟ #عمل_حر #اقتصاد",
    category: "تعليم",
    author: "سامي مراد",
    authorRole: "user"
  },
  {
    title: "تطور الهواتف الذكية",
    content: "من أجهزة اتصال بسيطة إلى حواسيب خارقة في جيوبنا. رحلة التطور التقني. #تكنولوجيا #موبايل",
    category: "تكنولوجيا",
    author: "نور الدين",
    authorRole: "user"
  },
  {
    title: "أهمية الرياضة للصحة النفسية",
    content: "العقل السليم في الجسم السليم. كيف تؤثر الرياضة على مزاجنا اليومي؟ #رياضة #صحة",
    category: "أخرى",
    author: "هالة أحمد",
    authorRole: "user"
  },
  {
    title: "أساسيات التصميم الجرافيكي",
    content: "كيف تبدأ في عالم التصميم وتفهم لغة الألوان والأشكال؟ #تصميم #فن",
    category: "تعليم",
    author: "كريم وليد",
    authorRole: "user"
  },
  {
    title: "ظاهرة التغير المناخي",
    content: "تحديات بيئية تواجه كوكبنا ومسؤوليتنا تجاه الأجيال القادمة. #بيئة #مناخ",
    category: "أخرى",
    author: "أمل سعيد",
    authorRole: "user"
  },
  {
    title: "قوة العادات الذرية",
    content: "كيف يمكن للتغييرات الصغيرة جداً أن تؤدي إلى نتائج مذهلة في حياتك؟ #تطوير_ذات #عادات",
    category: "تعليم",
    author: "يوسف علي",
    authorRole: "user"
  },
  {
    title: "الفلسفة الإسلامية المعاصرة",
    content: "تحديات التجديد في الفكر الإسلامي ومواكبة قضايا العصر. #فلسفة #إسلام",
    category: "فلسفة",
    author: "د. طه",
    authorRole: "admin"
  },
  {
    title: "عالم الميتافيرس",
    content: "هل سنعيش حقاً في عوالم افتراضية؟ ما هي آفاق الميتافيرس؟ #تكنولوجيا #ميتافيرس",
    category: "تكنولوجيا",
    author: "رامي حسن",
    authorRole: "user"
  },
  {
    title: "أسرار النجاح في ريادة الأعمال",
    content: "الريادة تتطلب شغفاً وصبراً وقدرة على التعلم من الفشل. #ريادة_أعمال #نجاح",
    category: "تعليم",
    author: "فهد جاسم",
    authorRole: "user"
  },
  {
    title: "تأثير الموسيقى على التركيز",
    content: "هل تساعد الموسيقى الكلاسيكية حقاً في الدراسة والتركيز؟ #موسيقى #دراسة",
    category: "فن",
    author: "سلمى منير",
    authorRole: "user"
  },
  {
    title: "اللغة العربية وتحديات العولمة",
    content: "كيف نحافظ على هويتنا اللغوية في ظل الانفتاح الثقافي العالمي؟ #لغة_عربية #هوية",
    category: "أخرى",
    author: "أ. محمود",
    authorRole: "admin"
  },
  {
    title: "مستقبل الطاقة المتجددة",
    content: "الطاقة الشمسية وطاقة الرياح كبدائل مستدامة للوقود الأحفوري. #طاقة #بيئة",
    category: "تكنولوجيا",
    author: "إياد خليل",
    authorRole: "user"
  },
  {
    title: "سيكولوجية الألوان في التسويق",
    content: "كيف تؤثر الألوان على قراراتنا الشرائية وانطباعنا عن العلامات التجارية؟ #تسويق #علم_نفس",
    category: "تعليم",
    author: "دينا فؤاد",
    authorRole: "user"
  },
  {
    title: "أدب الرحلات عبر العصور",
    content: "من ابن بطوطة إلى الرحالة المعاصرين، كيف وصف الإنسان العالم؟ #أدب #رحلات",
    category: "أخرى",
    author: "جمال عبيد",
    authorRole: "user"
  },
  {
    title: "الذكاء العاطفي في القيادة",
    content: "لماذا يعتبر الذكاء العاطفي أهم من الذكاء العقلي في إدارة الفرق؟ #قيادة #ذكاء_عاطفي",
    category: "تعليم",
    author: "منى زكي",
    authorRole: "user"
  },
  {
    title: "تطور السينما العالمية",
    content: "من الأفلام الصامتة إلى المؤثرات البصرية المذهلة. تاريخ الفن السابع. #سينما #فن",
    category: "فن",
    author: "باسم يوسف",
    authorRole: "user"
  },
  {
    title: "الفلسفة الرواقية والهدوء النفسي",
    content: "كيف نطبق مبادئ الرواقية للتعامل مع ضغوط الحياة اليومية؟ #فلسفة #رواقية",
    category: "فلسفة",
    author: "علي رضا",
    authorRole: "user"
  },
  {
    title: "إنترنت الأشياء (IoT)",
    content: "عالم تتواصل فيه الأشياء من حولنا لتسهيل حياتنا. #تكنولوجيا #IoT",
    category: "تكنولوجيا",
    author: "هاني مراد",
    authorRole: "user"
  },
  {
    title: "أهمية العمل التطوعي",
    content: "التطوع ليس مجرد خدمة للمجتمع، بل هو تطوير للذات وشعور بالإنجاز. #تطوع #مجتمع",
    category: "أخرى",
    author: "سعاد علي",
    authorRole: "user"
  },
  {
    title: "فن التفاوض والإقناع",
    content: "كيف تحصل على ما تريد من خلال مهارات التفاوض الذكية. #مهارات #نجاح",
    category: "تعليم",
    author: "طارق عزيز",
    authorRole: "user"
  }
];

export const seedDatabase = async () => {
  console.log("Starting database seeding...");
  for (const post of TEST_POSTS) {
    try {
      await addDoc(collection(db, "ideas"), {
        ...post,
        hashtags: post.content.match(/#[\w\u0600-\u06FF]+/g)?.map(t => t.slice(1)) || [],
        authorId: "test-user-" + Math.random().toString(36).substr(2, 9),
        views: Math.floor(Math.random() * 1000),
        viewedBy: [],
        likes: Math.floor(Math.random() * 200),
        likedBy: [],
        featured: Math.random() > 0.8,
        deleted: false,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      });
      console.log(`Added post: ${post.title}`);
    } catch (error) {
      console.error(`Error adding post ${post.title}:`, error);
    }
  }
  console.log("Database seeding completed!");
};
