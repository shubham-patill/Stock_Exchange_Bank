import { useState } from 'react';
import { GameSetup } from '@/components/GameSetup';
import { Dashboard } from '@/components/Dashboard';
import { PlayerOnboarding } from '@/components/PlayerOnboarding';

export interface Player {
  id: number;
  name: string;
  balance: number;
  transactions: Transaction[];
  holdings?: { [key: string]: number }; // Add holdings property
  secretCode: string; // 4-digit code known only to the player
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
  const [onboardingComplete, setOnboardingComplete] = useState(true);

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
        holdings: {}, // Initialize holdings as an empty object
        secretCode: String(Math.floor(1000 + Math.random() * 9000)), // random 4-digit code
      });
    }
    setPlayers(newPlayers);
    setGameStarted(true);
    setOnboardingComplete(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setPlayers([]);
    setOnboardingComplete(false);
  };

  if (!gameStarted) {
    return <GameSetup onStartGame={startGame} />;
  }

  if (!onboardingComplete) {
    return (
      <PlayerOnboarding
        players={players}
        setPlayers={setPlayers}
        onComplete={() => setOnboardingComplete(true)}
      />
    );
  }

  return (
    <>
      <Dashboard players={players} setPlayers={setPlayers} onResetGame={resetGame} />
    </>
  );
};

export default Index;
