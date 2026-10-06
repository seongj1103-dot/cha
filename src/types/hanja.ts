export interface HanjaItem {
  id: string | number;
  hanja: string;
  meaning: string; // e.g. "집 가"
  sound?: string;   // e.g. "가"
  radical: string; // e.g. "宀"
  strokes: number; // e.g. 10
  example: string; // e.g. "가화만사성(家和萬事成)은 가정이 화목해야 만사가 잘 풀린다는 뜻이다."
  words: string;   // e.g. "가정, 가문, 국가"
  notes?: string;  // 추가 메모
  date?: string;
  isBookmarked?: boolean;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  hanja: string;
  message: string;
  score?: number;
  createdAt: string;
}

export type QuizMode = 'hanja-to-meaning' | 'meaning-to-hanja' | 'sentence-blank';

export interface QuizQuestion {
  id: string;
  targetHanja: HanjaItem;
  mode: QuizMode;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AiFeedback {
  feedback: string;
  etymology?: string;
  mnemonics?: string;
  recommendedWords?: string;
  isAiGenerated: boolean;
}

export interface SheetConfig {
  webAppUrl: string;
  sheetName?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}
