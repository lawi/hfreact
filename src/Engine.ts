
export type MoveMadeCallback = { onMoveMade: (move: number) => void } | ((move: number) => void);

export default class Engine {
  public static TAG = "Engine";

  public static SIDE_RED = 1;
  public static SIDE_YELLOW = 5;

  public static readonly ROWS = 6;
  public static readonly COLUMNS = 7;
  public static readonly FIELD_COUNT = Engine.ROWS * Engine.COLUMNS;

  public static readonly WINNING_SCORE = 100_000;
  public static readonly MAX = 1_000_000;
  public static readonly NA = 99;
  public static readonly MAX_QUADS = 16;

  private static readonly sideStrings: string[] = [
    "WRONG", "RED", "WRONG", "WRONG", "WRONG", "YELLOW", "WRONG", "WRONG", "WRONG",
  ];

  public static readonly values: number[] = [
    //  0, 1,  2,   3,   4,              5,  6, 7, 8, 9, 10, 11,12,13,14,  15,16,17,18,19,  20
       0, 1,  5, 100, Engine.WINNING_SCORE, -1, 0, 0, 0, 0, -5, 0, 0, 0, 0, -100, 0, 0, 0, 0, -Engine.WINNING_SCORE
  ];

  private static board: number[] = new Array(Engine.FIELD_COUNT).fill(0);
  private static instance: Engine | null = null;

  private static side = Engine.SIDE_RED;
  private static scoreSide = 1;
  private static depth = 0;
  private static score = 0;
  private static realScore = 0;
  private static nodes = 0;
  private static n = 0;
  private static numOfQuads = 0;

  private static columns: number[] = new Array(Engine.COLUMNS).fill(0);
  private static quads: number[] = [];
  private static fields: number[][] = Array.from({ length: Engine.FIELD_COUNT }, () =>
    new Array(Engine.MAX_QUADS).fill(Engine.NA)
  );
  private static history: number[] = [];

  private static thinking = false;

  private constructor() {
    Engine.prepareQuads();
  }

  // --- API ---
  public static getInstance(): Engine {
    if (!Engine.instance) Engine.instance = new Engine();
    return Engine.instance;
  }

  public static getBoard(): number[] {
    return Engine.board;
  }

  public static getSide(): number {
    return Engine.side;
  }

  public static isThinking(): boolean {
    return Engine.thinking;
  }

  public static getScore(): number {
    return Engine.realScore;
  }

  public static newGame(): void {
    Engine.side = Engine.SIDE_RED;
    Engine.thinking = false;
    Engine.history.length = 0;
    Engine.scoreSide = 1;
    Engine.depth = 0;
    Engine.score = 0;
    Engine.realScore = 0;
    Engine.nodes = 0;
    Engine.n = 0;

    for (let i = 0; i < Engine.COLUMNS; i++) Engine.columns[i] = 0;
    for (let i = 0; i < Engine.numOfQuads; i++) Engine.quads[i] = 0;
    for (let i = 0; i < Engine.FIELD_COUNT; i++) Engine.board[i] = 0;
  }

  public static makeMove(column: number): number {
    if (Engine.score > 90000 || Engine.score < -90000) {
      return Engine.side === Engine.SIDE_RED ? Engine.WINNING_SCORE : -Engine.WINNING_SCORE;
    }
    if (0 <= column && column < Engine.COLUMNS) {
      if (Engine.columns[column] < Engine.ROWS) {
        Engine.setQuads(column, Engine.columns[column]);
        Engine.columns[column] += 1; 
        Engine.changeSide();
        Engine.history.push(column);
      }
    }
    return Engine.score;
  }

  private static setQuads(col: number, row: number): void {
    const f = col + 35 - row * Engine.COLUMNS; 
    let i = 0;
    let q: number;
    Engine.board[f] = Engine.side;
    while ((q = Engine.fields[f][i]) !== Engine.NA) {
      Engine.score -= Engine.values[Engine.quads[q]]; 
      Engine.quads[q] += Engine.side;
      Engine.score += Engine.values[Engine.quads[q]]; 
      i++;
    }
  }

  private static resetQuads(col: number, row: number): void {
    const f = col + 35 - row * Engine.COLUMNS;
    let i = 0;
    let q: number;
    Engine.board[f] = 0;
    while ((q = Engine.fields[f][i]) !== Engine.NA) {
      Engine.score -= Engine.values[Engine.quads[q]];
      Engine.quads[q] -= Engine.side;
      Engine.score += Engine.values[Engine.quads[q]];
      i++;
    }
  }

  public static unmakeMove(): number {
    const i = Engine.history.length - 1;
    if (i >= 0) {
      const c = Engine.history[i];
      Engine.history.pop();
      Engine.columns[c] -= 1;
      Engine.changeSide();
      Engine.resetQuads(c, Engine.columns[c]);
    }
    return Engine.score;
  }

  private static changeSide(): void {
    Engine.side = Engine.side === Engine.SIDE_YELLOW ? Engine.SIDE_RED : Engine.SIDE_YELLOW;
    Engine.scoreSide = -Engine.scoreSide;
  }

  public static isGameEnd(): boolean {
    if (Engine.score > 90000 || Engine.score < -90000) return true;
    return false;
  }

  public static isMovePossible(mv: number): boolean {
    if (Engine.score > 90000 || Engine.score < -90000) return false;
    if (mv < 0 || mv > 6 || Engine.columns[mv] >= Engine.ROWS) return false;
    return true;
  }

  public static calcMoveThreaded(callback: MoveMadeCallback): void {
    Engine.thinking = true;
    const move = Engine.calcMove();
    if (typeof callback === "function") callback(move);
    else callback.onMoveMade(move);
    Engine.thinking = false;
  }

