import type { Board, SidePick, UserData, Winner } from "../types/types";

export const getOppositeSide = (side: SidePick) => side === "circlePlayer" ? "crossPlayer" : "circlePlayer";
export const checkTTTWinner = (board: Board): SidePick | null => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === "X" ? "crossPlayer" : "circlePlayer";
    }
  }
  return null;
}
export const checkDraw = (board: Board): boolean => !board.includes(null);
export const copyTuple = <T extends any[]>(tab: T) => tab.slice() as T;
export const emptyBoard: Board = [null, null, null, null, null, null, null, null, null];
export const parseUserStats = (stats: UserData['stats']) => {
  const gamesPlayed = stats.reduce((prev, curr) => prev + curr, 0);
  const ratio = stats[2] === 0 ? stats[0] : stats[0]/stats[2];
  return {
    gamesPlayed,
    ratio
  }
}