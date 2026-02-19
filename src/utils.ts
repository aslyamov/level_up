export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch { /* ignore */ }
  return '';
}

export function showModal(message: string, onConfirm?: () => void): void {
  document.getElementById('modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className =
    'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50';

  const box = document.createElement('div');
  box.className =
    'bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl';

  const msg = document.createElement('p');
  msg.className = 'text-white text-center mb-6 text-base leading-relaxed';
  msg.textContent = message;
  box.appendChild(msg);

  const btns = document.createElement('div');
  btns.className = 'flex gap-3 justify-center';

  if (onConfirm) {
    const cancel = document.createElement('button');
    cancel.className =
      'flex-1 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition';
    cancel.textContent = 'Отмена';
    cancel.onclick = () => overlay.remove();
    btns.appendChild(cancel);

    const confirm = document.createElement('button');
    confirm.className =
      'flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition';
    confirm.textContent = 'Подтвердить';
    confirm.onclick = () => { overlay.remove(); onConfirm(); };
    btns.appendChild(confirm);
  } else {
    const ok = document.createElement('button');
    ok.className =
      'px-10 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition';
    ok.textContent = 'OK';
    ok.onclick = () => overlay.remove();
    btns.appendChild(ok);
  }

  box.appendChild(btns);
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

export function formatTime(timestamp: number): string {
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 1)  return 'только что';
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  return `${Math.floor(hours / 24)} д. назад`;
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
