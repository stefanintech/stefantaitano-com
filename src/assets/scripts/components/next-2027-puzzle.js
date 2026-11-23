// Hidden one-move puzzle on the home page.
const dialog = document.querySelector('[data-puzzle-dialog]');
const openers = [...document.querySelectorAll('[data-puzzle-open]')];
const opener = openers[0];
const board = dialog && dialog.querySelector('[data-puzzle-board]');
const form = dialog && dialog.querySelector('[data-puzzle-form]');
const feedback = dialog && dialog.querySelector('[data-puzzle-feedback]');
const wrong = dialog && dialog.querySelector('[data-puzzle-wrong]');
const right = dialog && dialog.querySelector('[data-puzzle-right]');
const more = dialog && dialog.querySelector('[data-puzzle-more]');
const closeButton = dialog && dialog.querySelector('[data-puzzle-close]');

if (dialog && opener && board && form && feedback && wrong && right && more && closeButton) {
  const accept = new Set((dialog.dataset.accept || '').split(/\s+/).filter(Boolean));
  const answerFrom = dialog.dataset.from || '';
  const answerTo = dialog.dataset.to || '';
  const side = board.dataset.side || '';
  const initialBoard = board.innerHTML;
  let returnTo = opener;
  let selected = null;

  const cells = () => [...board.querySelectorAll('[data-square]')];

  const isTyping = target => {
    if (!(target instanceof Element)) return false;
    const field = target.closest('input, textarea, select, [contenteditable]');
    if (!field) return false;
    if (field instanceof HTMLElement && field.isContentEditable) return true;
    return field.matches('input, textarea, select');
  };

  const focusable = () =>
    [...dialog.querySelectorAll('button, a[href], input')].filter(el => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hidden || el.closest('[hidden]')) return false;
      if ('disabled' in el && el.disabled) return false;
      return el.tabIndex >= 0;
    });

  const focusCell = cell => {
    for (const item of cells()) item.tabIndex = -1;
    cell.tabIndex = 0;
    cell.focus();
  };

  const clearSelection = () => {
    if (selected) delete selected.dataset.selected;
    selected = null;
  };

  const showResult = ok => {
    wrong.hidden = ok;
    right.hidden = !ok;
    more.hidden = !ok;
    if (!ok) return;
    const fromCell = board.querySelector(`[data-square="${answerFrom}"]`);
    const toCell = board.querySelector(`[data-square="${answerTo}"]`);
    const piece = fromCell && fromCell.querySelector('svg');
    if (piece && toCell) {
      const captured = toCell.querySelector('svg');
      if (captured) captured.remove();
      toCell.append(piece);
    }
  };

  const grade = (fromSq, toSq) => {
    showResult(fromSq === answerFrom && toSq === answerTo);
  };

  const choose = cell => {
    if (!selected) {
      if (cell.dataset.color !== side || !cell.dataset.piece) return;
      selected = cell;
      cell.dataset.selected = 'true';
      return;
    }
    if (cell === selected) {
      clearSelection();
      return;
    }
    const fromSq = selected.dataset.square;
    const toSq = cell.dataset.square;
    clearSelection();
    grade(fromSq, toSq);
  };

  const reset = () => {
    board.innerHTML = initialBoard;
    clearSelection();
    wrong.hidden = true;
    right.hidden = true;
    more.hidden = true;
    const input = form.querySelector('input');
    if (input) input.value = '';
  };

  const open = trigger => {
    const current = document.activeElement;
    returnTo = trigger || (current instanceof HTMLElement ? current : opener);
    if (!returnTo || returnTo === document.body || returnTo === document.documentElement || dialog.contains(returnTo)) {
      returnTo = opener;
    }
    reset();
    dialog.showModal();
    const cursor = board.querySelector('[tabindex="0"]');
    if (cursor) cursor.focus();
  };

  const close = () => {
    dialog.close();
  };

  for (const button of openers) button.addEventListener('click', () => open(button));
  closeButton.addEventListener('click', close);

  dialog.addEventListener('close', () => {
    const back = returnTo && returnTo.isConnected ? returnTo : opener;
    reset();
    // The dialog restores focus on its own task. Run after that so the knight,
    // or whatever opened the puzzle, ends up focused.
    setTimeout(() => {
      if (back.isConnected) back.focus();
    }, 0);
  });

  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  board.addEventListener('click', event => {
    if (event.detail === 0) return;
    const cell = event.target instanceof Element ? event.target.closest('[data-square]') : null;
    if (!cell) return;
    focusCell(cell);
    choose(cell);
  });

  board.addEventListener('keydown', event => {
    const current = event.target instanceof Element ? event.target.closest('[data-square]') : null;
    const list = cells();
    const index = list.indexOf(current);
    if (index < 0) return;
    const col = index % 8;
    let next = -1;
    if (event.key === 'ArrowRight' && col < 7) next = index + 1;
    else if (event.key === 'ArrowLeft' && col > 0) next = index - 1;
    else if (event.key === 'ArrowDown' && index + 8 < list.length) next = index + 8;
    else if (event.key === 'ArrowUp' && index - 8 >= 0) next = index - 8;
    if (next >= 0) {
      event.preventDefault();
      focusCell(list[next]);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(current);
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = form.querySelector('input');
    const typed = (input && input.value ? input.value : '').trim().toLowerCase().replace(/[x+#=\s]/g, '');
    if (typed && accept.has(typed)) grade(answerFrom, answerTo);
    else grade('', '');
    if (input) input.value = '';
  });

  let armed = false;
  document.addEventListener('keydown', event => {
    if (dialog.open || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
    if (event.key.length !== 1) return;
    const key = event.key.toLowerCase();
    if (armed && key === '4') {
      armed = false;
      event.preventDefault();
      open(null);
      return;
    }
    armed = key === 'e';
  });
}
