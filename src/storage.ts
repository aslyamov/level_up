import type { QuestionPack, CharacterSet, GameState, SaveSlot } from './types';

const PACKS_KEY     = 'clu_packs';
const CHAR_SETS_KEY = 'clu_character_sets';
const SAVES_KEY     = 'clu_saves';

// ── Question Packs ─────────────────────────────────────────────────────────

export function loadPacks(): QuestionPack[] {
  try {
    const data = JSON.parse(localStorage.getItem(PACKS_KEY) ?? '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function savePacks(packs: QuestionPack[]): void {
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
}

// ── Character Sets ─────────────────────────────────────────────────────────

export function loadCharacterSets(): CharacterSet[] {
  try {
    const data = JSON.parse(localStorage.getItem(CHAR_SETS_KEY) ?? '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function saveCharacterSets(sets: CharacterSet[]): void {
  localStorage.setItem(CHAR_SETS_KEY, JSON.stringify(sets));
}

// ── Save Slots ─────────────────────────────────────────────────────────────

export function loadSaves(): SaveSlot[] {
  try {
    const data = JSON.parse(localStorage.getItem(SAVES_KEY) ?? '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

export function upsertSave(state: GameState): void {
  const saves   = loadSaves();
  const idx     = saves.findIndex(s => s.id === state.id);
  const charName = state.unlockedUpTo >= 0
    ? (state.characterSet.characters[state.unlockedUpTo]?.name ?? '')
    : '';

  const slot: SaveSlot = {
    id:               state.id,
    playerName:       state.playerName,
    packTitle:        state.pack.title,
    charName,
    questionProgress: `${state.currentIndex + 1} / ${state.shuffledQuestions.length}`,
    totalStars:       state.totalStars,
    savedAt:          Date.now(),
    state,
  };

  if (idx >= 0) saves[idx] = slot;
  else saves.unshift(slot);

  localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
}

export function deleteSave(id: string): void {
  const filtered = loadSaves().filter(s => s.id !== id);
  localStorage.setItem(SAVES_KEY, JSON.stringify(filtered));
}

// ── Builtin Data ───────────────────────────────────────────────────────────

export async function loadBuiltinPacks(): Promise<QuestionPack[]> {
  try {
    const res = await fetch('packs/index.json');
    const files: string[] = await res.json();
    return Promise.all(files.map(f => fetch(`packs/${f}`).then(r => r.json())));
  } catch { return []; }
}

export async function loadBuiltinCharacterSets(): Promise<CharacterSet[]> {
  try {
    const res = await fetch('characters/index.json');
    const files: string[] = await res.json();
    return Promise.all(files.map(f => fetch(`characters/${f}`).then(r => r.json())));
  } catch { return []; }
}
