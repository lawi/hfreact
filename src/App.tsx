import { useState } from 'react'
import './App.css'
import GameBoard from './GamBoard'
import headlineImage from '/happyfour_640.png'

function App() {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <>
    <div>
      <div>
        <img src={headlineImage} width='420px'/>
      </div>
      <div>
        <button onClick={handleReset}>Spiel zurücksetzen</button>
      </div>
    <GameBoard keyReset={resetKey} />   
    </div>
    </>
  );
  
}

export default App
