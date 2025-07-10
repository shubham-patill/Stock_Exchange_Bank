import { useState } from 'react';
import { Player, Transaction } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, TrendingUp, History, RotateCcw, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  name: string;
  price: number;
  availableShares: number;
}

interface PlayerCardProps {
  player: Player;
  onUpdatePlayer: (player: Player) => void;
  showShares?: boolean;
  companies?: Company[];
}

export const PlayerCard = ({ player, onUpdatePlayer, showShares, companies }: PlayerCardProps) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [lastState, setLastState] = useState<Player | null>(null);

  const addTransaction = (type: Transaction['type'], amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      amount,
      timestamp: new Date(),
      description
    };

    setLastState(player); // Save current state before update

    const updatedPlayer: Player = {
      ...player,
      balance: type === 'subtract' ? Math.max(0, player.balance - amount) : player.balance + amount,
      transactions: [newTransaction, ...player.transactions]
    };

    onUpdatePlayer(updatedPlayer);
    toast.success(`${description} - ₹${amount.toLocaleString('en-IN')}`);
  };

  const handleNameSave = () => {
    if (editName.trim() && editName.trim() !== player.name) {
      const updatedPlayer: Player = {
        ...player,
        name: editName.trim()
      };
      onUpdatePlayer(updatedPlayer);
      toast.success(`Player name updated to "${editName.trim()}"`);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditName(player.name);
    setIsEditingName(false);
  };

  const handleLSM = () => {
    addTransaction('lsm', 100000, 'Loan Stock Matured');
  };

  const handleUndo = () => {
    if (lastState) {
      onUpdatePlayer(lastState);
      toast.success('Last transaction undone');
      setLastState(null);
    } else {
      toast.error('Nothing to undo');
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'add': return 'bg-green-100 text-green-800';
      case 'subtract': return 'bg-red-100 text-red-800';
      case 'lsm': return 'bg-blue-100 text-blue-800';
      case 'reset': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold h-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={handleNameSave} className="p-1 h-8 w-8">
                <Check className="w-4 h-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNameCancel} className="p-1 h-8 w-8">
                <X className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-800">{player.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(true)}
                className="p-1 h-8 w-8 opacity-60 hover:opacity-100"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <History className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{player.name} - Transaction History</DialogTitle>
                <DialogDescription>
                  All transactions for this player
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {player.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getTransactionColor(transaction.type)}>
                            {transaction.type.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium">
                            ₹{transaction.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <div className="text-3xl font-bold text-green-600">
          ₹{player.balance.toLocaleString('en-IN')}
        </div>
      </CardHeader>

      {showShares && companies && (
        <div className="mt-2 pt-2 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Share Holdings:</h4>
          <div className="space-y-1">
            {companies.map(company => {
              const holdings = player.holdings?.[company.name] || 0;
              if (holdings > 0) {
                return (
                  <div key={company.name} className="flex justify-between text-xs">
                    <span className="text-gray-600">{company.name}:</span>
                    <span className="font-medium">{holdings} shares</span>
                  </div>
                );
              }
              return null;
            })}
            {Object.keys(player.holdings || {}).length === 0 && (
              <div className="text-xs text-gray-500">No shares owned</div>
            )}
          </div>
        </div>
      )}

      <CardContent className="space-y-3">
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleLSM}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            LSM (+₹1L)
          </Button>
          <Button
            onClick={handleUndo}
            variant="outline"
            className="hover:bg-gray-50"
            disabled={!lastState}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
