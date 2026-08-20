export type PlanType = 'FREE' | 'PRO' | 'VIP';

export interface PlanDetails {
  id: PlanType;
  name: string;
  badge: string;
  price: string;
  period: string;
  description: string;
  maxClasses: number;
  maxStudentsPerClass: number;
  maxNotebooks: number;
  maxTests: number;
  maxLessonPlans: number;
  canExportReports: boolean;
  hasSchoolRating: boolean;
  features: string[];
}

export const PLANS: Record<PlanType, PlanDetails> = {
  FREE: {
    id: 'FREE',
    name: 'Bepul (Start)',
    badge: 'Start',
    price: '0',
    period: "doimiy",
    description: "Yangi boshlovchilar va sinab ko'rish uchun",
    maxClasses: 1,
    maxStudentsPerClass: 25,
    maxNotebooks: 20,
    maxTests: 3,
    maxLessonPlans: 3,
    canExportReports: false,
    hasSchoolRating: false,
    features: [
      "1 ta sinf",
      "25 tagacha o'quvchi",
      "Oyiga 20 ta daftar tekshirish",
      "Oyiga 3 ta AI test yaratish",
      "Oyiga 3 ta dars rejasi",
      "Asosiy hisobotlar"
    ]
  },
  PRO: {
    id: 'PRO',
    name: 'Ustoz PRO',
    badge: 'Tavsiya etiladi',
    price: "49 000 so'm",
    period: "oyiga",
    description: "Faol maktab o'qituvchilari va repetitorlar uchun",
    maxClasses: 6,
    maxStudentsPerClass: 200,
    maxNotebooks: 1000,
    maxTests: 100,
    maxLessonPlans: 100,
    canExportReports: true,
    hasSchoolRating: false,
    features: [
      "6 ta sinf",
      "200 tagacha o'quvchi",
      "Oyiga 1 000 ta daftar tekshirish",
      "Oyiga 100 ta AI test yaratish",
      "Oyiga 100 ta dars rejasi",
      "Kitobdan suratga olib tekshirish",
      "PDF va Excel hisobotlarni yuklash"
    ]
  },
  VIP: {
    id: 'VIP',
    name: 'Maktab VIP',
    badge: 'Premium',
    price: "199 000 so'm",
    period: "oyiga",
    description: "Maktablar, IDUM va o'quv markazlari uchun",
    maxClasses: 999999,
    maxStudentsPerClass: 999999,
    maxNotebooks: 15000,
    maxTests: 999999,
    maxLessonPlans: 999999,
    canExportReports: true,
    hasSchoolRating: true,
    features: [
      "Cheksiz sinflar",
      "Cheksiz o'quvchilar",
      "Oyiga 15 000 ta daftar tekshirish",
      "Cheksiz AI testlar va dars rejalari",
      "To'liq maktab tahlili va reytingi",
      "Barcha o'qituvchilar uchun yagona tizim",
      "24/7 shaxsiy menejer va yordam"
    ]
  }
};
