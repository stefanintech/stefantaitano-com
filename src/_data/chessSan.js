// Small SAN replay for the /next-2027/ mockup. No dependencies.
// It only has to play a standard chess game from a Lichess study PGN.

const FILES = 'abcdefgh';
const PIECE_NAMES = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
  P: 'pawn'
};
const PIECE_ORDER = ['K', 'Q', 'R', 'B', 'N', 'P'];

const knightDeltas = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2]
];
const bishopDeltas = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];
const rookDeltas = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];
const kingDeltas = [...bishopDeltas, ...rookDeltas];

export function sqName(index) {
  return FILES[index % 8] + (Math.floor(index / 8) + 1);
}

function sqIndex(name) {
  return FILES.indexOf(name[0]) + (Number(name[1]) - 1) * 8;
}

function fileOf(index) {
  return index % 8;
}

function rankOf(index) {
  return Math.floor(index / 8);
}

function onBoard(file, rank) {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

function startState() {
  const board = Array(64).fill(null);
  const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let file = 0; file < 8; file++) {
    board[file] = {t: back[file], c: 'w'};
    board[8 + file] = {t: 'P', c: 'w'};
    board[48 + file] = {t: 'P', c: 'b'};
    board[56 + file] = {t: back[file], c: 'b'};
  }
  return {
    board,
    side: 'w',
    castle: {K: true, Q: true, k: true, q: true},
    ep: null,
    half: 0,
    full: 1
  };
}

function cloneState(state) {
  return {
    board: state.board.map(piece => (piece ? {...piece} : null)),
    side: state.side,
    castle: {...state.castle},
    ep: state.ep,
    half: state.half,
    full: state.full
  };
}

function opponent(color) {
  return color === 'w' ? 'b' : 'w';
}

function isAttacked(board, index, byColor) {
  const file = fileOf(index);
  const rank = rankOf(index);
  const pawnRank = byColor === 'w' ? rank - 1 : rank + 1;
  for (const pawnFile of [file - 1, file + 1]) {
    if (!onBoard(pawnFile, pawnRank)) continue;
    const piece = board[pawnFile + pawnRank * 8];
    if (piece && piece.c === byColor && piece.t === 'P') return true;
  }
  for (const [df, dr] of knightDeltas) {
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!onBoard(nextFile, nextRank)) continue;
    const piece = board[nextFile + nextRank * 8];
    if (piece && piece.c === byColor && piece.t === 'N') return true;
  }
  for (const [df, dr] of kingDeltas) {
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!onBoard(nextFile, nextRank)) continue;
    const piece = board[nextFile + nextRank * 8];
    if (piece && piece.c === byColor && piece.t === 'K') return true;
  }
  const slide = (deltas, types) => {
    for (const [df, dr] of deltas) {
      let nextFile = file + df;
      let nextRank = rank + dr;
      while (onBoard(nextFile, nextRank)) {
        const piece = board[nextFile + nextRank * 8];
        if (piece) {
          if (piece.c === byColor && types.includes(piece.t)) return true;
          break;
        }
        nextFile += df;
        nextRank += dr;
      }
    }
    return false;
  };
  return slide(bishopDeltas, ['B', 'Q']) || slide(rookDeltas, ['R', 'Q']);
}

function kingIndex(board, color) {
  return board.findIndex(piece => piece && piece.c === color && piece.t === 'K');
}

function inCheck(state, color) {
  const index = kingIndex(state.board, color);
  return index >= 0 && isAttacked(state.board, index, opponent(color));
}

function addPawnMoves(state, index, moves) {
  const piece = state.board[index];
  const file = fileOf(index);
  const rank = rankOf(index);
  const dir = piece.c === 'w' ? 1 : -1;
  const startRank = piece.c === 'w' ? 1 : 6;
  const lastRank = piece.c === 'w' ? 7 : 0;
  const push = (dest, extra) => {
    const move = {from: index, to: dest, piece: 'P', ...extra};
    if (rankOf(dest) === lastRank) {
      for (const promotion of ['Q', 'R', 'B', 'N']) moves.push({...move, promotion});
      return;
    }
    moves.push(move);
  };
  const one = rank + dir;
  if (onBoard(file, one) && !state.board[file + one * 8]) {
    push(file + one * 8);
    const two = rank + dir * 2;
    if (rank === startRank && !state.board[file + two * 8]) push(file + two * 8, {double: true});
  }
  for (const nextFile of [file - 1, file + 1]) {
    if (!onBoard(nextFile, one)) continue;
    const dest = nextFile + one * 8;
    const target = state.board[dest];
    if (target && target.c !== piece.c) push(dest, {capture: target.t});
    else if (state.ep === dest) push(dest, {capture: 'P', enPassant: true});
  }
}

