import { useState } from 'react'
import './App.css'
import GameBoard from './GamBoard'
import headlineImage from '/happyfour_640.png'

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [goKey, setGoKey] = useState(0)

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };
  
  const handleGo = () => {
    setGoKey(prev => prev + 1);
  };

  return (
    <>
    <div>
      <div>
        <img src={headlineImage} width='420px'/>
      </div>
      <div>
        <button onClick={handleGo} className="hf-buttons">GO</button>
        <button onClick={handleReset} className="hf-buttons">New Game</button>
      </div>
    <GameBoard keyReset={resetKey} keyGo={goKey} />   
    </div>
    </>
  );
  
}

export default App
