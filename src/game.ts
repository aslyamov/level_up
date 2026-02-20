import type { GameState, QuestionPack, CharacterSet, Character, Screen } from './types';
import { escapeHtml, sanitizeImageUrl, showModal } from './utils';
import { mountBoard } from './board';
import type { Api } from '@lichess-org/chessground/api';
import type { Key } from '@lichess-org/chessground/types';
import { Chess } from 'chess.js';
import {
  loadPacks, loadCharacterSets,
  loadBuiltinPacks, loadBuiltinCharacterSets,
  upsertSave, deleteSave, loadSaves,
} from './storage';

// ── State ──────────────────────────────────────────────────────────────────

let game: GameState | null = null;
let _nav: (s: Screen) => void = () => { /* no-op until app sets it */ };
let boardApi: Api | null = null;
let boardMoveIdx = 0;
let navChess: Chess | null = null;
let navKeyHandler: ((e: KeyboardEvent) => void) | null = null;

let builtinPacks: QuestionPack[] = [];
let builtinSets: CharacterSet[] = [];

// ── Init ───────────────────────────────────────────────────────────────────

export function setNav(fn: (s: Screen) => void): void {
  _nav = fn;
}

export async function preload(): Promise<void> {
  [builtinPacks, builtinSets] = await Promise.all([
    loadBuiltinPacks(),
    loadBuiltinCharacterSets(),
  ]);
}

export function hasActiveSave(): boolean {
  return loadSaves().length > 0;
}

function allPacks(): QuestionPack[] {
  return [...builtinPacks, ...loadPacks()];
}

function allSets(): CharacterSet[] {
  return [...builtinSets, ...loadCharacterSets()];
}

// ── Setup Screen ───────────────────────────────────────────────────────────