function addSliderMoves(state, index, deltas, moves) {
  const piece = state.board[index];
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr] of deltas) {
    let nextFile = file + df;
    let nextRank = rank + dr;
    while (onBoard(nextFile, nextRank)) {
      const dest = nextFile + nextRank * 8;
      const target = state.board[dest];
      if (!target) moves.push({from: index, to: dest, piece: piece.t});
      else {
        if (target.c !== piece.c) moves.push({from: index, to: dest, piece: piece.t, capture: target.t});
        break;
      }
      nextFile += df;
      nextRank += dr;
    }
  }
}

function addStepMoves(state, index, deltas, moves) {
  const piece = state.board[index];
  const file = fileOf(index);
  const rank = rankOf(index);
  for (const [df, dr] of deltas) {
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (!onBoard(nextFile, nextRank)) continue;
    const dest = nextFile + nextRank * 8;
    const target = state.board[dest];
    if (!target) moves.push({from: index, to: dest, piece: piece.t});
    else if (target.c !== piece.c) moves.push({from: index, to: dest, piece: piece.t, capture: target.t});
  }
}

function addCastleMoves(state, index, moves) {
  const piece = state.board[index];
  if (piece.t !== 'K' || inCheck(state, piece.c)) return;
  const rank = piece.c === 'w' ? 0 : 7;
  const rights = piece.c === 'w' ? ['K', 'Q'] : ['k', 'q'];
  const plans = [
    {right: rights[0], empty: [5, 6], pass: [5, 6], rookFrom: 7, rookTo: 5},
    {right: rights[1], empty: [1, 2, 3], pass: [2, 3], rookFrom: 0, rookTo: 3}
  ];
  for (const plan of plans) {
    if (!state.castle[plan.right]) continue;
    if (plan.empty.some(file => state.board[file + rank * 8])) continue;
    if (plan.pass.some(file => isAttacked(state.board, file + rank * 8, opponent(piece.c)))) continue;
    moves.push({
      from: index,
      to: plan.pass[0] === 5 ? 6 + rank * 8 : 2 + rank * 8,
      piece: 'K',
      castle: {rookFrom: plan.rookFrom + rank * 8, rookTo: plan.rookTo + rank * 8}
    });
  }
}

function pseudoMoves(state, index) {
  const piece = state.board[index];
  const moves = [];
  if (!piece || piece.c !== state.side) return moves;
  if (piece.t === 'P') addPawnMoves(state, index, moves);
  else if (piece.t === 'N') addStepMoves(state, index, knightDeltas, moves);
  else if (piece.t === 'B') addSliderMoves(state, index, bishopDeltas, moves);
  else if (piece.t === 'R') addSliderMoves(state, index, rookDeltas, moves);
  else if (piece.t === 'Q') addSliderMoves(state, index, kingDeltas, moves);
  else if (piece.t === 'K') {
    addStepMoves(state, index, kingDeltas, moves);
    addCastleMoves(state, index, moves);
  }
  return moves;
}

function apply(state, move) {
  const piece = state.board[move.from];
  const captured = state.board[move.to];
  state.board[move.to] = move.promotion ? {t: move.promotion, c: piece.c} : piece;
  state.board[move.from] = null;
  if (move.enPassant) {
    const rank = rankOf(move.to) + (piece.c === 'w' ? -1 : 1);
    state.board[fileOf(move.to) + rank * 8] = null;
  }
  if (move.castle) {
    state.board[move.castle.rookTo] = state.board[move.castle.rookFrom];
    state.board[move.castle.rookFrom] = null;
  }
  const dropCastle = (color, side) => {
    state.castle[color === 'w' ? side.toUpperCase() : side] = false;
  };
  if (piece.t === 'K') {
    dropCastle(piece.c, 'k');
    dropCastle(piece.c, 'q');
  }
  const rookHome = (index, color) => {
    if (color === 'w' && index === 0) state.castle.Q = false;
    if (color === 'w' && index === 7) state.castle.K = false;
    if (color === 'b' && index === 56) state.castle.q = false;
    if (color === 'b' && index === 63) state.castle.k = false;
  };
  if (piece.t === 'R') rookHome(move.from, piece.c);
  if (captured && captured.t === 'R') rookHome(move.to, captured.c);
  state.ep = null;
  if (move.double) state.ep = move.from + (piece.c === 'w' ? 8 : -8);
  const capture = Boolean(move.capture);
  state.half = piece.t === 'P' || capture ? 0 : state.half + 1;
  if (piece.c === 'b') state.full += 1;
  state.side = opponent(piece.c);
}

