
export interface Lecture {
  id: string;
  title: string;
  instructor: string;
  date: string;
  duration: string;
  thumbnailUrl: string;
  subject: string;
  transcript: string; // Mock transcript for AI processing
  videoUrl?: string; // Optional URL for uploaded videos
  summary?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
}

export interface Quiz {
  id: string;
  lectureId: string;
  title: string;
  questions: QuizQuestion[];
  score?: number;
  completedAt?: string;
}

export type QuizDifficulty = 'Basic' | 'Intermediate' | 'Hard';

export enum NavItem {
  Home = 'home',
  Library = 'library',
  Practice = 'practice',
  Profile = 'profile'
}

export interface Achievement {
  title: string;
  desc: string;
  date: string;
  icon: string;
}

export interface UserStats {
  studyTimeMinutes: number;
  quizzesTaken: number;
  totalQuizScore: number;
  totalQuestionsAnswered: number;
  quizzesAced: number;
  lecturesCompleted: number;
  achievements: Achievement[];
}