export function renderSetup(el: HTMLElement): void {
  const packs = allPacks();
  const sets = allSets();
  const canStart = packs.length > 0 && sets.length > 0;

  el.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
      <h1 class="text-3xl font-bold mb-8">Новая игра</h1>

      <div class="w-full max-w-md space-y-5">

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Имя игрока</label>
          <input id="inp-name" type="text" maxlength="40" placeholder="Введите имя..."
            class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Пакет вопросов</label>
          ${packs.length > 0
            ? `<select id="sel-pack" class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500">
                ${packs.map((p, i) =>
                  `<option value="${i}">${escapeHtml(p.title)} (${p.questions.length} вопр. · ${p.starsPerCorrect}★)</option>`
                ).join('')}
               </select>`
            : `<div class="bg-gray-800 text-red-400 rounded-xl px-4 py-3 text-sm">Нет пакетов. Создайте в «Редакторе вопросов».</div>`}
        </div>

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Набор персонажей</label>
          ${sets.length > 0
            ? `<select id="sel-chars" class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500">
                ${sets.map((s, i) =>
                  `<option value="${i}">${escapeHtml(s.title)} (${s.characters.length} перс.)</option>`
                ).join('')}
               </select>`
            : `<div class="bg-gray-800 text-red-400 rounded-xl px-4 py-3 text-sm">Нет наборов. Создайте в «Редакторе персонажей».</div>`}
          <div id="compat-warning"></div>
        </div>

        <button id="btn-start"
          class="w-full py-4 rounded-xl font-bold text-lg transition
            ${canStart
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'}"
          ${canStart ? '' : 'disabled'}>
          Начать игру
        </button>

        <button id="btn-back"
          class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition">
          Назад
        </button>

      </div>
    </div>
  `;

  if (canStart) {
    const selPack  = el.querySelector('#sel-pack')  as HTMLSelectElement;
    const selChars = el.querySelector('#sel-chars') as HTMLSelectElement;

    const updateCompat = () => {
      const p       = packs[parseInt(selPack.value)];
      const s       = sets[parseInt(selChars.value)];
      const warning = el.querySelector('#compat-warning')!;
      if (!p || !s) { warning.innerHTML = ''; return; }

      const maxStars   = p.questions.length * p.starsPerCorrect;
      const sorted     = [...s.characters].sort((a, b) => a.cost - b.cost);
      const maxNeeded  = sorted[sorted.length - 1]?.cost ?? 0;
      const unlockable = sorted.filter(c => c.cost <= maxStars).length;

      const btnStart = el.querySelector('#btn-start') as HTMLButtonElement;
      if (unlockable === 0) {
        warning.innerHTML = `<div class="mt-2 px-3 py-2 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
          ⛔ Нельзя открыть ни одного персонажа — макс. ${maxStars}★, а самый дешёвый стоит ${sorted[0]?.cost ?? 0}★
        </div>`;
        btnStart.disabled = true;
        btnStart.classList.add('opacity-50', 'cursor-not-allowed');
      } else if (maxStars < maxNeeded) {
        warning.innerHTML = `<div class="mt-2 px-3 py-2 bg-yellow-950 border border-yellow-800 rounded-xl text-yellow-300 text-xs">
          ⚠ Можно открыть ${unlockable} из ${sorted.length} персонажей (макс. ${maxStars}★, нужно ${maxNeeded}★)
        </div>`;
        btnStart.disabled = false;
        btnStart.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        warning.innerHTML = `<div class="mt-2 px-3 py-2 bg-green-950 border border-green-800 rounded-xl text-green-400 text-xs">
          ✓ Все ${sorted.length} ${ruWord(sorted.length, 'персонаж', 'персонажа', 'персонажей')} открываемы (макс. ${maxStars}★ при нужных ${maxNeeded}★)
        </div>`;
        btnStart.disabled = false;
        btnStart.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    };

    selPack.addEventListener('change', updateCompat);
    selChars.addEventListener('change', updateCompat);
    updateCompat();

    el.querySelector('#btn-start')?.addEventListener('click', () => {
      const playerName = ((el.querySelector('#inp-name') as HTMLInputElement).value).trim().slice(0, 40);
      const packIdx    = parseInt(selPack.value);
      const setIdx     = parseInt(selChars.value);
      startGame(packs[packIdx]!, sets[setIdx]!, playerName);
    });
  }

  el.querySelector('#btn-back')?.addEventListener('click', () => _nav('home'));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ruWord(n: number, one: string, few: string, many: string): string {
  const m = n % 100;
  if (m >= 11 && m <= 14) return many;
  switch (n % 10) {
    case 1:  return one;
    case 2: case 3: case 4: return few;
    default: return many;
  }
}

// ── Game Init ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function startGame(pack: QuestionPack, characterSet: CharacterSet, playerName: string): void {
  const sortedChars = [...characterSet.characters].sort((a, b) => a.cost - b.cost);
  const allShuffled = shuffle(pack.questions);
  const maxCost    = sortedChars.at(-1)?.cost ?? 0;
  const minNeeded  = Math.ceil(maxCost / pack.starsPerCorrect);
  const hasExtra   = pack.questions.length > sortedChars.length;
  const questions  = hasExtra ? allShuffled.slice(0, minNeeded) : allShuffled;
  const spares     = hasExtra ? allShuffled.slice(minNeeded)    : [];
  game = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    playerName,
    pack,
    characterSet: { ...characterSet, characters: sortedChars },
    shuffledQuestions: questions,
    spareQuestions: spares,
    currentIndex: 0,
    totalStars: 0,
    unlockedUpTo: -1,
  };
  upsertSave(game);
  _nav('game');
  renderGameScreen();
}

export function resumeGame(id: string): void {
  const slot = loadSaves().find(s => s.id === id);
  if (!slot) return;
  game = slot.state;
  game.spareQuestions ??= [];
  _nav('game');
  renderGameScreen();
}

// ── Game Screen ────────────────────────────────────────────────────────────

function renderGameScreen(): void {
  if (!game) return;

  boardApi = null;
  boardMoveIdx = 0;
  navChess = null;
  if (navKeyHandler) { document.removeEventListener('keydown', navKeyHandler); navKeyHandler = null; }

  const el    = document.getElementById('screen-game')!;
  const chars = game.characterSet.characters;
  const cur   = game.unlockedUpTo >= 0 ? (chars[game.unlockedUpTo] ?? null) : null;
  const next  = chars[game.unlockedUpTo + 1] ?? null;
  const q     = game.shuffledQuestions[game.currentIndex]!;


  const img = (url?: string, cls = '') => {
    const safe = url ? sanitizeImageUrl(url) : '';
    return safe ? `<img src="${safe}" alt="" class="${cls}" />` : null;
  };

  // ── helpers for character cards (used in both layouts) ──────────────────
  const renderCharImg = (c: typeof cur, grayscale = false) => {
    if (!c) return `<span class="text-5xl opacity-30">🔒</span>`;
    const s = c.imageUrl ? sanitizeImageUrl(c.imageUrl) : '';
    return s
      ? `<img src="${s}" alt="" class="w-full h-full object-contain${grayscale ? ' grayscale' : ''}" />`
      : `<span class="text-5xl">👤</span>`;
  };
  const renderCharMeta = (c: typeof cur, muted = false) =>
    c ? `<div class="text-xs font-semibold text-center truncate w-full${muted ? ' text-gray-400' : ''}">${escapeHtml(c.name)}</div>
         <div class="text-yellow-400 text-xs${muted ? ' opacity-60' : ''}">★ ${c.cost}</div>`
      : `<div class="text-xs text-gray-600 text-center">—</div>`;
  // Container class: solid bg for real characters, dashed outline for locked
  const charBoxCls = (c: typeof cur) => c
    ? 'w-[160px] h-[160px] rounded-xl overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0'
    : 'w-[160px] h-[160px] rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center flex-shrink-0';

  const bottomControls = (h: string) => `
    <button id="btn-all-chars"
      class="w-full ${h} bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition border border-gray-700 hover:border-gray-500 flex items-center justify-center gap-2 text-sm">
      <span>🏅</span> Все персонажи
    </button>
    <div class="flex gap-2">
      <div class="relative flex-1 ${h} rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500"
             style="width:${Math.round(((game!.currentIndex + 1) / game!.shuffledQuestions.length) * 100)}%"></div>
        <span class="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow">
          ${game!.currentIndex + 1} / ${game!.shuffledQuestions.length}
        </span>
      </div>
      <button id="btn-exit"
        class="${h} px-4 bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-300 rounded-xl font-semibold text-sm transition border border-gray-700 hover:border-red-800 flex-shrink-0">
        Выход
      </button>
    </div>`;

  if (q.fen) {
    // ── CHESS LAYOUT: centered board + panel (CVT-style) ─────────────────
    el.innerHTML = `
      <div class="h-screen flex items-center justify-center bg-gray-950 overflow-hidden"
           style="--sz:min(calc(100vh - 24px),calc(100vw - 400px),780px)">
        <div class="flex gap-4">

          <!-- Board -->
          <div id="board-container"
               class="rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
               style="width:var(--sz);height:var(--sz)">
          </div>

          <!-- Panel: same height as board -->
          <div class="w-[360px] flex-shrink-0 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden"
               style="height:var(--sz)">

            <!-- Question text -->
            <div class="px-4 py-4 border-b border-gray-800 flex-shrink-0">
              <div class="text-lg font-semibold text-center leading-snug">
                ${escapeHtml(q.text)}
              </div>
            </div>

            <!-- Characters: column -->
            <div class="flex-1 min-h-0 flex flex-col items-center justify-evenly px-6 py-2 overflow-hidden">
              <div class="flex flex-col items-center gap-1 w-full">
                <div class="${charBoxCls(cur)}">
                  ${renderCharImg(cur)}
                </div>
                ${renderCharMeta(cur)}
              </div>
              <div class="text-gray-600 text-base">↓</div>
              <div class="flex flex-col items-center gap-1 w-full">
                <div class="${charBoxCls(next)}">
                  ${next ? renderCharImg(next, true) : `<span class="text-3xl">🏆</span>`}
                </div>
                ${next ? renderCharMeta(next, true) : `<div class="text-xs text-gray-500 text-center">Финал!</div>`}
              </div>
            </div>

            <!-- Bottom: controls + nav -->
            <div class="px-4 py-3 border-t border-gray-800 flex-shrink-0 space-y-2 relative">
              <div id="nav-lock-indicator" class="hidden absolute -top-5 left-0 right-0 text-xs text-yellow-500 text-center">🔒 Заблокировано</div>
              <div class="flex items-center gap-1.5">
                ${q.solutionMovesUci && q.solutionMovesUci.length > 0 ? `
                <button id="btn-nav-prev" class="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl transition flex items-center justify-center disabled:opacity-30">‹</button>
                <button id="btn-nav-next" class="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl transition flex items-center justify-center disabled:opacity-30">›</button>
                ` : ''}
                <button id="btn-correct" class="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-xl text-2xl transition flex items-center justify-center disabled:opacity-30">✔</button>
                <button id="btn-wrong"   class="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-red-400   rounded-xl text-2xl transition flex items-center justify-center disabled:opacity-30">✕</button>
              </div>
              ${bottomControls('h-10')}
            </div>

          </div>
        </div>
      </div>`;

  } else {
    // ── NON-CHESS LAYOUT: image + panel (mirrors chess layout) ───────────
    el.innerHTML = `
      <div class="h-screen flex items-center justify-center bg-gray-950 overflow-hidden"
           style="--sz:min(calc(100vh - 24px),calc(100vw - 400px),780px)">
        <div class="flex gap-4">

          <!-- Image (mirrors board position) -->
          <div class="rounded-xl shadow-2xl overflow-hidden flex-shrink-0 bg-gray-900 flex items-center justify-center"
               style="width:var(--sz);height:var(--sz)">
            ${img(q.imageUrl, 'max-w-full max-h-full object-contain')
              ?? `<div class="text-center p-8 text-3xl font-bold text-white leading-snug">${escapeHtml(q.text)}</div>`}
          </div>

          <!-- Panel: same structure as chess panel -->
          <div class="w-[360px] flex-shrink-0 bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden"
               style="height:var(--sz)">

            <!-- Question text + show-answer / answer -->
            <div class="px-4 py-4 border-b border-gray-800 flex-shrink-0 flex flex-col gap-3">
              <div class="text-lg font-semibold text-center leading-snug">
                ${escapeHtml(q.text)}
              </div>
              <button id="btn-show-answer"
                class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition">
                Показать ответ
              </button>
              <div id="answer-block" class="hidden">
                <div class="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
                  <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Ответ</div>
                  <div class="text-base font-bold text-green-400">${escapeHtml(q.answer ?? '')}</div>
                </div>
              </div>
            </div>

            <!-- Characters: column -->
            <div class="flex-1 min-h-0 flex flex-col items-center justify-evenly px-6 py-2 overflow-hidden">
              <div class="flex flex-col items-center gap-1 w-full">
                <div class="${charBoxCls(cur)}">
                  ${renderCharImg(cur)}
                </div>
                ${renderCharMeta(cur)}
              </div>
              <div class="text-gray-600 text-base">↓</div>
              <div class="flex flex-col items-center gap-1 w-full">
                <div class="${charBoxCls(next)}">
                  ${next ? renderCharImg(next, true) : `<span class="text-3xl">🏆</span>`}
                </div>
                ${next ? renderCharMeta(next, true) : `<div class="text-xs text-gray-500 text-center">Финал!</div>`}
              </div>
            </div>

            <!-- Bottom: controls -->
            <div class="px-4 py-3 border-t border-gray-800 flex-shrink-0 space-y-2 relative">
              <div id="nav-lock-indicator" class="hidden absolute -top-5 left-0 right-0 text-xs text-yellow-500 text-center">🔒 Заблокировано</div>
              <div id="answer-buttons" class="hidden items-center gap-1.5">
                <button id="btn-correct" class="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-xl text-2xl transition flex items-center justify-center disabled:opacity-30">✔</button>
                <button id="btn-wrong"   class="flex-1 h-12 bg-gray-800 hover:bg-gray-700 text-red-400   rounded-xl text-2xl transition flex items-center justify-center disabled:opacity-30">✕</button>
              </div>
              ${bottomControls('h-10')}
            </div>

          </div>
        </div>
      </div>`;
  }

  // Mount chess board if question has FEN
  if (q.fen) {
    const container = el.querySelector('#board-container') as HTMLElement;
    boardApi = mountBoard(container, q.fen, q.boardOrientation ?? 'white');
    navChess = new Chess(q.fen);
    if (navChess.inCheck()) {
      boardApi.set({ check: navChess.turn() === 'w' ? 'white' : 'black' });
    }
  }

  // Navigation helpers (solution replay via chess.js)
  const totalPositions = (q.solutionMovesUci?.length ?? 0) + 1; // start + one per move

  let navLocked = false;

  const updateNavDisplay = () => {
    const pos = el.querySelector('#nav-pos');
    if (pos) pos.textContent = `${boardMoveIdx + 1} / ${totalPositions}`;
    (el.querySelector('#btn-nav-prev') as HTMLButtonElement | null)?.toggleAttribute('disabled', navLocked || boardMoveIdx <= 0);
    (el.querySelector('#btn-nav-next') as HTMLButtonElement | null)?.toggleAttribute('disabled', navLocked || boardMoveIdx >= totalPositions - 1);
  };

  const setNavLock = (locked: boolean) => {
    navLocked = locked;
    updateNavDisplay();
    (el.querySelector('#btn-correct') as HTMLButtonElement | null)?.toggleAttribute('disabled', locked);
    (el.querySelector('#btn-wrong')   as HTMLButtonElement | null)?.toggleAttribute('disabled', locked);
    el.querySelector('#nav-lock-indicator')?.classList.toggle('hidden', !locked);
  };

  const applyBoardMove = (targetIdx: number) => {
    if (!boardApi || !navChess || !q.solutionMovesUci) return;
    targetIdx = Math.max(0, Math.min(targetIdx, q.solutionMovesUci.length));
    if (targetIdx < boardMoveIdx) {
      for (let i = boardMoveIdx; i > targetIdx; i--) navChess.undo();
    } else {
      for (let i = boardMoveIdx; i < targetIdx; i++) {
        const uci = q.solutionMovesUci[i]!;
        navChess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      }
    }
    boardMoveIdx = targetIdx;
    const lastUci = boardMoveIdx > 0 ? q.solutionMovesUci[boardMoveIdx - 1]! : null;
    const lm: Key[] | undefined = lastUci
      ? [lastUci.slice(0, 2) as Key, lastUci.slice(2, 4) as Key]
      : undefined;
    const inCheck = navChess.inCheck() ? (navChess.turn() === 'w' ? 'white' : 'black') : false;
    boardApi.set({ fen: navChess.fen(), lastMove: lm, check: inCheck });
    updateNavDisplay();
  };

  if (q.solutionMovesUci && q.solutionMovesUci.length > 0) {
    el.querySelector('#btn-nav-prev')?.addEventListener('click', () => applyBoardMove(boardMoveIdx - 1));
    el.querySelector('#btn-nav-next')?.addEventListener('click', () => applyBoardMove(boardMoveIdx + 1));
  }

  navKeyHandler = (e: KeyboardEvent) => {
    if ((e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setNavLock(!navLocked);
    }
  };
  document.addEventListener('keydown', navKeyHandler);

  // Events
  el.querySelector('#btn-show-answer')?.addEventListener('click', () => {
    el.querySelector('#btn-show-answer')?.classList.add('hidden');
    el.querySelector('#answer-block')?.classList.remove('hidden');
    const ab = el.querySelector('#answer-buttons') as HTMLElement | null;
    if (ab) { ab.classList.remove('hidden'); ab.classList.add('flex'); }
  });

  el.querySelector('#btn-correct')?.addEventListener('click', () => handleAnswer(true));
  el.querySelector('#btn-wrong')?.addEventListener('click', () => handleAnswer(false));

  el.querySelector('#btn-all-chars')?.addEventListener('click', () => showAllCharactersOverlay());

  el.querySelector('#btn-exit')?.addEventListener('click', () => {
    showModal('Выйти из игры? Прогресс сохранён.', () => {
      if (navKeyHandler) { document.removeEventListener('keydown', navKeyHandler); navKeyHandler = null; }
      _nav('home');
    });
  });

}

// ── All Characters Overlay ─────────────────────────────────────────────────

function showAllCharactersOverlay(): void {
  if (!game) return;

  document.getElementById('all-chars-overlay')?.remove();

  const chars   = game.characterSet.characters;
  const maxCost = chars[chars.length - 1]?.cost ?? 0;

  const overlay = document.createElement('div');
  overlay.id = 'all-chars-overlay';
  overlay.className =
    'fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4';

  const imgTag = (url: string | undefined, unlocked: boolean) => {
    const safe = url ? sanitizeImageUrl(url) : '';
    const cls  = `w-24 h-24 object-contain rounded-xl mb-2 ${unlocked ? '' : 'grayscale opacity-30'}`;
    const fallbackCls = `w-24 h-24 rounded-xl mb-2 flex items-center justify-center text-4xl
      ${unlocked ? 'bg-gray-700' : 'bg-gray-800 opacity-30'}`;
    return safe
      ? `<img src="${safe}" alt="" class="${cls}" />`
      : `<div class="${fallbackCls}">${unlocked ? '👤' : '🔒'}</div>`;
  };

  overlay.innerHTML = `
    <div class="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <div class="font-bold text-lg">Все персонажи</div>
          <div class="text-xs text-gray-400 mt-0.5">
            Набрано: <span class="text-yellow-400 font-bold">★ ${game.totalStars}</span>
            &nbsp;·&nbsp;
            Для всех: <span class="text-gray-300 font-semibold">★ ${maxCost}</span>
          </div>
        </div>
        <button id="btn-close-overlay"
          class="text-gray-400 hover:text-white text-2xl leading-none transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800">
          ×
        </button>
      </div>

      <!-- Overall progress bar -->
      <div class="px-5 py-3 border-b border-gray-800">
        <div class="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Общий прогресс</span>
          <span>${Math.round(Math.min(100, (game.totalStars / (maxCost || 1)) * 100))}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div class="bg-yellow-400 h-2.5 rounded-full transition-all"
            style="width:${Math.min(100, (game.totalStars / (maxCost || 1)) * 100)}%"></div>
        </div>
      </div>

      <!-- Characters grid -->
      <div class="grid grid-cols-4 gap-4 p-5 overflow-y-auto flex-1">
        ${chars.map((c, i) => {
          const unlocked = i <= game!.unlockedUpTo;
          return `
            <div class="flex flex-col items-center rounded-xl p-3
              ${unlocked
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-gray-900 border border-gray-800'}">
              ${imgTag(c.imageUrl, unlocked)}
              <div class="text-xs font-semibold text-center leading-tight
                ${unlocked ? 'text-white' : 'text-gray-600'}">
                ${escapeHtml(c.name)}
              </div>
              <div class="text-xs mt-1 ${unlocked ? 'text-yellow-400' : 'text-gray-700'}">
                ${unlocked ? '✓' : '🔒'} ★ ${c.cost}
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  const closeOverlay = () => { overlay.remove(); };
  overlay.querySelector('#btn-close-overlay')?.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
}

// ── Timer ──────────────────────────────────────────────────────────────────

// ── Answer Handling ────────────────────────────────────────────────────────

function handleAnswer(correct: boolean): void {
  if (!game) return;
  // Prevent double-click
  (document.getElementById('btn-correct') as HTMLButtonElement | null)?.toggleAttribute('disabled', true);
  (document.getElementById('btn-wrong')   as HTMLButtonElement | null)?.toggleAttribute('disabled', true);

  if (correct) {
    game.totalStars += game.pack.starsPerCorrect;

    const chars = game.characterSet.characters;
    let justUnlocked: Character | null = null;
    while (
      game.unlockedUpTo + 1 < chars.length &&
      game.totalStars >= chars[game.unlockedUpTo + 1]!.cost
    ) {
      game.unlockedUpTo++;
      justUnlocked = chars[game.unlockedUpTo]!;
    }

    upsertSave(game);

    if (justUnlocked) {
      const allUnlocked = game.unlockedUpTo >= chars.length - 1;
      const onContinue  = allUnlocked
        ? () => { game!.currentIndex++; deleteSave(game!.id); renderResults(); _nav('results'); }
        : () => advanceQuestion();
      showUnlockOverlay(justUnlocked, onContinue);
      return;
    }
  }

  advanceQuestion();
}

function showUnlockOverlay(char: Character, onContinue: () => void): void {
  const overlay = document.createElement('div');
  overlay.className =
    'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50';

  const safeUrl = char.imageUrl ? sanitizeImageUrl(char.imageUrl) : '';

  overlay.innerHTML = `
    <div class="text-center px-6">
      <div class="text-6xl mb-4">🎉</div>
      <div class="text-yellow-400 text-3xl font-black mb-4">Новый персонаж!</div>
      ${safeUrl
        ? `<img src="${safeUrl}" alt="${escapeHtml(char.name)}"
             class="w-36 h-36 object-contain mx-auto mb-4 rounded-2xl" />`
        : `<div class="w-36 h-36 bg-gray-700 rounded-2xl mx-auto mb-4 flex items-center justify-center text-6xl">⭐</div>`}
      <div class="text-3xl font-bold text-white mb-1">${escapeHtml(char.name)}</div>
      <div class="text-gray-400 text-sm mb-8">Открыт за ${char.cost} звёзд</div>
      <button id="btn-unlock-ok"
        class="py-3 px-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl text-lg transition">
        Продолжить
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#btn-unlock-ok')?.addEventListener('click', () => {
    overlay.remove();
    onContinue();
  });
}

function advanceQuestion(): void {
  if (!game) return;
  game.currentIndex++;

  if (game.currentIndex >= game.shuffledQuestions.length) {
    const allUnlocked = game.unlockedUpTo >= game.characterSet.characters.length - 1;
    if (!allUnlocked && game.spareQuestions.length > 0) {
      // Добираем одну случайную задачу из запасного пула
      const spare = game.spareQuestions.shift();
      if (spare) game.shuffledQuestions.push(spare);
    } else {
      deleteSave(game.id);
      renderResults();
      _nav('results');
      return;
    }
  }

  upsertSave(game);
  renderGameScreen();
}

// ── Results Screen ─────────────────────────────────────────────────────────

function renderResults(): void {
  if (!game) return;
  if (navKeyHandler) { document.removeEventListener('keydown', navKeyHandler); navKeyHandler = null; }

  const el        = document.getElementById('screen-results')!;
  const chars     = game.characterSet.characters;
  const unlocked  = game.unlockedUpTo >= 0 ? chars.slice(0, game.unlockedUpTo + 1) : [];
  const finalChar = game.unlockedUpTo >= 0 ? (chars[game.unlockedUpTo] ?? null) : null;

  const imgTag = (url: string | undefined, cls: string) => {
    const safe = url ? sanitizeImageUrl(url) : '';
    return safe
      ? `<img src="${safe}" alt="" class="${cls}" />`
      : `<div class="${cls} bg-gray-700 flex items-center justify-center text-4xl">⭐</div>`;
  };

  el.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">
      <div class="text-6xl mb-3">🏆</div>
      <h1 class="text-3xl font-black text-yellow-400 mb-1">Игра завершена!</h1>
      <div class="text-gray-400 mb-8 text-sm">
        ${game.currentIndex} / ${game.shuffledQuestions.length} вопросов · ${game.totalStars} звёзд набрано
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center w-full max-w-xs mb-6">
        <div class="text-xs text-gray-400 uppercase tracking-wider mb-3">Финальный персонаж</div>
        ${finalChar
          ? `${imgTag(finalChar.imageUrl, 'w-32 h-32 object-contain mx-auto mb-3 rounded-xl')}
             <div class="text-2xl font-bold">${escapeHtml(finalChar.name)}</div>`
          : `<div class="w-32 h-32 bg-gray-800 rounded-xl mx-auto mb-3 flex items-center justify-center text-5xl">😔</div>
             <div class="text-xl font-bold text-gray-500">Ни одного не открыто</div>`}
        <div class="text-yellow-400 mt-1 text-sm">★ ${game.totalStars}</div>
      </div>

      ${unlocked.length > 1 ? `
        <div class="w-full max-w-md mb-8">
          <div class="text-xs text-gray-500 uppercase tracking-wider text-center mb-3">
            Открыто: ${unlocked.length} / ${chars.length}
          </div>
          <div class="flex flex-wrap gap-2 justify-center">
            ${unlocked.map(c => `
              <div class="flex flex-col items-center bg-gray-900 border border-gray-800 rounded-xl p-2 w-20">
                ${imgTag(c.imageUrl, 'w-12 h-12 object-contain rounded-lg')}
                <div class="text-xs text-center text-gray-300 mt-1 leading-tight">${escapeHtml(c.name)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <button id="btn-home"
        class="py-3 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition">
        На главную
      </button>
    </div>
  `;

  el.querySelector('#btn-home')?.addEventListener('click', () => {
    game = null;
    _nav('home');
  });
}
