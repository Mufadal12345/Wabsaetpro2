export interface LevelInfo {
  level: number;
  title: string;
  description: string;
  unlockedFeatures: string[];
  newCapabilities: string[];
  requiredScore: number;
}

export const USER_LEVELS: LevelInfo[] = [
  {
    level: 1,
    title: "مستكشف مبتدئ",
    description: "أهلاً بك في بداية رحلتك المعرفية.",
    unlockedFeatures: ["تصفح الأفكار", "الإعجاب والتعليق"],
    newCapabilities: ["يمكنك الآن التفاعل مع محتوى الآخرين والبدء في بناء شبكتك."],
    requiredScore: 0
  },
  {
    level: 2,
    title: "مفكر واعد",
    description: "لقد بدأت في مشاركة أفكارك مع العالم!",
    unlockedFeatures: ["نشر الأفكار", "إضافة روابط ومصادر"],
    newCapabilities: ["يمكنك الآن نشر أفكارك الخاصة وإثراء المحتوى في المتحف."],
    requiredScore: 20
  },
  {
    level: 3,
    title: "كاتب مبدع",
    description: "أفكارك تلهم الكثيرين، استمر في هذا التألق.",
    unlockedFeatures: ["تخصيص الملف الشخصي المتقدم", "إضافة اقتباسات"],
    newCapabilities: ["يمكنك الآن إضافة اقتباساتك المفضلة لتظهر في قسم الاقتباسات."],
    requiredScore: 100
  },
  {
    level: 4,
    title: "فيلسوف المتحف",
    description: "أنت الآن من الأعمدة الأساسية في مجتمعنا المعرفي.",
    unlockedFeatures: ["شارة الفيلسوف", "أولوية ظهور الأفكار"],
    newCapabilities: ["أفكارك الآن تحظى بأولوية في الظهور، ومساهماتك مميزة بشارة خاصة."],
    requiredScore: 500
  },
  {
    level: 5,
    title: "حكيم العصر",
    description: "مستوى أسطوري! إسهاماتك لا تقدر بثمن.",
    unlockedFeatures: ["صلاحيات إشرافية جزئية", "الوصول لجروب المدراء", "الوصول للميزات التجريبية"],
    newCapabilities: ["يمكنك الآن مساعدة الإدارة في تقييم المحتوى والتواصل معهم مباشرة في جروب المدراء."],
    requiredScore: 2000
  }
];

export const calculateActivityScore = (ideasCount: number, likesReceived: number = 0, commentsCount: number = 0): number => {
  // Post = 20 points, Like received = 5 points, Comment made = 2 points
  return (ideasCount * 20) + (likesReceived * 5) + (commentsCount * 2);
};

export const calculateUserLevel = (ideasCount: number, likesReceived: number = 0, commentsCount: number = 0): LevelInfo => {
  const score = calculateActivityScore(ideasCount, likesReceived, commentsCount);
  let currentLevel = USER_LEVELS[0];
  for (const level of USER_LEVELS) {
    if (score >= level.requiredScore) {
      currentLevel = level;
    }
  }
  return currentLevel;
};
