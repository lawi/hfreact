import React, { useState } from 'react';
import './GameBoard.css';
import boardImage from '/board.png'
import yellowDisc from '/yellow.png'
import redDisc from '/red.png'
import yellowDropper from '/dropYellow.png'
import redDropper from '/dropRed.png'

const ROWS = 6;
const COLUMNS = 7;

type DiscColor = 'red' | 'yellow' | null;

interface GameBoardProps {
    keyReset: number; 
  }
  

const GameBoard: React.FC<GameBoardProps> = ({ keyReset }) => {
    const [board, setBoard] = useState<DiscColor[][]>(
        Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null))
    );
    const [currentPlayer, setCurrentPlayer] = useState<DiscColor>('red');
      
    // Wenn keyReset sich ändert, setzen wir das Spiel zurück
    React.useEffect(() => {
        setBoard(Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null)));
        setCurrentPlayer('red');
    }, [keyReset]);

  const handleColumnClick = (col: number) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        const newBoard = board.map(row => [...row]); // Deep copy
        newBoard[row][col] = currentPlayer;

        setBoard(newBoard);
        setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
        break;
      }
    }
  };

  return (
    <div className="board-container">
      <div className="column-select">
        {Array.from({ length: COLUMNS }).map((_, col) => (
          <button key={col} onClick={() => handleColumnClick(col)}>
            <img src={currentPlayer === 'red' ? redDropper: yellowDropper} width= '24px'/>
          </button>
        ))}
      </div>
      <div className="disc-layer">
        {board.map((rowArr, row) =>
          rowArr.map((cell, col) =>
            cell ? (
              <img
                key={`${row}-${col}-${cell}`}
                src={cell=='red' ? redDisc : yellowDisc}
                className="disc drop"
                style={{
                  top: `${row * 60}px`,
                  left: `${col * 60}px`,
                  animationDelay: `${(ROWS - row) * 0.2}s`,
                }}
              />
            ) : null
          )
        )}
      </div>
      <img src={boardImage} className="board-foreground" />
    </div>
  );
};

export default GameBoard;
