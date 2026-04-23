export interface LevelInfo {
  level: number;
  title: string;
  description: string;
  unlockedFeatures: string[];
  newCapabilities: string[];
  requiredIdeas: number;
}

export const USER_LEVELS: LevelInfo[] = [
  {
    level: 1,
    title: "مستكشف مبتدئ",
    description: "أهلاً بك في بداية رحلتك المعرفية.",
    unlockedFeatures: ["تصفح الأفكار", "الإعجاب والتعليق"],
    newCapabilities: ["يمكنك الآن التفاعل مع محتوى الآخرين والبدء في بناء شبكتك."],
    requiredIdeas: 0
  },
  {
    level: 2,
    title: "مفكر واعد",
    description: "لقد بدأت في مشاركة أفكارك مع العالم!",
    unlockedFeatures: ["نشر الأفكار", "إضافة روابط ومصادر"],
    newCapabilities: ["يمكنك الآن نشر أفكارك الخاصة وإثراء المحتوى في المتحف."],
    requiredIdeas: 1
  },
  {
    level: 3,
    title: "كاتب مبدع",
    description: "أفكارك تلهم الكثيرين، استمر في هذا التألق.",
    unlockedFeatures: ["تخصيص الملف الشخصي المتقدم", "إضافة اقتباسات"],
    newCapabilities: ["يمكنك الآن إضافة اقتباساتك المفضلة لتظهر في قسم الاقتباسات."],
    requiredIdeas: 5
  },
  {
    level: 4,
    title: "فيلسوف المتحف",
    description: "أنت الآن من الأعمدة الأساسية في مجتمعنا المعرفي.",
    unlockedFeatures: ["شارة الفيلسوف", "أولوية ظهور الأفكار"],
    newCapabilities: ["أفكارك الآن تحظى بأولوية في الظهور، ومساهماتك مميزة بشارة خاصة."],
    requiredIdeas: 10
  },
  {
    level: 5,
    title: "حكيم العصر",
    description: "مستوى أسطوري! إسهاماتك لا تقدر بثمن.",
    unlockedFeatures: ["صلاحيات إشرافية جزئية", "الوصول لجروب المدراء", "الوصول للميزات التجريبية"],
    newCapabilities: ["يمكنك الآن مساعدة الإدارة في تقييم المحتوى والتواصل معهم مباشرة في جروب المدراء."],
    requiredIdeas: 25
  }
];

export const calculateUserLevel = (ideasCount: number): LevelInfo => {
  let currentLevel = USER_LEVELS[0];
  for (const level of USER_LEVELS) {
    if (ideasCount >= level.requiredIdeas) {
      currentLevel = level;
    }
  }
  return currentLevel;
};
