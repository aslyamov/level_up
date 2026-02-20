export interface Character {
  name: string;
  imageUrl?: string;
  cost: number;
}

export interface CharacterSet {
  title: string;
  characters: Character[];
}

export interface Question {
  text: string;
  answer?: string;
  imageUrl?: string;
  fen?: string;
  boardOrientation?: 'white' | 'black';
  solutionMovesUci?: string[]; // UCI moves of the solution: ['e2e4', 'e7e5', ...]
}

export interface QuestionPack {
  title: string;
  questions: Question[];
  starsPerCorrect: number;
}

export interface GameState {
  id: string;
  playerName: string;
  pack: QuestionPack;
  characterSet: CharacterSet;
  shuffledQuestions: Question[];
  spareQuestions: Question[];
  currentIndex: number;
  totalStars: number;
  timerSeconds: number;
  unlockedUpTo: number;
}

export interface SaveSlot {
  id: string;
  playerName: string;
  packTitle: string;
  charName: string;
  questionProgress: string; // e.g. "3 / 12"
  totalStars: number;
  savedAt: number;
  state: GameState;
}

export type Screen =
  | 'home'
  | 'setup'
  | 'game'
  | 'results'
  | 'pack-editor'
  | 'character-editor';
