import type { GameState, QuestionPack, CharacterSet, Character, Screen } from './types';
import { escapeHtml, sanitizeImageUrl, showModal } from './utils';
import {
  loadPacks, loadCharacterSets,
  loadBuiltinPacks, loadBuiltinCharacterSets,
  upsertSave, deleteSave, loadSaves,
} from './storage';

// ── State ──────────────────────────────────────────────────────────────────

let game: GameState | null = null;
let timerInterval: number | null = null;
let timerRemaining = 0;
let _nav: (s: Screen) => void = () => { /* no-op until app sets it */ };

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

        <div>
          <label class="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">Таймер на вопрос (сек, 0 = без таймера)</label>
          <input id="inp-timer" type="number" min="0" max="300" value="0"
            class="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:outline-none focus:border-indigo-500" />
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

      if (unlockable === 0) {
        warning.innerHTML = `<div class="mt-2 px-3 py-2 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
          ⛔ Нельзя открыть ни одного персонажа — макс. ${maxStars}★, а самый дешёвый стоит ${sorted[0]?.cost ?? 0}★
        </div>`;
      } else if (maxStars < maxNeeded) {
        warning.innerHTML = `<div class="mt-2 px-3 py-2 bg-yellow-950 border border-yellow-800 rounded-xl text-yellow-300 text-xs">
          ⚠ Можно открыть ${unlockable} из ${sorted.length} персонажей (макс. ${maxStars}★, нужно ${maxNeeded}★)
        </div>`;
      } else {
        warning.innerHTML = `<div class="mt-2 px-3 py-2 bg-green-950 border border-green-800 rounded-xl text-green-400 text-xs">
          ✓ Все ${sorted.length} ${ruWord(sorted.length, 'персонаж', 'персонажа', 'персонажей')} открываемы (макс. ${maxStars}★ при нужных ${maxNeeded}★)
        </div>`;
      }
    };

    selPack.addEventListener('change', updateCompat);
    selChars.addEventListener('change', updateCompat);
    updateCompat();

    el.querySelector('#btn-start')?.addEventListener('click', () => {
      const playerName = ((el.querySelector('#inp-name') as HTMLInputElement).value).trim();
      const packIdx    = parseInt(selPack.value);
      const setIdx     = parseInt(selChars.value);
      const timer      = Math.max(0, parseInt((el.querySelector('#inp-timer') as HTMLInputElement).value) || 0);
      startGame(packs[packIdx]!, sets[setIdx]!, timer, playerName);
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

function startGame(pack: QuestionPack, characterSet: CharacterSet, timerSeconds: number, playerName: string): void {
  const sortedChars = [...characterSet.characters].sort((a, b) => a.cost - b.cost);
  game = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    playerName,
    pack,
    characterSet: { ...characterSet, characters: sortedChars },
    shuffledQuestions: shuffle(pack.questions),
    currentIndex: 0,
    totalStars: 0,
    timerSeconds,
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
  _nav('game');
  renderGameScreen();
}

// ── Game Screen ────────────────────────────────────────────────────────────

function renderGameScreen(): void {
  if (!game) return;

  stopTimer();

  const el    = document.getElementById('screen-game')!;
  const chars = game.characterSet.characters;
  const cur   = game.unlockedUpTo >= 0 ? (chars[game.unlockedUpTo] ?? null) : null;
  const next  = chars[game.unlockedUpTo + 1] ?? null;
  const q     = game.shuffledQuestions[game.currentIndex]!;

  const prevCost = cur?.cost ?? 0;
  const nextCost = next?.cost ?? prevCost;
  const progressPct = next
    ? Math.min(100, Math.max(0, ((game.totalStars - prevCost) / (nextCost - prevCost)) * 100))
    : 100;
  const starsToNext = next ? Math.max(0, next.cost - game.totalStars) : 0;

  const img = (url?: string, cls = '') => {
    const safe = url ? sanitizeImageUrl(url) : '';
    return safe ? `<img src="${safe}" alt="" class="${cls}" />` : null;
  };

  el.innerHTML = `
    <div class="h-screen flex flex-col bg-gray-950">

      <!-- Main -->
      <div class="flex flex-1 min-h-0">

        <!-- Center: question -->
        <div class="flex-1 flex flex-col items-center justify-center gap-5 p-8 overflow-y-auto">

          ${game.timerSeconds > 0
            ? `<div id="timer-display" class="text-6xl font-black text-white leading-none">${game.timerSeconds}</div>`
            : ''}

          ${img(q.imageUrl, 'max-h-[55vh] max-w-full w-full object-contain rounded-2xl') ?? ''}

          <div class="text-2xl font-semibold text-center max-w-2xl leading-relaxed">
            ${escapeHtml(q.text)}
          </div>

          <button id="btn-show-answer"
            class="py-3 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition">
            Показать ответ
          </button>

          <div id="answer-block" class="hidden w-full max-w-xl flex flex-col gap-4">
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <div class="text-xs text-gray-400 uppercase tracking-wider mb-1">Ответ</div>
              <div class="text-xl font-bold text-green-400">${escapeHtml(q.answer)}</div>
            </div>
            <div class="flex gap-3">
              <button id="btn-wrong"
                class="flex-1 py-4 bg-red-700 hover:bg-red-600 text-white rounded-2xl font-bold text-lg transition shadow-lg shadow-red-950/50 flex flex-col items-center gap-0.5">
                <span class="text-2xl">✕</span>
                <span>Неверно</span>
              </button>
              <button id="btn-correct"
                class="flex-1 py-4 bg-green-700 hover:bg-green-600 text-white rounded-2xl font-bold text-lg transition shadow-lg shadow-green-950/50 flex flex-col items-center gap-0.5">
                <span class="text-2xl">✓</span>
                <span>Правильно +${game.pack.starsPerCorrect}★</span>
              </button>
            </div>
          </div>

        </div>

        <!-- Right panel: character progression -->
        <div class="w-[27%] flex-shrink-0 bg-gray-900 border-l border-gray-800 flex flex-col">

          <!-- Stars -->
          <div class="px-4 py-3 border-b border-gray-800 text-center flex-shrink-0">
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-1">Звёзды</div>
            <div class="text-yellow-400 font-black text-4xl">★ ${game.totalStars}</div>
          </div>

          <!-- Current character -->
          <div class="flex-1 flex flex-col items-center px-4 pt-3 pb-2 min-h-0">
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-2 flex-shrink-0">Текущий</div>
            <div class="flex-1 w-full min-h-0 flex items-center justify-center">
              ${cur
                ? (() => { const s = cur.imageUrl ? sanitizeImageUrl(cur.imageUrl) : '';
                    return s
                      ? `<img src="${s}" alt="" class="max-h-full max-w-full object-contain rounded-3xl" />`
                      : `<div class="w-full h-full bg-gray-700 rounded-3xl flex items-center justify-center text-7xl">♟</div>`; })()
                : `<div class="w-full h-full bg-gray-800 rounded-3xl flex items-center justify-center text-6xl opacity-40">🔒</div>`}
            </div>
            ${cur
              ? `<div class="font-black text-xl text-center mt-2 flex-shrink-0">${escapeHtml(cur.name)}</div>
                 <div class="text-yellow-400 text-sm mt-0.5 flex-shrink-0">★ ${cur.cost}</div>`
              : `<div class="text-gray-600 text-sm mt-2 flex-shrink-0">Ещё не открыто</div>`}
          </div>

          <!-- Progress bar -->
          <div class="px-4 py-2 flex-shrink-0">
            ${next
              ? `<div class="text-xs text-gray-500 text-center mb-1.5">До ${escapeHtml(next.name)}: ${starsToNext}★</div>
                 <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                   <div class="bg-yellow-400 h-3 rounded-full transition-all duration-500" style="width:${progressPct}%"></div>
                 </div>`
              : `<div class="text-center text-yellow-400 font-bold text-sm">✦ Максимум достигнут! ✦</div>`}
          </div>

          <!-- Next character -->
          <div class="flex-1 flex flex-col items-center px-4 pt-2 pb-3 border-t border-gray-800 min-h-0">
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-2 flex-shrink-0">Следующий</div>
            <div class="flex-1 w-full min-h-0 flex items-center justify-center">
              ${next
                ? (() => { const s = next.imageUrl ? sanitizeImageUrl(next.imageUrl) : '';
                    return s
                      ? `<img src="${s}" alt="" class="max-h-full max-w-full object-contain rounded-3xl opacity-35 grayscale" />`
                      : `<div class="w-full h-full bg-gray-800 rounded-3xl flex items-center justify-center text-7xl opacity-35">🔒</div>`; })()
                : `<div class="w-full h-full bg-gray-800 rounded-3xl flex items-center justify-center text-8xl">🏆</div>`}
            </div>
            ${next
              ? `<div class="font-bold text-lg text-center mt-2 text-gray-400 flex-shrink-0">${escapeHtml(next.name)}</div>
                 <div class="text-yellow-400 text-sm mt-0.5 opacity-50 flex-shrink-0">★ ${next.cost}</div>`
              : `<div class="font-bold text-lg text-center mt-2 text-gray-500 flex-shrink-0">Финал!</div>`}
          </div>

          <!-- Bottom controls -->
          <div class="px-4 pb-4 flex-shrink-0 border-t border-gray-800 pt-3 space-y-2">
            <button id="btn-all-chars"
              class="w-full h-11 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition border border-gray-700 hover:border-gray-500 flex items-center justify-center gap-2">
              <span class="text-lg">🏅</span> Все персонажи
            </button>

            <div class="flex gap-2">
              <!-- Question progress -->
              <div class="relative flex-1 h-11 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
                <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 transition-all duration-500"
                  style="width:${Math.round(((game.currentIndex + 1) / game.shuffledQuestions.length) * 100)}%"></div>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white drop-shadow">
                  ${game.currentIndex + 1} / ${game.shuffledQuestions.length}
                </span>
              </div>

              <!-- Exit -->
              <button id="btn-exit"
                class="h-11 px-4 bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-300 rounded-xl font-semibold text-sm transition border border-gray-700 hover:border-red-800 flex-shrink-0">
                Выход
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  // Events
  el.querySelector('#btn-show-answer')?.addEventListener('click', () => {
    el.querySelector('#btn-show-answer')?.classList.add('hidden');
    el.querySelector('#answer-block')?.classList.remove('hidden');
    stopTimer();
  });

  el.querySelector('#btn-correct')?.addEventListener('click', () => handleAnswer(true));
  el.querySelector('#btn-wrong')?.addEventListener('click', () => handleAnswer(false));

  el.querySelector('#btn-all-chars')?.addEventListener('click', () => showAllCharactersOverlay());

  el.querySelector('#btn-exit')?.addEventListener('click', () => {
    showModal('Выйти из игры? Прогресс сохранён.', () => {
      stopTimer();
      _nav('home');
    });
  });

  if (game.timerSeconds > 0) startTimer(game.timerSeconds);
}

// ── All Characters Overlay ─────────────────────────────────────────────────

function showAllCharactersOverlay(): void {
  if (!game) return;

  document.getElementById('all-chars-overlay')?.remove();

  // Pause timer while overlay is open; resume on close if it was ticking
  const wasTimerRunning = timerInterval !== null;
  const savedRemaining  = timerRemaining;
  stopTimer();

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
      : `<div class="${fallbackCls}">${unlocked ? '♟' : '🔒'}</div>`;
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

  const closeOverlay = () => {
    overlay.remove();
    if (wasTimerRunning && savedRemaining > 0) startTimer(savedRemaining);
  };
  overlay.querySelector('#btn-close-overlay')?.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
}

// ── Timer ──────────────────────────────────────────────────────────────────

function startTimer(seconds: number): void {
  stopTimer();
  timerRemaining = seconds;
  updateTimerDisplay();
  timerInterval = window.setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();
    if (timerRemaining <= 0) {
      stopTimer();
      document.getElementById('btn-show-answer')?.classList.add('hidden');
      document.getElementById('answer-block')?.classList.remove('hidden');
    }
  }, 1000);
}

function stopTimer(): void {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay(): void {
  const el = document.getElementById('timer-display');
  if (!el) return;
  el.textContent = String(timerRemaining);
  if      (timerRemaining <= 5)  el.className = 'text-6xl font-black text-red-500 leading-none';
  else if (timerRemaining <= 10) el.className = 'text-6xl font-black text-yellow-400 leading-none';
  else                           el.className = 'text-6xl font-black text-white leading-none';
}

// ── Answer Handling ────────────────────────────────────────────────────────

function handleAnswer(correct: boolean): void {
  if (!game) return;
  stopTimer();

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
    deleteSave(game.id);
    renderResults();
    _nav('results');
    return;
  }

  upsertSave(game);
  renderGameScreen();
}

// ── Results Screen ─────────────────────────────────────────────────────────

function renderResults(): void {
  if (!game) return;

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
