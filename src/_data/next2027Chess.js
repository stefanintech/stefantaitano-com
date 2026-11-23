// Featured-game card and puzzle for the /next-2027/ home mockup.
// The position is computed at build from the study chapter PGN.
// If that fetch fails, the committed snapshot is used so the build still finishes.
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {boardSquares, buildFeatured, kingSquare} from './chessSan.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const study = JSON.parse(readFileSync(path.join(dir, 'study.json'), 'utf8'));
const snapshot = JSON.parse(readFileSync(path.join(dir, 'next2027ChessSnapshot.json'), 'utf8'));

function resultWords(result) {
  if (result === '1-0') return 'White won';
  if (result === '0-1') return 'Black won';
  if (result === '1/2-1/2') return 'Draw';
  return '';
}

function present(raw, source) {
  const side = raw.puzzle.fen.split(' ')[1] === 'w' ? 'w' : 'b';
  return {
    source,
    white: raw.white,
    black: raw.black,
    result: raw.result,
    resultWords: resultWords(raw.result),
    final: {
      fen: raw.finalFen,
      squares: boardSquares(raw.finalFen, 'white')
    },
    puzzle: {
      ply: raw.puzzle.ply,
      from: raw.puzzle.from,
      to: raw.puzzle.to,
      side,
      text: raw.puzzle.text,
      accept: raw.puzzle.accept.join(' '),
      cursor: kingSquare(raw.puzzle.fen),
      squares: boardSquares(raw.puzzle.fen, side === 'b' ? 'black' : 'white')
    }
  };
}

async function featuredFromNetwork() {
  const url = `https://lichess.org/api/study/${study.studyId}/${study.chapterId}.pgn`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: {accept: 'application/x-chess-pgn'}
  });
  if (!response.ok) throw new Error('study pgn unavailable');
  return buildFeatured(await response.text());
}

export default async function next2027Chess() {
  try {
    return present(await featuredFromNetwork(), 'live');
  } catch {
    return present(snapshot, 'snapshot');
  }
}
