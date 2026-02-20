import type { QuestionPack, CharacterSet, GameState, SaveSlot } from './types';

const PACKS_KEY     = 'clu_packs';
const CHAR_SETS_KEY = 'clu_character_sets';
const SAVES_KEY     = 'clu_saves';

// ── Question Packs ─────────────────────────────────────────────────────────

export function loadPacks(): QuestionPack[] {
  try {
    const data = JSON.parse(localStorage.getItem(PACKS_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(p =>
      p && typeof p.title === 'string' &&
      Array.isArray(p.questions) &&
      typeof p.starsPerCorrect === 'number'
    );
  } catch { return []; }
}

export function savePacks(packs: QuestionPack[]): void {
  try { localStorage.setItem(PACKS_KEY, JSON.stringify(packs)); }
  catch { alert('Не удалось сохранить: хранилище переполнено.'); }
}

// ── Character Sets ─────────────────────────────────────────────────────────

export function loadCharacterSets(): CharacterSet[] {
  try {
    const data = JSON.parse(localStorage.getItem(CHAR_SETS_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(s =>
      s && typeof s.title === 'string' &&
      Array.isArray(s.characters)
    );
  } catch { return []; }
}

export function saveCharacterSets(sets: CharacterSet[]): void {
  try { localStorage.setItem(CHAR_SETS_KEY, JSON.stringify(sets)); }
  catch { alert('Не удалось сохранить: хранилище переполнено.'); }
}

// ── Save Slots ─────────────────────────────────────────────────────────────

export function loadSaves(): SaveSlot[] {
  try {
    const data = JSON.parse(localStorage.getItem(SAVES_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(s =>
      s && typeof s.id === 'string' &&
      typeof s.playerName === 'string' &&
      s.state != null
    );
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

  try { localStorage.setItem(SAVES_KEY, JSON.stringify(saves)); }
  catch { alert('Не удалось сохранить прогресс: хранилище переполнено.'); }
}

export function deleteSave(id: string): void {
  const filtered = loadSaves().filter(s => s.id !== id);
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(filtered)); }
  catch { /* ignore — deletion is best-effort */ }
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
