export type PlanType = 'FREE' | 'START' | 'PRO' | 'MAX' | 'MAKTAB_PRO' | 'MAKTAB_VIP';
export type AiPackType = 'PACK_1000' | 'PACK_3000' | 'PACK_7000' | 'PACK_500'; // PACK_500 kept for legacy key compatibility
export type LicenseKeyPlan = PlanType | AiPackType | 'VIP'; // VIP alias for backward compatibility

export interface PlanDetails {
  id: PlanType;
  name: string;
  badge: string;
  isPopular?: boolean;
  isSchool?: boolean;
  price: string;
  priceNumber: number;
  period: string;
  durationDays: number;
  description: string;
  tagline?: string;
  ctaText?: string;
  maxTeachers: number;
  maxClasses: number; // -1 for unlimited
  maxLessons: number; // -1 for unlimited (standard)
  maxTests: number; // -1 for unlimited (standard)
  maxAiCredits: number; // Teacher-facing: "AI limiti"
  canExportReports: boolean;
  hasSchoolRating: boolean;
  support: string;
  features: string[];
}

export interface AiPackDetails {
  id: AiPackType;
  name: string;
  credits: number;
  price: string;
  priceNumber: number;
  description: string;
}

export const PLANS: Record<PlanType, PlanDetails> = {
  FREE: {
    id: 'FREE',
    name: 'Bepul Sinov',
    badge: '7 kunlik sinov',
    price: '0 so\'m',
    priceNumber: 0,
    period: '7 kun',
    durationDays: 7,
    description: 'Yangi ustozlar uchun platformani to\'liq sinab ko\'rish imkoniyati',
    tagline: 'Karta ma\'lumoti talab qilinmaydi.',
    ctaText: '7 kun bepul boshlash',
    maxTeachers: 1,
    maxClasses: 1,
    maxLessons: 5,
    maxTests: 5,
    maxAiCredits: 100,
    canExportReports: false,
    hasSchoolRating: false,
    support: 'Standart',
    features: [
      '1 ta o\'qituvchi',
      '1 ta sinf',
      '5 ta dars rejasi',
      '5 ta test',
      '100 AI limiti',
      'Oddiy hisobotlar'
    ]
  },
  START: {
    id: 'START',
    name: 'START',
    badge: 'Sinab ko\'rish',
    price: '19 000 so\'m',
    priceNumber: 19000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Yakka tartibdagi repetitor va boshlang\'ich ustozlar uchun',
    tagline: 'AI yordamchini kundalik ishida sinab ko\'rmoqchi bo\'lgan ustozlar uchun.',
    ctaText: '19 000 so\'mga boshlash',
    maxTeachers: 1,
    maxClasses: 2,
    maxLessons: 30,
    maxTests: 30,
    maxAiCredits: 1500,
    canExportReports: false,
    hasSchoolRating: false,
    support: 'Standart',
    features: [
      '1 ta o\'qituvchi',
      '2 ta sinf',
      '30 ta dars rejasi',
      '30 ta test',
      '1 500 AI limiti',
      'Oddiy hisobotlar',
      'Standart yordam'
    ]
  },
  PRO: {
    id: 'PRO',
    name: 'PRO',
    badge: '⭐ Eng ommabop',
    isPopular: true,
    price: '39 000 so\'m',
    priceNumber: 39000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Faol maktab o\'qituvchilari va fidoyi ustozlar uchun',
    tagline: 'Har kuni dars o\'tadigan va daftarlarni tez tekshiruvchi ustozlar uchun eng maqbul tanlov.',
    ctaText: 'PRO ni tanlash',
    maxTeachers: 1,
    maxClasses: 6,
    maxLessons: 100,
    maxTests: 100,
    maxAiCredits: 3200,
    canExportReports: true,
    hasSchoolRating: false,
    support: 'Ustuvor',
    features: [
      '1 ta o\'qituvchi',
      '6 ta sinf',
      '100 ta dars rejasi',
      '100 ta test',
      '3 200 AI limiti',
      'Kengaytirilgan hisobotlar',
      'O\'quvchilar progressi',
      'PDF / Excel eksport',
      'Ustuvor yordam'
    ]
  },
  MAX: {
    id: 'MAX',
    name: 'MAX',
    badge: 'Kengaytirilgan',
    price: '69 000 so\'m',
    priceNumber: 69000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Katta yuklamali o\'qituvchilar va o\'quv markazlari uchun',
    tagline: 'Katta yuklama va bir nechta parallel sinflarni o\'qituvchi ustozlar uchun.',
    ctaText: 'MAX ni tanlash',
    maxTeachers: 2,
    maxClasses: 15,
    maxLessons: 300,
    maxTests: 300,
    maxAiCredits: 6000,
    canExportReports: true,
    hasSchoolRating: true,
    support: 'Ustuvor',
    features: [
      '2 ta o\'qituvchi',
      '15 ta sinf',
      '300 ta dars rejasi',
      '300 ta test',
      '6 000 AI limiti',
      'To\'liq analitika',
      'Sinflarni solishtirish',
      'PDF / Excel eksport',
      'Ustuvor yordam'
    ]
  },
  MAKTAB_PRO: {
    id: 'MAKTAB_PRO',
    name: 'Maktab PRO',
    badge: '🏫 Maktablar uchun',
    isSchool: true,
    price: '129 000 so\'m',
    priceNumber: 129000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Maktablar va metodik birlashmalar uchun',
    tagline: 'Butun bir kafedra yoki maktab metodik birlashmasi uchun umumiy hisob.',
    ctaText: 'Maktab PRO ni tanlash',
    maxTeachers: 5,
    maxClasses: 50,
    maxLessons: 1000,
    maxTests: 1000,
    maxAiCredits: 11000,
    canExportReports: true,
    hasSchoolRating: true,
    support: 'Priority',
    features: [
      '5 ta o\'qituvchi',
      '50 ta sinf',
      '1 000 ta dars rejasi',
      '1 000 ta test',
      '11 000 AI limiti',
      'Maktab dashboardi',
      'O\'qituvchilar statistikasi',
      'Sinf analitikasi',
      'PDF / Excel eksport',
      'Priority yordam'
    ]
  },
  MAKTAB_VIP: {
    id: 'MAKTAB_VIP',
    name: 'Maktab VIP',
    badge: '👑 VIP Maktab',
    isSchool: true,
    price: '199 000 so\'m',
    priceNumber: 199000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Katta maktablar, xususiy maktablar va liseylar uchun',
    tagline: 'Butun maktab jamoasi uchun cheksiz sinf va darslar, shaxsiy menejer ko\'magi.',
    ctaText: 'Maktab VIP ni tanlash',
    maxTeachers: 15,
    maxClasses: -1, // Cheksiz
    maxLessons: -1, // Cheksiz oddiy dars
    maxTests: -1, // Cheksiz oddiy test
    maxAiCredits: 17000,
    canExportReports: true,
    hasSchoolRating: true,
    support: '24/7 Shaxsiy menejer',
    features: [
      '15 ta o\'qituvchi',
      'Cheksiz sinf',
      'Cheksiz oddiy dars',
      'Cheksiz oddiy test',
      '17 000 AI limiti',
      'Maktab boshqaruv paneli',
      'Barcha analitika va monitoring',
      'PDF / Excel eksport',
      '24/7 Shaxsiy menejer ko\'magi'
    ]
  }
};

