
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, Users } from 'lucide-react';

interface GameSetupProps {
  onStartGame: (playerCount: number, startingCash: number) => void;
}

export const GameSetup = ({ onStartGame }: GameSetupProps) => {
  const [playerCount, setPlayerCount] = useState(4);
  const [startingCash, setStartingCash] = useState(600000);

  const handleStartGame = () => {
    if (playerCount >= 2 && playerCount <= 6 && startingCash > 0) {
      onStartGame(playerCount, startingCash);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Banknote className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ZSE Bank
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Digital Bank for Stock Exchange Game
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="playerCount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Number of Players
            </Label>
            <Input
              id="playerCount"
              type="number"
              min={2}
              max={6}
              value={playerCount}
              onChange={(e) => setPlayerCount(Number(e.target.value))}
              className="text-center text-lg font-semibold"
            />
            <p className="text-xs text-gray-500">Between 2 and 6 players</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingCash" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Starting Cash (₹)
            </Label>
            <Input
              id="startingCash"
              type="number"
              min={1000}
              step={1000}
              value={startingCash}
              onChange={(e) => setStartingCash(Number(e.target.value))}
              className="text-center text-lg font-semibold"
            />
            <p className="text-xs text-gray-500">Amount each player starts with</p>
          </div>

          <Button 
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 text-lg shadow-lg transition-all duration-200"
            disabled={playerCount < 2 || playerCount > 6 || startingCash <= 0}
          >
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
