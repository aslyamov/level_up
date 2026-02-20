import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';

export function mountBoard(
  el: HTMLElement,
  fen: string,
  orientation: 'white' | 'black' = 'white',
): Api {
  return Chessground(el, {
    fen,
    orientation,
    movable:    { free: false, color: undefined },
    draggable:  { enabled: false },
    selectable: { enabled: false },
    animation:  { enabled: false },
    coordinates: true,
    drawable:   { enabled: true, visible: true },
  });
}