  public static async calcMoveAsync(): Promise<number> {
    Engine.thinking = true;
    const move = Engine.calcMove();
    Engine.thinking = false;
    return move;
  }

  private static calcMove(): number {
    const startTime = Date.now();
    Engine.depth = 1;
    let one_move = false;
    let move = 0;
    Engine.nodes = 0;

    console.error(`${Engine.TAG}: Start thinking about ${Engine.sideStrings[Engine.side]}`);

    let last_best = 3;
    while (Engine.depth < 9) {
      Engine.realScore = -Engine.MAX;
      move = 0;
      let al = -Engine.MAX;
      const be = Engine.MAX;
      one_move = false;
      Engine.n = 0;

      for (let i = 0; i < Engine.COLUMNS; i++) {
        let m = i;
        if (i === 0) m = last_best;
        if (i === last_best) m = 0;

        if (!Engine.isMovePossible(m)) continue;
        one_move = true;

        Engine.makeMove(m); 

        if (Engine.score > 80000 || Engine.score < -80000) {
          move = m;
          Engine.unmakeMove();
          Engine.realScore = Engine.WINNING_SCORE * Engine.scoreSide;
          console.error(`${Engine.TAG}: I have won !!!  ${Engine.realScore}`);
          break;
        }

        Engine.n += 1;
        const s = -Engine.negaMax(-be, -al);
        Engine.n -= 1;
        Engine.unmakeMove();

        if (s > Engine.realScore) {
          Engine.realScore = s;
          al = s;
          move = m;
          last_best = m;

          if (Engine.realScore > 90000) {
            console.error(`${Engine.TAG}: real score break ${Engine.realScore * Engine.scoreSide}`);
            break;
          }
        }
      }

      console.error(`${Engine.TAG}: Tiefe: ${Engine.depth} Move ${move} value: ${Engine.realScore}`);
      if (Engine.realScore > 90000 || Engine.realScore < -90000 || !one_move) break;
      Engine.depth += 1;
    }

    if (!one_move) move = Engine.NA;

    console.error(`${Engine.TAG}: nodes = ${Engine.nodes}`);

    if (Engine.realScore !== Engine.WINNING_SCORE && Engine.realScore !== -Engine.WINNING_SCORE) {
      Engine.realScore = Engine.realScore * Engine.scoreSide;
    }

    const allTime = Date.now() - startTime;
    if (allTime > 0) {
      console.error(`${Engine.TAG}: nps = ${(Engine.nodes * 1000) / allTime}`);
    }
    return move;
    }

  private static negaMax(al: number, be: number): number {
    let scoreVal = -Engine.MAX;
    let oneMove = false;
    Engine.nodes++;

    if (Engine.n >= Engine.depth) {
      return Engine.score * Engine.scoreSide;
    }

    for (let i = 0; i < Engine.COLUMNS; i++) {
      if (!Engine.isMovePossible(i)) continue;
      Engine.makeMove(i);
      oneMove = true;

      if (Engine.score > 80000 || Engine.score < -80000) {
        Engine.unmakeMove();
        scoreVal = Engine.WINNING_SCORE - Engine.n;
        break;
      }

      Engine.n += 1;
      const s = -Engine.negaMax(-be, -al);
      Engine.n -= 1;
      Engine.unmakeMove();

      if (s > scoreVal) {
        scoreVal = s;
        if (scoreVal > be) break;
      }
    }

    if (!oneMove) return Engine.score * Engine.scoreSide;
    return scoreVal;
  }


  private static prepareQuads(): void {
    Engine.fieldsClear();
    let quadnum = 0;

    for (let y = 0; y < Engine.ROWS; y++) {
      for (let x = 0; x < 4; x++) {
        for (let q = 0; q < 4; q++) {
          Engine.fieldsAppend(y * 7 + x + q, quadnum);
        }
        quadnum += 1;
      }
    }

    for (let x = 0; x < Engine.COLUMNS; x++) {
      for (let y = 0; y < 3; y++) {
        for (let q = 0; q < 4; q++) {
          Engine.fieldsAppend(y * 7 + x + q * 7, quadnum);
        }
        quadnum += 1;
      }
    }


    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        for (let q = 0; q < 4; q++) {
          Engine.fieldsAppend(y * 7 + x + q + q * 7, quadnum);
        }
        quadnum += 1;

        for (let q = 0; q < 4; q++) {
          Engine.fieldsAppend(35 - y * 7 + x + q - q * 7, quadnum);
        }
        quadnum += 1;
      }
    }

    Engine.numOfQuads = quadnum;
    console.error(`${Engine.TAG}: Num Of Quads ${Engine.numOfQuads}`);
    Engine.quads = new Array(Engine.numOfQuads).fill(0);
  }

  private static fieldsClear(): void {
    for (let i = 0; i < Engine.FIELD_COUNT; i++) {
      for (let h = 0; h < Engine.MAX_QUADS; h++) {
        Engine.fields[i][h] = Engine.NA;
      }
    }
  }

  private static fieldsAppend(index: number, value: number): void {
    if (index < 0 || index > Engine.FIELD_COUNT) return;
    let i = 0;
    for (; i < Engine.MAX_QUADS; i++) {
      if (Engine.fields[index][i] === Engine.NA) break;
    }
    if (i >= Engine.MAX_QUADS) {
      console.error(`${Engine.TAG}: Error: Out of Bounds for index ${index} value ${value}`);
      return;
    }
    Engine.fields[index][i] = value;
  }
}
