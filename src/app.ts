import type { Screen } from './types';
import {
  setNav as gameSetNav,
  renderSetup, resumeGame, hasActiveSave, preload,
} from './game';
import {
  setNav as editorSetNav,
  renderPackEditor, renderCharacterEditor,
} from './editor';
import { loadSaves, deleteSave } from './storage';
import { escapeHtml, formatTime, showModal } from './utils';

// ── Navigation ─────────────────────────────────────────────────────────────

const ALL_SCREENS: Screen[] = [
  'home', 'setup', 'game', 'results', 'pack-editor', 'character-editor',
];

function getEl(screen: Screen): HTMLElement {
  return document.getElementById(`screen-${screen}`)!;
}

function navigateTo(screen: Screen): void {
  ALL_SCREENS.forEach(s => getEl(s).classList.add('hidden'));
  getEl(screen).classList.remove('hidden');

  if      (screen === 'home')             renderHome();
  else if (screen === 'setup')            renderSetup(getEl('setup'));
  else if (screen === 'pack-editor')      renderPackEditor(getEl('pack-editor'));
  else if (screen === 'character-editor') renderCharacterEditor(getEl('character-editor'));
}

// ── Home Screen ────────────────────────────────────────────────────────────

function renderHome(): void {
  const el      = getEl('home');
  const hasSave = hasActiveSave();

  el.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-950">

      <div class="text-8xl mb-4 select-none">🎯</div>
      <h1 class="text-5xl font-black tracking-tight mb-2">Level Up</h1>
      <p class="text-gray-400 mb-12 text-center text-sm">
        Отвечай на вопросы — открывай новых персонажей!
      </p>

      <div class="w-full max-w-xs space-y-3">

        <button id="btn-new"
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xl transition shadow-lg shadow-indigo-900/30">
          Новая игра
        </button>

        ${hasSave ? `
          <button id="btn-continue"
            class="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-bold text-xl transition shadow-lg shadow-yellow-900/30">
            Продолжить
          </button>
        ` : ''}

        <button id="btn-pack-ed"
          class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition">
          Редактор вопросов
        </button>

        <button id="btn-char-ed"
          class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold transition">
          Редактор персонажей
        </button>

      </div>
    </div>
  `;

  el.querySelector('#btn-new')?.addEventListener('click', () => navigateTo('setup'));
  el.querySelector('#btn-continue')?.addEventListener('click', () => showSavePicker());
  el.querySelector('#btn-pack-ed')?.addEventListener('click', () => navigateTo('pack-editor'));
  el.querySelector('#btn-char-ed')?.addEventListener('click', () => navigateTo('character-editor'));
}

// ── Save Picker ────────────────────────────────────────────────────────────

function showSavePicker(): void {
  document.getElementById('save-picker-overlay')?.remove();

  const saves = loadSaves();
  if (saves.length === 0) { renderHome(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'save-picker-overlay';
  overlay.className =
    'fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4';

  const renderList = () => {
    const current = loadSaves();
    return current.length === 0
      ? `<div class="text-gray-500 text-center py-8 text-sm">Нет сохранений</div>`
      : current.map(s => `
          <div class="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-start gap-4">
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white truncate">${escapeHtml(s.playerName || 'Без имени')}</div>
              <div class="text-sm text-gray-400 mt-0.5">${escapeHtml(s.packTitle)}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                ${s.charName ? escapeHtml(s.charName) + ' · ' : ''}Вопрос ${escapeHtml(s.questionProgress)}
              </div>
              <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span class="text-yellow-400">★ ${s.totalStars}</span>
                <span>${formatTime(s.savedAt)}</span>
              </div>
            </div>
            <div class="flex flex-col gap-2 flex-shrink-0">
              <button data-resume="${s.id}"
                class="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
                ▶ Играть
              </button>
              <button data-delete="${s.id}"
                class="py-1.5 px-4 bg-gray-700 hover:bg-red-800 text-gray-300 hover:text-white rounded-lg text-sm transition">
                Удалить
              </button>
            </div>
          </div>
        `).join('');
  };

  overlay.innerHTML = `
    <div class="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <h2 class="text-lg font-bold">Продолжить игру</h2>
        <button id="sp-close"
          class="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 transition">
          ×
        </button>
      </div>
      <div id="sp-list" class="p-4 space-y-3 max-h-96 overflow-y-auto">
        ${renderList()}
      </div>
    </div>
  `;

  const bindEvents = () => {
    overlay.querySelectorAll<HTMLElement>('[data-resume]').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.remove();
        resumeGame(btn.dataset['resume']!);
      });
    });

    overlay.querySelectorAll<HTMLElement>('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        showModal('Удалить это сохранение?', () => {
          deleteSave(btn.dataset['delete']!);
          const list = overlay.querySelector('#sp-list');
          if (list) list.innerHTML = renderList();
          bindEvents();
          if (loadSaves().length === 0) { overlay.remove(); renderHome(); }
        });
      });
    });
  };

  bindEvents();

  overlay.querySelector('#sp-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.body.appendChild(overlay);
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  gameSetNav(navigateTo);
  editorSetNav(navigateTo);
  await preload();
  navigateTo('home');
}

document.addEventListener('DOMContentLoaded', () => { void init(); });
