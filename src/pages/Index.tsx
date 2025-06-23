import { useState } from 'react';
import { GameSetup } from '@/components/GameSetup';
import { Dashboard } from '@/components/Dashboard';

export interface Player {
  id: number;
  name: string;
  balance: number;
  transactions: Transaction[];
  holdings?: { [key: string]: number }; // Add holdings property
}

export interface Transaction {
  id: string;
  type: 'add' | 'subtract' | 'lsm' | 'reset';
  amount: number;
  timestamp: Date;
  description: string;
}

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [companies, setCompanies] = useState<{ name: string }[]>([]); // Add companies state

  const startGame = (playerCount: number, startingCash: number) => {
    const newPlayers: Player[] = [];
    for (let i = 1; i <= playerCount; i++) {
      newPlayers.push({
        id: i,
        name: `Player ${i}`,
        balance: startingCash,
        transactions: [{
          id: `init-${i}`,
          type: 'add',
          amount: startingCash,
          timestamp: new Date(),
          description: 'Initial balance'
        }],
        holdings: {} // Initialize holdings as an empty object
      });
    }
    setPlayers(newPlayers);
    setGameStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setPlayers([]);
  };

  if (!gameStarted) {
    return <GameSetup onStartGame={startGame} />;
  }

  return (
    <>
      <Dashboard players={players} setPlayers={setPlayers} onResetGame={resetGame} />
    </>
  );
};

export default Index;
