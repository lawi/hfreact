import React, { useState, useEffect, useReducer } from 'react';
import './GameBoard.css';
import boardImage from '/board.png'
import yellowDisc from '/yellow.png'
import redDisc from '/red.png'
import yellowDropper from '/dropYellow.png'
import redDropper from '/dropRed.png'
import Engine from './Engine.ts'

const CELL = 60
const STATE_YELLOW = "Yellow Players Move"
const STATE_RED = "Red Players Move"
const STATE_YELLOW_WIN = "Yellow Wins"
const STATE_RED_WIN = "Red Wins"
//type DiscColor = 'red' | 'yellow' | null;

interface GameBoardProps {
  keyReset: number; 
  keyGo: number;
}
  

const GameBoard: React.FC<GameBoardProps> = ({ keyReset, keyGo }) => {
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const [stateDescription, setStateDescription] = useState(STATE_RED)

  // initialize & start a new game once
  useEffect(() => {
    Engine.getInstance()
    Engine.newGame()
    setNewState()
    forceRender()
  }, [keyReset])

  useEffect(() => {
     calcComputerMove()
  }, [keyGo])

  const rows = Engine.ROWS;
  const cols = Engine.COLUMNS;
  const board = Engine.getBoard();
  
  const calcComputerMove = async () => {
    const aiMove = await Engine.calcMoveAsync();
    if (aiMove !== Engine.NA && Engine.isMovePossible(aiMove)) {
      Engine.makeMove(aiMove);
      setNewState()
    }
    forceRender();
  }

  const setNewState = () => {
    if (Engine.isGameEnd()) {
      if(Engine.getSide() == Engine.SIDE_RED) {
        setStateDescription(STATE_YELLOW_WIN)
      } else {
        setStateDescription(STATE_RED_WIN)
      }
    } else {
      if(Engine.getSide() == Engine.SIDE_RED) {
        setStateDescription(STATE_RED)
      } else {
        setStateDescription(STATE_YELLOW)
      }
    }
  }

  const handleColumnClick = async (c: number) => {
    if (!Engine.isMovePossible(c)) return;
    Engine.makeMove(c);
    forceRender();

    const aiMove = await Engine.calcMoveAsync(); 
    if (aiMove !== Engine.NA && Engine.isMovePossible(aiMove)) {
      Engine.makeMove(aiMove);
      setNewState()
    }
    forceRender();
  };

  return (
    <div>
      <div className="state-view">
        {stateDescription}
      </div>
      <div className="board-container">
        <div className="column-select">
          {Array.from({ length: cols }).map((_, col) => (
            <button key={col} onClick={() => handleColumnClick(col)}>
              <img
                src={Engine.getSide() === Engine.SIDE_RED ? redDropper : yellowDropper}
                width="24"
                alt=""
              />
            </button>
          ))}
        </div>
        <div className="disc-layer">
          {Array.from({ length: rows }).flatMap((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const idx = r * cols + c;              
              const v = board[idx];                  
              if (v === 0) return null;
              return (
                <img
                  key={`${r}-${c}`}                  
                  src={v === Engine.SIDE_RED ? redDisc : yellowDisc}
                  className="disc drop"
                  style={{
                    left: `${c * CELL}px`,
                    top: 0,
                    ['--targetY' as any]: `${r * CELL}px`, 
                    animationDelay: `${(rows - r) * 0.05}s`,
                  }}
                  alt=""
                />
              );
            })
          )}
        </div>
        <img src={boardImage} className="board-foreground" />
      </div>
    </div>
  );
};

export default GameBoard;