// Simplified Add-On AI Packs
export const AI_PACKS: Record<AiPackType, AiPackDetails> = {
  PACK_1000: {
    id: 'PACK_1000',
    name: '+1 000 AI limiti',
    credits: 1000,
    price: '9 000 so\'m',
    priceNumber: 9000,
    description: 'Tarifingizni almashtirmasdan +1 000 AI limiti qo\'shing'
  },
  PACK_3000: {
    id: 'PACK_3000',
    name: '+3 000 AI limiti',
    credits: 3000,
    price: '19 000 so\'m',
    priceNumber: 19000,
    description: 'Tarifingizni almashtirmasdan +3 000 AI limiti qo\'shing'
  },
  PACK_7000: {
    id: 'PACK_7000',
    name: '+7 000 AI limiti',
    credits: 7000,
    price: '39 000 so\'m',
    priceNumber: 39000,
    description: 'Tarifingizni almashtirmasdan +7 000 AI limiti qo\'shing'
  },
  PACK_500: {
    id: 'PACK_500',
    name: '+500 AI limiti',
    credits: 500,
    price: '5 000 so\'m',
    priceNumber: 5000,
    description: 'Qo\'shimcha AI limiti'
  }
};

// Referral Program Config
export const REFERRAL_CONFIG = {
  inviterBonusAi: 300, // +300 AI limiti for person who invited
  inviteeBonusAi: 200, // +200 AI limiti for new user on first purchase
  bannerText: "Do'stingizni taklif qiling — Do'stingiz obuna olsa, sizga +300 AI limiti sovg'a."
};

