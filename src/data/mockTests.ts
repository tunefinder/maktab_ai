export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: AnswerOption[];
}

export interface SavedTest {
  id: string;
  title: string;
  subject: string;
  grade: string;
  timeAgo: string;
  questions: Question[];
}

const baseTests: SavedTest[] = [
  {
    id: "test-1",
    title: "Yurak tuzilishi",
    subject: "Biologiya",
    grade: "8-B",
    timeAgo: "2 soat oldin",
    questions: [
      {
        id: "q1",
        text: "Odam yuragi necha kameradan iborat?",
        options: [
          { id: "o1", text: "2 ta", isCorrect: false },
          { id: "o2", text: "3 ta", isCorrect: false },
          { id: "o3", text: "4 ta", isCorrect: true },
          { id: "o4", text: "5 ta", isCorrect: false }
        ]
      },
      {
        id: "q2",
        text: "Yurakning qaysi qismida arterial qon bo'ladi?",
        options: [
          { id: "o1", text: "O'ng bo'lmacha va o'ng qorincha", isCorrect: false },
          { id: "o2", text: "Chap bo'lmacha va chap qorincha", isCorrect: true },
          { id: "o3", text: "Faqat o'ng qorincha", isCorrect: false },
          { id: "o4", text: "Faqat chap bo'lmacha", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "test-2",
    title: "Elektr zanjiri",
    subject: "Fizika",
    grade: "9-A",
    timeAgo: "5 soat oldin",
    questions: [
      {
        id: "q1",
        text: "Elektr tokining kuchi qaysi asbob yordamida o'lchanadi?",
        options: [
          { id: "o1", text: "Ampermetr", isCorrect: true },
          { id: "o2", text: "Voltmetr", isCorrect: false },
          { id: "o3", text: "Ommmetr", isCorrect: false },
          { id: "o4", text: "Vattmetr", isCorrect: false }
        ]
      },
      {
        id: "q2",
        text: "Zanjirning bir qismi uchun Om qonuni qanday ifodalanadi?",
        options: [
          { id: "o1", text: "I = U / R", isCorrect: true },
          { id: "o2", text: "I = U * R", isCorrect: false },
          { id: "o3", text: "U = I / R", isCorrect: false },
          { id: "o4", text: "R = I * U", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "test-3",
    title: "Qisqa ko'paytirish formulalari",
    subject: "Matematika",
    grade: "7-C",
    timeAgo: "1 kun oldin",
    questions: [
      {
        id: "q1",
        text: "(a + b)² formulasi qaysi biriga teng?",
        options: [
          { id: "o1", text: "a² + b²", isCorrect: false },
          { id: "o2", text: "a² + 2ab + b²", isCorrect: true },
          { id: "o3", text: "a² - 2ab + b²", isCorrect: false },
          { id: "o4", text: "a² - b²", isCorrect: false }
        ]
      },
      {
        id: "q2",
        text: "a² - b² formulasi qaysi biriga teng?",
        options: [
          { id: "o1", text: "(a - b)(a + b)", isCorrect: true },
          { id: "o2", text: "(a - b)²", isCorrect: false },
          { id: "o3", text: "(a + b)²", isCorrect: false },
          { id: "o4", text: "(a - b)(a - b)", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "test-4",
    title: "Ikkinchi jahon urushi",
    subject: "Tarix",
    grade: "10-A",
    timeAgo: "2 kun oldin",
    questions: [
      {
        id: "q1",
        text: "Ikkinchi jahon urushi qachon boshlangan?",
        options: [
          { id: "o1", text: "1939 yil 1 sentyabr", isCorrect: true },
          { id: "o2", text: "1941 yil 22 iyun", isCorrect: false },
          { id: "o3", text: "1938 yil 1 sentyabr", isCorrect: false },
          { id: "o4", text: "1945 yil 2 sentyabr", isCorrect: false }
        ]
      },
      {
        id: "q2",
        text: "Fashistlar Germaniyasi qachon so'zsiz taslim bo'ldi?",
        options: [
          { id: "o1", text: "1945 yil 9 may", isCorrect: true },
          { id: "o2", text: "1945 yil 2 sentyabr", isCorrect: false },
          { id: "o3", text: "1944 yil 6 iyun", isCorrect: false },
          { id: "o4", text: "1943 yil 2 fevral", isCorrect: false }
        ]
      }
    ]
  },
  {
    id: "test-5",
    title: "Alisher Navoiy hayoti va ijodi",
    subject: "Adabiyot",
    grade: "8-A",
    timeAgo: "3 kun oldin",
    questions: [
      {
        id: "q1",
        text: "Alisher Navoiy qayerda tug'ilgan?",
        options: [
          { id: "o1", text: "Samarqand", isCorrect: false },
          { id: "o2", text: "Buxoro", isCorrect: false },
          { id: "o3", text: "Hirot", isCorrect: true },
          { id: "o4", text: "Toshkent", isCorrect: false }
        ]
      },
      {
        id: "q2",
        text: "Navoiyning qaysi dostoni \"Xamsa\" tarkibiga kirmaydi?",
        options: [
          { id: "o1", text: "Farhod va Shirin", isCorrect: false },
          { id: "o2", text: "Layli va Majnun", isCorrect: false },
          { id: "o3", text: "Lison ut-tayr", isCorrect: true },
          { id: "o4", text: "Hayrat ul-abror", isCorrect: false }
        ]
      }
    ]
  }
];

// Generate 15 more tests for a total of 20
export const mockTests: SavedTest[] = [
  ...baseTests,
  ...Array.from({ length: 15 }).map((_, i) => {
    const base = baseTests[i % 5];
    return {
      ...base,
      id: `test-${i + 6}`,
      title: `${base.title} (Nusxa ${i + 1})`,
      timeAgo: `${i + 4} kun oldin`
    };
  })
];
