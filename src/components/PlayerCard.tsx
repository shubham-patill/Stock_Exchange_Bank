
import { useState } from 'react';
import { Player, Transaction } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, TrendingUp, History, RotateCcw, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerCardProps {
  player: Player;
  onUpdatePlayer: (player: Player) => void;
}

export const PlayerCard = ({ player, onUpdatePlayer }: PlayerCardProps) => {
  const [amount, setAmount] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(player.name);

  const addTransaction = (type: Transaction['type'], amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      amount,
      timestamp: new Date(),
      description
    };

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

  const handleAdd = () => {
    const value = Number(amount);
    if (value > 0) {
      addTransaction('add', value, `Added ₹${value.toLocaleString('en-IN')}`);
      setAmount('');
    }
  };

  const handleSubtract = () => {
    const value = Number(amount);
    if (value > 0) {
      if (value > player.balance) {
        toast.error('Insufficient balance!');
        return;
      }
      addTransaction('subtract', value, `Subtracted ₹${value.toLocaleString('en-IN')}`);
      setAmount('');
    }
  };

  const handleLSM = () => {
    addTransaction('lsm', 100000, 'Loan Stock Matured');
  };

  const handleReset = () => {
    const initialBalance = player.transactions.find(t => t.type === 'add')?.amount || 500000;
    const resetPlayer: Player = {
      ...player,
      balance: initialBalance,
      transactions: [{
        id: `reset-${Date.now()}`,
        type: 'reset',
        amount: initialBalance,
        timestamp: new Date(),
        description: 'Balance reset to initial amount'
      }, ...player.transactions]
    };
    onUpdatePlayer(resetPlayer);
    toast.success('Balance reset to initial amount');
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
      <CardHeader className="pb-3">
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

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1"
            min="1"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={!amount || Number(amount) <= 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
          <Button
            onClick={handleSubtract}
            className="bg-red-500 hover:bg-red-600 text-white"
            disabled={!amount || Number(amount) <= 0}
          >
            <Minus className="w-4 h-4 mr-1" />
            Subtract
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleLSM}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            LSM (+₹1L)
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset {player.name}'s balance to the starting amount. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Yes, Reset Balance
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