// Backend Hidden Economic Multipliers (Internal calculation only)
export const AI_CREDIT_COSTS: Record<string, number> = {
  answer_check: 1, // 1 AI limit per student test sheet
  test_generation: 3, // 3 AI limit per AI test creation
  lesson_generation: 5, // 5 AI limit per complete 45-min lesson plan
  text_analysis: 8, // 8 AI limit for dictation / handwritten text analysis
  open_question: 8, // 8 AI limit for essay / open question grading
  report_generation: 1 // 1 AI limit for class performance summary
};

// Unit financial cost per AI credit in Uzbek Som (Baseline internal benchmark)
export const AI_COST_PER_CREDIT_UZS = Number(process.env.AI_COST_PER_CREDIT_UZS || 12);

// Centralized AI Models Configuration (No hardcoded strings)
export const AI_MODELS = {
  testPrimary: process.env.AI_TEST_PRIMARY_MODEL || 'gemini-2.5-flash-lite',
  testFallback: process.env.AI_TEST_FALLBACK_MODEL || 'gemini-3.6-flash',
  dictation: process.env.AI_DICTATION_MODEL || 'gemini-3.6-flash',
  openQuestion: process.env.AI_OPEN_QUESTION_MODEL || 'gemini-3.6-flash',
  lesson: process.env.AI_LESSON_MODEL || 'gemini-3.6-flash',
  testGenerator: process.env.AI_TEST_GENERATOR_MODEL || 'gemini-2.5-flash-lite',
  testGeneratorFallback: process.env.AI_TEST_GEN_FALLBACK_MODEL || 'gemini-3.6-flash'
};

// Real Model Pricing per 1 Million Tokens (in USD)
export const AI_PRICING: Record<string, { inputPerMillionUsd: number; outputPerMillionUsd: number }> = {
  'gemini-2.5-flash-lite': {
    inputPerMillionUsd: 0.075,
    outputPerMillionUsd: 0.30
  },
  'gemini-3.6-flash': {
    inputPerMillionUsd: 0.15,
    outputPerMillionUsd: 0.60
  },
  'gemini-flash-latest': {
    inputPerMillionUsd: 0.15,
    outputPerMillionUsd: 0.60
  }
};

// Real Currency Exchange Rate
export const USD_UZS_RATE = Number(process.env.USD_UZS_RATE || 11857.35);

// Batch & Concurrency Settings for High-Throughput Grading
export const AI_BATCH_CONFIG = {
  batchSize: Math.max(1, Number(process.env.AI_TEST_BATCH_SIZE || 5)),
  concurrency: Math.max(1, Number(process.env.AI_TEST_CONCURRENCY || 3))
};

// Next-Gen Pipeline V2 Feature Flag
export const IS_AI_PIPELINE_V2 = process.env.AI_PIPELINE_V2 !== 'false';

/**
 * Calculates estimated USD and UZS cost from actual token counts.
 */
export function calculateTokenCost(modelName: string, inputTokens = 0, outputTokens = 0): { costUsd: number; costUzs: number } {
  const normalizedModel = modelName.toLowerCase();
  let pricing = AI_PRICING['gemini-2.5-flash-lite'];

  if (normalizedModel.includes('3.6') || normalizedModel.includes('pro') || normalizedModel.includes('flash-latest')) {
    pricing = AI_PRICING['gemini-3.6-flash'];
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillionUsd;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillionUsd;
  const totalUsd = inputCost + outputCost;
  const totalUzs = totalUsd * USD_UZS_RATE;

  return {
    costUsd: Number(totalUsd.toFixed(6)),
    costUzs: Number(totalUzs.toFixed(2))
  };
}

export function getPlanDetails(planKey: string | null | undefined): PlanDetails {
  if (!planKey) return PLANS.FREE;
  const key = planKey.toUpperCase();
  if (key === 'VIP') return PLANS.MAKTAB_VIP; // Legacy alias mapping
  if (key in PLANS) return PLANS[key as PlanType];
  return PLANS.FREE;
}

export function isUnlimited(value: number): boolean {
  return value === -1 || value >= 999999;
}
