import type { QuestionPack, Question, CharacterSet, Character, Screen } from './types';
import { escapeHtml, sanitizeImageUrl, showModal, downloadJson } from './utils';
import { loadPacks, savePacks, loadCharacterSets, saveCharacterSets } from './storage';

let _nav: (s: Screen) => void = () => { /* no-op */ };

export function setNav(fn: (s: Screen) => void): void {
  _nav = fn;
}

// ══════════════════════════════════════════════════════════════
// PACK EDITOR
// ══════════════════════════════════════════════════════════════

interface PackState {
  packs: QuestionPack[];
  view: 'list' | 'edit';
  editIdx: number;       // -1 = new
  pack: QuestionPack;
  expandedQ: number;     // -1 = none
}

let ps: PackState = newPackState();

function newPackState(): PackState {
  return {
    packs: [],
    view: 'list',
    editIdx: -1,
    pack: { title: '', questions: [], starsPerCorrect: 3 },
    expandedQ: -1,
  };
}

export function renderPackEditor(el: HTMLElement): void {
  ps = newPackState();
  ps.packs = loadPacks();
  drawPack(el);
}

function drawPack(el: HTMLElement): void {
  if (ps.view === 'list') drawPackList(el);
  else drawPackEdit(el);
}

// ── Pack List ──────────────────────────────────────────────────

function drawPackList(el: HTMLElement): void {
  el.innerHTML = `
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="pe-back" class="text-gray-400 hover:text-white transition text-sm">← Назад</button>
        <h1 class="text-xl font-bold flex-1">Редактор вопросов</h1>
        <label class="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition">
          Импорт
          <input id="pe-import" type="file" accept=".json" class="hidden" />
        </label>
        <button id="pe-new" class="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
          + Новый пакет
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full">
        ${ps.packs.length === 0
          ? `<div class="text-gray-500 text-center mt-20 text-sm">Нет пакетов. Создайте первый!</div>`
          : ps.packs.map((p, i) => `
            <div class="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${escapeHtml(p.title)}</div>
                <div class="text-xs text-gray-400">${p.questions.length} вопросов · ${p.starsPerCorrect}★ за ответ</div>
              </div>
              <button data-edit="${i}" class="text-sm text-indigo-400 hover:text-indigo-300 transition">Изменить</button>
              <button data-copy="${i}" class="text-sm text-green-400 hover:text-green-300 transition">Копировать</button>
              <button data-export="${i}" class="text-sm text-gray-400 hover:text-gray-300 transition">Экспорт</button>
              <button data-del="${i}" class="text-sm text-red-400 hover:text-red-300 transition">Удалить</button>
            </div>
          `).join('')}
      </div>

    </div>
  `;

  el.querySelector('#pe-back')?.addEventListener('click', () => _nav('home'));

  el.querySelector('#pe-new')?.addEventListener('click', () => {
    ps.editIdx = -1;
    ps.pack = { title: '', questions: [], starsPerCorrect: 3 };
    ps.view = 'edit';
    ps.expandedQ = -1;
    drawPack(el);
  });

  el.querySelector('#pe-import')?.addEventListener('change', e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (
          !data.title ||
          !Array.isArray(data.questions) ||
          typeof data.starsPerCorrect !== 'number' ||
          !data.questions.every((q: unknown) => {
            const qq = q as Record<string, unknown>;
            return qq && typeof qq['text'] === 'string' &&
              (qq['answer'] === undefined || typeof qq['answer'] === 'string');
          })
        ) throw new Error();
        ps.packs.push(data as QuestionPack);
        savePacks(ps.packs);
        drawPackList(el);
      } catch {
        showModal('Неверный формат файла');
      }
    };
    reader.readAsText(file);
  });

  el.querySelectorAll<HTMLElement>('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['edit']!);
      ps.editIdx = i;
      ps.pack = structuredClone(ps.packs[i]);
      ps.view = 'edit';
      ps.expandedQ = -1;
      drawPack(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['export']!);
      downloadJson(ps.packs[i]!, `${ps.packs[i]!.title || 'pack'}.json`);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['del']!);
      showModal(`Удалить пакет «${escapeHtml(ps.packs[i]!.title)}»?`, () => {
        ps.packs.splice(i, 1);
        savePacks(ps.packs);
        drawPackList(el);
      });
    });
  });

  el.querySelectorAll<HTMLElement>('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['copy']!);
      const copy: QuestionPack = structuredClone(ps.packs[i]);
      copy.title += ' (копия)';
      ps.packs.push(copy);
      savePacks(ps.packs);
      drawPackList(el);
    });
  });
}