function legalMoves(state) {
  const moves = [];
  for (let index = 0; index < 64; index++) {
    for (const move of pseudoMoves(state, index)) {
      const next = cloneState(state);
      apply(next, move);
      if (!inCheck(next, state.side)) moves.push(move);
    }
  }
  return moves;
}

function cleanSan(token) {
  return token.replace(/[!?]+$/g, '').replace(/[+#]$/g, '');
}

function resolveSan(state, san) {
  const cleaned = cleanSan(san);
  const moves = legalMoves(state);
  if (cleaned === 'O-O' || cleaned === 'O-O-O') {
    const file = cleaned === 'O-O' ? 6 : 2;
    const rank = state.side === 'w' ? 0 : 7;
    return moves.find(move => move.castle && move.to === file + rank * 8) || null;
  }
  const match = cleaned.match(/^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=([QRBN]))?$/);
  if (!match) return null;
  const piece = match[1] || 'P';
  const file = match[2];
  const rank = match[3];
  const dest = sqIndex(match[5]);
  const promotion = match[6] || null;
  return (
    moves.find(move => {
      if (move.piece !== piece || move.to !== dest) return false;
      if (promotion && move.promotion !== promotion) return false;
      if (!promotion && move.promotion) return false;
      if (file && FILES[fileOf(move.from)] !== file) return false;
      if (rank && String(rankOf(move.from) + 1) !== rank) return false;
      return true;
    }) || null
  );
}

export function fenOf(state) {
  const ranks = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = state.board[file + rank * 8];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) {
        row += empty;
        empty = 0;
      }
      row += piece.c === 'w' ? piece.t : piece.t.toLowerCase();
    }
    if (empty) row += empty;
    ranks.push(row);
  }
  let castle = '';
  for (const key of ['K', 'Q', 'k', 'q']) if (state.castle[key]) castle += key;
  return `${ranks.join('/')} ${state.side} ${castle || '-'} ${state.ep === null ? '-' : sqName(state.ep)} ${state.half} ${state.full}`;
}

function parseTags(pgn) {
  const tags = {};
  for (const match of pgn.matchAll(/^\[([A-Za-z0-9]+)\s+"([^"]*)"\]/gm)) tags[match[1]] = match[2];
  return tags;
}

function movetextTokens(pgn) {
  let text = '';
  let i = 0;
  while (i < pgn.length) {
    const ch = pgn[i];
    if (ch === '{') {
      const end = pgn.indexOf('}', i);
      i = (end === -1 ? pgn.length : end) + 1;
      continue;
    }
    if (ch === '(') {
      let depth = 1;
      i += 1;
      while (i < pgn.length && depth) {
        if (pgn[i] === '(') depth += 1;
        else if (pgn[i] === ')') depth -= 1;
        else if (pgn[i] === '{') {
          const end = pgn.indexOf('}', i);
          i = end === -1 ? pgn.length : end;
        }
        i += 1;
      }
      continue;
    }
    if (ch === '[') {
      const end = pgn.indexOf(']', i);
      i = (end === -1 ? pgn.length : end) + 1;
      continue;
    }
    text += ch;
    i += 1;
  }
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(token => token && !/^\d+\.+$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token));
}

function piecePhrase(bag) {
  const parts = [];
  for (const type of PIECE_ORDER) {
    const squares = bag[type];
    if (!squares.length) continue;
    const name = PIECE_NAMES[type];
    parts.push(`${squares.length > 1 ? `${name}s` : name} ${squares.join(', ')}`);
  }
  return parts.join(', ');
}

function piecesFromFen(fen) {
  const bags = {
    w: {K: [], Q: [], R: [], B: [], N: [], P: []},
    b: {K: [], Q: [], R: [], B: [], N: [], P: []}
  };
  const ranks = fen.split(' ')[0].split('/');
  ranks.forEach((rank, rankIndex) => {
    let file = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      const color = ch === ch.toUpperCase() ? 'w' : 'b';
      const square = FILES[file] + (8 - rankIndex);
      bags[color][ch.toUpperCase()].push(square);
      file += 1;
    }
  });
  for (const color of ['w', 'b']) {
    for (const type of PIECE_ORDER) {
      bags[color][type].sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0) || a[1] - b[1]);
    }
  }
  return bags;
}

