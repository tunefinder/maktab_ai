export type PlanType = 'FREE' | 'START' | 'PRO' | 'MAX' | 'MAKTAB_PRO' | 'MAKTAB_VIP';
export type AiPackType = 'PACK_500' | 'PACK_1000';
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
  maxTeachers: number;
  maxClasses: number; // -1 for unlimited
  maxLessons: number; // -1 for unlimited (standard)
  maxTests: number; // -1 for unlimited (standard)
  maxAiCredits: number;
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
    badge: 'Sinov',
    price: '0',
    priceNumber: 0,
    period: 'boshlang\'ich',
    durationDays: 7,
    description: 'Yangi foydalanuvchilar uchun dastlabki sinov imkoniyati',
    maxTeachers: 1,
    maxClasses: 1,
    maxLessons: 5,
    maxTests: 3,
    maxAiCredits: 20,
    canExportReports: false,
    hasSchoolRating: false,
    support: 'Standart',
    features: [
      '1 ta o\'qituvchi',
      '1 ta sinf',
      '5 ta dars',
      '3 ta test',
      '20 ta AI tekshirish'
    ]
  },
  START: {
    id: 'START',
    name: 'START',
    badge: 'Start',
    price: '39 000 so\'m',
    priceNumber: 39000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Yakka tartibdagi repetitor va boshlang\'ich ustozlar uchun',
    maxTeachers: 1,
    maxClasses: 2,
    maxLessons: 40,
    maxTests: 30,
    maxAiCredits: 150,
    canExportReports: false,
    hasSchoolRating: false,
    support: 'Standart',
    features: [
      '1 ta o\'qituvchi',
      '2 ta sinf',
      '40 ta dars',
      '30 ta test',
      '150 ta AI tekshirish',
      'Oddiy hisobotlar',
      'Sinflar bo\'yicha natijalar',
      'Standart support'
    ]
  },
  PRO: {
    id: 'PRO',
    name: 'PRO',
    badge: '⭐ Eng ommabop',
    isPopular: true,
    price: '69 000 so\'m',
    priceNumber: 69000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Faol maktab o\'qituvchilari va fidoiy ustozlar uchun',
    maxTeachers: 1,
    maxClasses: 6,
    maxLessons: 100,
    maxTests: 100,
    maxAiCredits: 500,
    canExportReports: true,
    hasSchoolRating: false,
    support: 'Ustuvor',
    features: [
      '1 ta o\'qituvchi',
      '6 ta sinf',
      '100 ta dars',
      '100 ta test',
      '500 ta AI tekshirish',
      'Kengaytirilgan hisobotlar',
      'O\'quvchilar progressi',
      'Natijalarni eksport qilish (PDF/Excel)',
      'Ustuvor support'
    ]
  },
  MAX: {
    id: 'MAX',
    name: 'MAX',
    badge: 'Kengaytirilgan',
    price: '119 000 so\'m',
    priceNumber: 119000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Katta yuklamali o\'qituvchilar va o\'quv markazlari uchun',
    maxTeachers: 2,
    maxClasses: 15,
    maxLessons: 300,
    maxTests: 300,
    maxAiCredits: 1000,
    canExportReports: true,
    hasSchoolRating: true,
    support: 'Ustuvor',
    features: [
      '2 ta o\'qituvchi',
      '15 ta sinf',
      '300 ta dars',
      '300 ta test',
      '1 000 ta AI tekshirish',
      'To\'liq analitika',
      'Sinflarni solishtirish',
      'O\'quvchi progress tarixi',
      'Eksport imkoniyati',
      'Ustuvor support'
    ]
  },
  MAKTAB_PRO: {
    id: 'MAKTAB_PRO',
    name: 'Maktab PRO',
    badge: '🏫 Maktablar uchun',
    isSchool: true,
    price: '229 000 so\'m',
    priceNumber: 229000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Maktablar va IDUM metodik birlashmalari uchun',
    maxTeachers: 5,
    maxClasses: 50,
    maxLessons: 1000,
    maxTests: 1000,
    maxAiCredits: 2200,
    canExportReports: true,
    hasSchoolRating: true,
    support: 'Priority',
    features: [
      '5 ta o\'qituvchi',
      '50 ta sinf',
      '1 000 ta dars',
      '1 000 ta test',
      '2 200 ta AI tekshirish',
      'Maktab dashboardi',
      'O\'qituvchilar statistikasi',
      'Sinflar kesimida analitika',
      'To\'liq hisobot va PDF/Excel eksport',
      'Priority support'
    ]
  },
  MAKTAB_VIP: {
    id: 'MAKTAB_VIP',
    name: 'Maktab VIP',
    badge: '👑 VIP Maktab',
    isSchool: true,
    price: '399 000 so\'m',
    priceNumber: 399000,
    period: 'oyiga',
    durationDays: 30,
    description: 'Katta maktablar, xususiy maktablar va liseylar uchun',
    maxTeachers: 15,
    maxClasses: -1, // Cheksiz
    maxLessons: -1, // Cheksiz oddiy dars
    maxTests: -1, // Cheksiz oddiy test
    maxAiCredits: 4000,
    canExportReports: true,
    hasSchoolRating: true,
    support: '24/7 Shaxsiy menejer',
    features: [
      '15 ta o\'qituvchi',
      'Cheksiz sinf',
      'Cheksiz oddiy dars',
      'Cheksiz oddiy test',
      '4 000 ta AI tekshirish',
      'Maktab boshqaruv paneli',
      'Barcha analitika va monitoring',
      'Sinf va o\'quvchi progressi',
      'Excel/PDF eksport',
      '24/7 Shaxsiy menejer ko\'magi'
    ]
  }
};

export const AI_PACKS: Record<AiPackType, AiPackDetails> = {
  PACK_500: {
    id: 'PACK_500',
    name: 'AI Pack 500',
    credits: 500,
    price: '29 000 so\'m',
    priceNumber: 29000,
    description: '+500 ta qo\'shimcha AI tekshirish'
  },
  PACK_1000: {
    id: 'PACK_1000',
    name: 'AI Pack 1000',
    credits: 1000,
    price: '49 000 so\'m',
    priceNumber: 49000,
    description: '+1 000 ta qo\'shimcha AI tekshirish'
  }
};

// Unified dynamic AI Operation Credit Costs (in credits charged to user)
export const AI_CREDIT_COSTS: Record<string, number> = {
  answer_check: Number(process.env.AI_COST_ANSWER_CHECK || 1), // 1 credit per image/answer sheet
  test_generation: Number(process.env.AI_COST_TEST_GEN || 2), // 2 credits per test generation
  lesson_generation: Number(process.env.AI_COST_LESSON_GEN || 3), // 3 credits per lesson plan
  text_analysis: Number(process.env.AI_COST_TEXT_ANALYSIS || 2), // 2 credits for dictation/essay
  report_generation: Number(process.env.AI_COST_REPORT_GEN || 1) // 1 credit for class performance summary
};

// Unit financial cost per AI credit in Uzbek Som (Baseline worst-case)
export const AI_COST_PER_CREDIT_UZS = Number(process.env.AI_COST_PER_CREDIT_UZS || 53);

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