// ── Pack Edit ──────────────────────────────────────────────────

function drawPackEdit(el: HTMLElement): void {
  const p = ps.pack;
  el.innerHTML = `
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="pe-edit-back" class="text-gray-400 hover:text-white transition text-sm">← Назад</button>
        <h1 class="text-xl font-bold flex-1">${ps.editIdx === -1 ? 'Новый пакет' : 'Редактировать пакет'}</h1>
        <button id="pe-save" class="py-2 px-4 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition">
          Сохранить
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider">Название пакета</label>
            <input id="pe-title" type="text" value="${escapeHtml(p.title)}" placeholder="Введите название..."
              class="w-full bg-gray-800 text-white rounded-xl px-4 py-2 mt-1 border border-gray-700 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="text-xs text-gray-400 uppercase tracking-wider">Звёзд за правильный ответ</label>
            <input id="pe-stars" type="number" min="1" max="100" value="${p.starsPerCorrect}"
              class="w-full bg-gray-800 text-white rounded-xl px-4 py-2 mt-1 border border-gray-700 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-400 uppercase tracking-wider font-semibold">Вопросы (${p.questions.length})</div>
          <button id="pe-add-q" class="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
            + Добавить
          </button>
        </div>

        <div id="pe-qlist">${renderQList(p.questions)}</div>

        ${ps.editIdx !== -1 ? `
          <button id="pe-del-pack"
            class="w-full py-3 rounded-xl font-semibold transition text-red-400 hover:text-red-300 border border-red-900 hover:bg-red-900/20">
            Удалить пакет
          </button>
        ` : ''}

      </div>
    </div>
  `;

  const titleEl = el.querySelector('#pe-title') as HTMLInputElement;
  const starsEl = el.querySelector('#pe-stars') as HTMLInputElement;
  titleEl.addEventListener('input', () => { ps.pack.title = titleEl.value; });
  starsEl.addEventListener('input', () => { ps.pack.starsPerCorrect = Math.max(1, parseInt(starsEl.value) || 1); });

  el.querySelector('#pe-edit-back')?.addEventListener('click', () => {
    ps.view = 'list';
    ps.packs = loadPacks();
    drawPack(el);
  });

  el.querySelector('#pe-save')?.addEventListener('click', () => {
    if (!ps.pack.title.trim()) { showModal('Введите название пакета'); return; }
    if (ps.editIdx === -1) ps.packs.push(ps.pack);
    else ps.packs[ps.editIdx] = ps.pack;
    savePacks(ps.packs);
    ps.view = 'list';
    drawPack(el);
  });

  el.querySelector('#pe-del-pack')?.addEventListener('click', () => {
    showModal(`Удалить пакет «${escapeHtml(ps.pack.title)}»?`, () => {
      ps.packs.splice(ps.editIdx, 1);
      savePacks(ps.packs);
      ps.view = 'list';
      drawPack(el);
    });
  });

  el.querySelector('#pe-add-q')?.addEventListener('click', () => {
    ps.pack.questions.push({ text: '', answer: '' });
    ps.expandedQ = ps.pack.questions.length - 1;
    refreshQList(el);
    setTimeout(() => {
      el.querySelector(`[data-qrow="${ps.expandedQ}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  });

  bindQEvents(el);
}

function renderQList(questions: Question[]): string {
  if (questions.length === 0)
    return `<div class="text-gray-500 text-center py-8 text-sm">Нет вопросов. Нажмите «+ Добавить».</div>`;

  return questions.map((q, i) => {
    const open = ps.expandedQ === i;
    return `
      <div data-qrow="${i}" class="bg-gray-900 border border-gray-800 rounded-xl mb-2 overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" data-qtoggle="${i}">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate ${q.text ? 'text-white' : 'text-gray-500 italic'}">
              ${q.text ? escapeHtml(q.text) : 'Без текста'}
            </div>
            <div class="text-xs text-gray-400 truncate">${q.answer ? escapeHtml(q.answer) : 'Без ответа'}</div>
          </div>
          <div class="flex gap-0.5 flex-shrink-0">
            <button data-qup="${i}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="Вверх">↑</button>
            <button data-qdn="${i}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="Вниз">↓</button>
            <button data-qdel="${i}" class="text-red-400 hover:text-red-300 text-sm transition px-2 py-1">✕</button>
          </div>
          <span class="text-gray-600 text-sm flex-shrink-0">${open ? '▲' : '▼'}</span>
        </div>
        ${open ? `
          <div class="px-4 pb-4 pt-3 space-y-2 border-t border-gray-800">
            <div>
              <label class="text-xs text-gray-400">Вопрос</label>
              <textarea data-qtext="${i}" rows="2" placeholder="Текст вопроса..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none">${escapeHtml(q.text)}</textarea>
            </div>
            <div>
              <label class="text-xs text-gray-400">Ответ</label>
              <input data-qans="${i}" type="text" value="${escapeHtml(q.answer ?? '')}" placeholder="Правильный ответ..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">Изображение (URL, необязательно)</label>
              <input data-qimg="${i}" type="text" value="${escapeHtml(q.imageUrl ?? '')}" placeholder="https://..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">FEN позиция (необязательно, для шахмат)</label>
              <input data-qfen="${i}" type="text" value="${escapeHtml(q.fen ?? '')}" placeholder="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 font-mono text-xs" />
            </div>
            <div>
              <label class="text-xs text-gray-400">Ориентация доски</label>
              <select data-qorient="${i}"
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500">
                <option value="" ${!q.boardOrientation ? 'selected' : ''}>Авто (белые снизу)</option>
                <option value="white" ${q.boardOrientation === 'white' ? 'selected' : ''}>Белые снизу</option>
                <option value="black" ${q.boardOrientation === 'black' ? 'selected' : ''}>Чёрные снизу</option>
              </select>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function refreshQList(el: HTMLElement): void {
  const list = el.querySelector('#pe-qlist');
  if (list) list.innerHTML = renderQList(ps.pack.questions);
  bindQEvents(el);
}

function bindQEvents(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>('[data-qtoggle]').forEach(row => {
    row.addEventListener('click', e => {
      const t = e.target as HTMLElement;
      if (t.hasAttribute('data-qdel') || t.hasAttribute('data-qup') || t.hasAttribute('data-qdn')) return;
      const i = parseInt(row.dataset['qtoggle']!);
      ps.expandedQ = ps.expandedQ === i ? -1 : i;
      refreshQList(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-qdel]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset['qdel']!);
      ps.pack.questions.splice(i, 1);
      if (ps.expandedQ === i) ps.expandedQ = -1;
      else if (ps.expandedQ > i) ps.expandedQ--;
      refreshQList(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-qup]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset['qup']!);
      if (i === 0) return;
      [ps.pack.questions[i - 1], ps.pack.questions[i]] = [ps.pack.questions[i]!, ps.pack.questions[i - 1]!];
      if      (ps.expandedQ === i)     ps.expandedQ = i - 1;
      else if (ps.expandedQ === i - 1) ps.expandedQ = i;
      refreshQList(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-qdn]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset['qdn']!);
      if (i >= ps.pack.questions.length - 1) return;
      [ps.pack.questions[i + 1], ps.pack.questions[i]] = [ps.pack.questions[i]!, ps.pack.questions[i + 1]!];
      if      (ps.expandedQ === i)     ps.expandedQ = i + 1;
      else if (ps.expandedQ === i + 1) ps.expandedQ = i;
      refreshQList(el);
    });
  });

  el.querySelectorAll<HTMLTextAreaElement>('[data-qtext]').forEach(ta => {
    ta.addEventListener('input', () => {
      ps.pack.questions[parseInt(ta.dataset['qtext']!)]!.text = ta.value;
    });
  });

  el.querySelectorAll<HTMLInputElement>('[data-qans]').forEach(inp => {
    inp.addEventListener('input', () => {
      ps.pack.questions[parseInt(inp.dataset['qans']!)]!.answer = inp.value || undefined;
    });
  });

  el.querySelectorAll<HTMLInputElement>('[data-qimg]').forEach(inp => {
    inp.addEventListener('input', () => {
      ps.pack.questions[parseInt(inp.dataset['qimg']!)]!.imageUrl = inp.value || undefined;
    });
  });

  el.querySelectorAll<HTMLInputElement>('[data-qfen]').forEach(inp => {
    inp.addEventListener('input', () => {
      ps.pack.questions[parseInt(inp.dataset['qfen']!)]!.fen = inp.value || undefined;
    });
  });

  el.querySelectorAll<HTMLSelectElement>('[data-qorient]').forEach(sel => {
    sel.addEventListener('change', () => {
      const v = sel.value as 'white' | 'black' | '';
      ps.pack.questions[parseInt(sel.dataset['qorient']!)]!.boardOrientation = v || undefined;
    });
  });
}

// ══════════════════════════════════════════════════════════════
// CHARACTER EDITOR
// ══════════════════════════════════════════════════════════════

interface CharState {
  sets: CharacterSet[];
  view: 'list' | 'edit';
  editIdx: number;
  set: CharacterSet;
  expandedC: number;
}

let cs: CharState = newCharState();

function newCharState(): CharState {
  return {
    sets: [],
    view: 'list',
    editIdx: -1,
    set: { title: '', characters: [] },
    expandedC: -1,
  };
}

export function renderCharacterEditor(el: HTMLElement): void {
  cs = newCharState();
  cs.sets = loadCharacterSets();
  drawChar(el);
}

function drawChar(el: HTMLElement): void {
  if (cs.view === 'list') drawCharList(el);
  else drawCharEdit(el);
}

// ── Character Set List ─────────────────────────────────────────

function drawCharList(el: HTMLElement): void {
  el.innerHTML = `
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="ce-back" class="text-gray-400 hover:text-white transition text-sm">← Назад</button>
        <h1 class="text-xl font-bold flex-1">Редактор персонажей</h1>
        <label class="cursor-pointer text-sm text-indigo-400 hover:text-indigo-300 transition">
          Импорт
          <input id="ce-import" type="file" accept=".json" class="hidden" />
        </label>
        <button id="ce-new" class="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition">
          + Новый набор
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full">
        ${cs.sets.length === 0
          ? `<div class="text-gray-500 text-center mt-20 text-sm">Нет наборов. Создайте первый!</div>`
          : cs.sets.map((s, i) => `
            <div class="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">${escapeHtml(s.title)}</div>
                <div class="text-xs text-gray-400">${s.characters.length} персонажей</div>
              </div>
              <button data-edit="${i}" class="text-sm text-indigo-400 hover:text-indigo-300 transition">Изменить</button>
              <button data-copy="${i}" class="text-sm text-green-400 hover:text-green-300 transition">Копировать</button>
              <button data-export="${i}" class="text-sm text-gray-400 hover:text-gray-300 transition">Экспорт</button>
              <button data-del="${i}" class="text-sm text-red-400 hover:text-red-300 transition">Удалить</button>
            </div>
          `).join('')}
      </div>

    </div>
  `;

  el.querySelector('#ce-back')?.addEventListener('click', () => _nav('home'));

  el.querySelector('#ce-new')?.addEventListener('click', () => {
    cs.editIdx = -1;
    cs.set = { title: '', characters: [] };
    cs.view = 'edit';
    cs.expandedC = -1;
    drawChar(el);
  });

  el.querySelector('#ce-import')?.addEventListener('change', e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (
          !data.title ||
          !Array.isArray(data.characters) ||
          !data.characters.every((c: unknown) => {
            const cc = c as Record<string, unknown>;
            return cc && typeof cc['name'] === 'string' && typeof cc['cost'] === 'number';
          })
        ) throw new Error();
        cs.sets.push(data as CharacterSet);
        saveCharacterSets(cs.sets);
        drawCharList(el);
      } catch {
        showModal('Неверный формат файла');
      }
    };
    reader.readAsText(file);
  });

  el.querySelectorAll<HTMLElement>('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['edit']!);
      cs.editIdx = i;
      cs.set = structuredClone(cs.sets[i]);
      cs.view = 'edit';
      cs.expandedC = -1;
      drawChar(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['export']!);
      downloadJson(cs.sets[i]!, `${cs.sets[i]!.title || 'characters'}.json`);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['del']!);
      showModal(`Удалить набор «${escapeHtml(cs.sets[i]!.title)}»?`, () => {
        cs.sets.splice(i, 1);
        saveCharacterSets(cs.sets);
        drawCharList(el);
      });
    });
  });

  el.querySelectorAll<HTMLElement>('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset['copy']!);
      const copy: CharacterSet = structuredClone(cs.sets[i]);
      copy.title += ' (копия)';
      cs.sets.push(copy);
      saveCharacterSets(cs.sets);
      drawCharList(el);
    });
  });
}

// ── Character Set Edit ─────────────────────────────────────────

function drawCharEdit(el: HTMLElement): void {
  const s = cs.set;
  el.innerHTML = `
    <div class="min-h-screen flex flex-col bg-gray-950">

      <div class="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-800">
        <button id="ce-edit-back" class="text-gray-400 hover:text-white transition text-sm">← Назад</button>
        <h1 class="text-xl font-bold flex-1">${cs.editIdx === -1 ? 'Новый набор' : 'Редактировать набор'}</h1>
        <button id="ce-save" class="py-2 px-4 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition">
          Сохранить
        </button>
      </div>

      <div class="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">

        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label class="text-xs text-gray-400 uppercase tracking-wider">Название набора</label>
          <input id="ce-title" type="text" value="${escapeHtml(s.title)}" placeholder="Введите название..."
            class="w-full bg-gray-800 text-white rounded-xl px-4 py-2 mt-1 border border-gray-700 focus:outline-none focus:border-indigo-500" />
        </div>

        <div class="text-xs text-gray-500 px-1">
          💡 Персонажи сортируются по стоимости автоматически. Чем выше стоимость, тем позже открывается персонаж.
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-400 uppercase tracking-wider font-semibold">Персонажи (${s.characters.length})</div>
          <button id="ce-add-c" class="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition">
            + Добавить
          </button>
        </div>

        <div id="ce-clist">${renderCList(s.characters)}</div>

        ${cs.editIdx !== -1 ? `
          <button id="ce-del-set"
            class="w-full py-3 rounded-xl font-semibold transition text-red-400 hover:text-red-300 border border-red-900 hover:bg-red-900/20">
            Удалить набор
          </button>
        ` : ''}

      </div>
    </div>
  `;

  const titleEl = el.querySelector('#ce-title') as HTMLInputElement;
  titleEl.addEventListener('input', () => { cs.set.title = titleEl.value; });

  el.querySelector('#ce-edit-back')?.addEventListener('click', () => {
    cs.view = 'list';
    cs.sets = loadCharacterSets();
    drawChar(el);
  });

  el.querySelector('#ce-save')?.addEventListener('click', () => {
    if (!cs.set.title.trim()) { showModal('Введите название набора'); return; }
    if (cs.editIdx === -1) cs.sets.push(cs.set);
    else cs.sets[cs.editIdx] = cs.set;
    saveCharacterSets(cs.sets);
    cs.view = 'list';
    drawChar(el);
  });

  el.querySelector('#ce-del-set')?.addEventListener('click', () => {
    showModal(`Удалить набор «${escapeHtml(cs.set.title)}»?`, () => {
      cs.sets.splice(cs.editIdx, 1);
      saveCharacterSets(cs.sets);
      cs.view = 'list';
      drawChar(el);
    });
  });

  el.querySelector('#ce-add-c')?.addEventListener('click', () => {
    cs.set.characters.push({ name: '', cost: 3 });
    cs.expandedC = cs.set.characters.length - 1;
    refreshCList(el);
    setTimeout(() => {
      el.querySelector(`[data-crow="${cs.expandedC}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  });

  bindCEvents(el);
}

function renderCList(chars: Character[]): string {
  if (chars.length === 0)
    return `<div class="text-gray-500 text-center py-8 text-sm">Нет персонажей. Нажмите «+ Добавить».</div>`;

  return chars.map((c, i) => {
    const open    = cs.expandedC === i;
    const safeImg = c.imageUrl ? sanitizeImageUrl(c.imageUrl) : '';
    return `
      <div data-crow="${i}" class="bg-gray-900 border border-gray-800 rounded-xl mb-2 overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" data-ctoggle="${i}">
          ${safeImg
            ? `<img src="${safeImg}" class="w-8 h-8 object-contain rounded flex-shrink-0" referrerpolicy="no-referrer" />`
            : `<div class="w-8 h-8 bg-gray-700 rounded flex-shrink-0 flex items-center justify-center text-sm">👤</div>`}
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium ${c.name ? 'text-white' : 'text-gray-500 italic'}">
              ${c.name ? escapeHtml(c.name) : 'Без имени'}
            </div>
            <div class="text-xs text-yellow-400">★ ${c.cost}</div>
          </div>
          <div class="flex gap-0.5 flex-shrink-0">
            <button data-cup="${i}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="Вверх">↑</button>
            <button data-cdn="${i}" class="text-gray-400 hover:text-white transition px-2 py-1 text-sm" title="Вниз">↓</button>
            <button data-cdel="${i}" class="text-red-400 hover:text-red-300 text-sm transition px-2 py-1">✕</button>
          </div>
          <span class="text-gray-600 text-sm flex-shrink-0">${open ? '▲' : '▼'}</span>
        </div>
        ${open ? `
          <div class="px-4 pb-4 pt-3 space-y-2 border-t border-gray-800">
            <div>
              <label class="text-xs text-gray-400">Имя персонажа</label>
              <input data-cname="${i}" type="text" value="${escapeHtml(c.name)}" placeholder="Имя..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">Стоимость (★ для открытия)</label>
              <input data-ccost="${i}" type="number" min="1" value="${c.cost}"
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-400">Изображение (URL, необязательно)</label>
              <input data-cimg="${i}" type="text" value="${escapeHtml(c.imageUrl ?? '')}" placeholder="https://..."
                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500" />
            </div>
            ${safeImg ? `
              <div>
                <div class="text-xs text-gray-400 mb-1">Предпросмотр</div>
                <img src="${safeImg}" class="h-16 object-contain rounded" onerror="this.style.display='none'" referrerpolicy="no-referrer" />
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function refreshCList(el: HTMLElement): void {
  const list = el.querySelector('#ce-clist');
  if (list) list.innerHTML = renderCList(cs.set.characters);
  bindCEvents(el);
}

function bindCEvents(el: HTMLElement): void {
  el.querySelectorAll<HTMLElement>('[data-ctoggle]').forEach(row => {
    row.addEventListener('click', e => {
      const t = e.target as HTMLElement;
      if (t.hasAttribute('data-cup') || t.hasAttribute('data-cdn') || t.hasAttribute('data-cdel')) return;
      const i = parseInt(row.dataset['ctoggle']!);
      cs.expandedC = cs.expandedC === i ? -1 : i;
      refreshCList(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-cdel]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset['cdel']!);
      cs.set.characters.splice(i, 1);
      if (cs.expandedC === i) cs.expandedC = -1;
      else if (cs.expandedC > i) cs.expandedC--;
      refreshCList(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-cup]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset['cup']!);
      if (i === 0) return;
      [cs.set.characters[i - 1], cs.set.characters[i]] = [cs.set.characters[i]!, cs.set.characters[i - 1]!];
      if      (cs.expandedC === i)     cs.expandedC = i - 1;
      else if (cs.expandedC === i - 1) cs.expandedC = i;
      refreshCList(el);
    });
  });

  el.querySelectorAll<HTMLElement>('[data-cdn]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset['cdn']!);
      if (i >= cs.set.characters.length - 1) return;
      [cs.set.characters[i + 1], cs.set.characters[i]] = [cs.set.characters[i]!, cs.set.characters[i + 1]!];
      if      (cs.expandedC === i)     cs.expandedC = i + 1;
      else if (cs.expandedC === i + 1) cs.expandedC = i;
      refreshCList(el);
    });
  });

  el.querySelectorAll<HTMLInputElement>('[data-cname]').forEach(inp => {
    inp.addEventListener('input', () => {
      cs.set.characters[parseInt(inp.dataset['cname']!)]!.name = inp.value;
    });
  });

  el.querySelectorAll<HTMLInputElement>('[data-ccost]').forEach(inp => {
    inp.addEventListener('input', () => {
      cs.set.characters[parseInt(inp.dataset['ccost']!)]!.cost = Math.max(1, parseInt(inp.value) || 1);
    });
  });

  el.querySelectorAll<HTMLInputElement>('[data-cimg]').forEach(inp => {
    inp.addEventListener('input', () => {
      cs.set.characters[parseInt(inp.dataset['cimg']!)]!.imageUrl = inp.value || undefined;
      // Refresh to show/hide preview
      refreshCList(el);
    });
  });
}