export function kingSquare(fen) {
  const side = fen.split(' ')[1] === 'w' ? 'w' : 'b';
  const letter = side === 'w' ? 'K' : 'k';
  const ranks = fen.split(' ')[0].split('/');
  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
    let file = 0;
    for (const ch of ranks[rankIndex]) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      if (ch === letter) return `${FILES[file]}${8 - rankIndex}`;
      file += 1;
    }
  }
  return side === 'w' ? 'e1' : 'e8';
}

export function describeFen(fen) {
  const side = fen.split(' ')[1] === 'w' ? 'w' : 'b';
  const bags = piecesFromFen(fen);
  const first = side === 'w' ? 'White' : 'Black';
  const second = side === 'w' ? 'black' : 'white';
  const other = side === 'w' ? 'b' : 'w';
  return `${first} to move: ${piecePhrase(bags[side])}; ${second} ${piecePhrase(bags[other])}`;
}

export function boardSquares(fen, orientation) {
  const placement = fen.split(' ')[0].split('/');
  const ranks = orientation === 'black' ? [...placement].reverse() : placement;
  const squares = [];
  let displayRank = orientation === 'black' ? 1 : 8;
  const step = orientation === 'black' ? 1 : -1;
  for (const rank of ranks) {
    let file = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) {
          squares.push(emptySquare(file, displayRank));
          file += 1;
        }
        continue;
      }
      const color = ch === ch.toUpperCase() ? 'w' : 'b';
      const piece = ch.toUpperCase();
      const id = FILES[file] + displayRank;
      squares.push({
        id,
        shade: (file + displayRank) % 2 === 1 ? 'dark' : 'light',
        piece,
        color,
        label: `${id}, ${color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece]}`
      });
      file += 1;
    }
    displayRank += step;
  }
  return squares;
}

function emptySquare(file, displayRank) {
  const id = FILES[file] + displayRank;
  return {
    id,
    shade: (file + displayRank) % 2 === 1 ? 'dark' : 'light',
    piece: '',
    color: '',
    label: `${id}, empty`
  };
}

export function acceptTokens(san, from, to) {
  const tokens = new Set();
  const add = value => tokens.add(value.toLowerCase().replace(/[x+#=\s]/g, ''));
  add(`${from}${to}`);
  add(san);
  const piece = san[0];
  if (piece && piece === piece.toUpperCase() && piece !== 'O') {
    add(`${piece}${to}`);
    add(`${piece}x${to}`);
    add(`${piece}${from[0]}${to}`);
    add(`${piece}${from[0]}x${to}`);
    add(`${piece}${from[1]}${to}`);
    add(`${piece}${from[1]}x${to}`);
    add(`${piece}${from}${to}`);
    add(`${piece}${from}x${to}`);
  }
  return [...tokens];
}

function pickPuzzle(plies) {
  if (!plies.length) throw new Error('PGN has no moves');
  const queen = plies.find(ply => ply.captured === 'Q');
  if (queen) return {...queen, because: 'Captures the queen.'};
  const checkingCapture = plies.find(ply => ply.captured && ply.check);
  if (checkingCapture) return {...checkingCapture, because: 'A capture that gives check.'};
  const capture = plies.find(ply => ply.captured);
  if (capture) return {...capture, because: 'A capture.'};
  const check = plies.find(ply => ply.check);
  if (check) return {...check, because: 'A check.'};
  return {...plies[0], because: 'The first move of the game.'};
}

export function replayPgn(pgn) {
  const tags = parseTags(pgn);
  const state = startState();
  const plies = [];
  for (const token of movetextTokens(pgn)) {
    const fenBefore = fenOf(state);
    const move = resolveSan(state, token);
    if (!move) throw new Error(`Could not play ${cleanSan(token)} at ply ${plies.length + 1} from ${fenBefore}`);
    apply(state, move);
    const check = inCheck(state, state.side);
    plies.push({
      ply: plies.length + 1,
      san: cleanSan(token),
      from: sqName(move.from),
      to: sqName(move.to),
      fenBefore,
      captured: move.capture || '',
      check
    });
  }
  return {tags, plies, finalFen: fenOf(state)};
}

export function buildFeatured(pgn) {
  const game = replayPgn(pgn);
  const picked = pickPuzzle(game.plies);
  return {
    white: game.tags.White || '',
    black: game.tags.Black || '',
    result: game.tags.Result || '',
    finalFen: game.finalFen,
    puzzle: {
      ply: picked.ply,
      san: picked.san,
      from: picked.from,
      to: picked.to,
      fen: picked.fenBefore,
      text: describeFen(picked.fenBefore),
      because: picked.because,
      accept: acceptTokens(picked.san, picked.from, picked.to)
    }
  };
}
