import React, { useState, useEffect } from 'react';
import { Player } from '@/pages/Index';
import { PlayerCard } from '@/components/PlayerCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Banknote, Eye, AlertTriangle, TrendingUp } from 'lucide-react';
import { ManagePricesModal } from '@/components/ManagePricesModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  onResetGame: () => void;
}

interface Company {
  name: string;
  price: number;
  availableShares: number;
  priceHistory: { price: number; timestamp: Date }[];
}

const initialCompanies: Company[] = [
  { 
    name: 'SunPharma', 
    price: 25.0, 
    availableShares: 200000,
    priceHistory: [{ price: 25.0, timestamp: new Date() }]
  },
  { 
    name: 'ICICI Bank', 
    price: 35.0, 
    availableShares: 200000,
    priceHistory: [{ price: 35.0, timestamp: new Date() }]
  },
  { 
    name: 'Tisco', 
    price: 40.0, 
    availableShares: 200000,
    priceHistory: [{ price: 40.0, timestamp: new Date() }]
  },
  { 
    name: 'Adani', 
    price: 55.0, 
    availableShares: 200000,
    priceHistory: [{ price: 55.0, timestamp: new Date() }]
  },
  { 
    name: 'Reliance', 
    price: 70.0, 
    availableShares: 200000,
    priceHistory: [{ price: 70.0, timestamp: new Date() }]
  },
  { 
    name: 'TCS', 
    price: 80.0, 
    availableShares: 200000,
    priceHistory: [{ price: 80.0, timestamp: new Date() }]
  },
];

export const Dashboard = ({ players, setPlayers, onResetGame }: DashboardProps) => {
  const totalBalance = players.reduce((sum, player) => sum + player.balance, 0);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [showSharesModal, setShowSharesModal] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [selectedCompanyForHistory, setSelectedCompanyForHistory] = useState<Company | null>(null);

  // State for ManagePricesModal
  const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({});
  const [lastDeltas, setLastDeltas] = useState<{ [key: string]: number }>({});

  // Add browser refresh confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to refresh the page? This will reset the entire game.';
      return 'Are you sure you want to refresh the page? This will reset the entire game.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleInputChange = (companyName: string, value: string) => {
    setPriceInputs((prev) => ({ ...prev, [companyName]: value }));
  };

  const updateCompanyPriceByDelta = (companyName: string, delta: number) => {
    if (!delta) return;
    setCompanies((prev) =>
      prev.map((c) =>
        c.name === companyName
          ? { 
              ...c, 
              price: Math.max(0, c.price + delta),
              priceHistory: [
                ...c.priceHistory,
                { price: Math.max(0, c.price + delta), timestamp: new Date() }
              ]
            }
          : c
      )
    );
    setLastDeltas((prev) => ({ ...prev, [companyName]: delta }));
    setPriceInputs((prev) => ({ ...prev, [companyName]: '' }));
  };

  const suspendLastOperation = (companyName: string) => {
    const delta = lastDeltas[companyName] || 0;
    if (delta !== 0) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.name === companyName
            ? { 
                ...c, 
                price: Math.max(0, c.price - delta),
                priceHistory: [
                  ...c.priceHistory,
                  { price: Math.max(0, c.price - delta), timestamp: new Date() }
                ]
              }
            : c
        )
      );
      setLastDeltas((prev) => ({ ...prev, [companyName]: 0 }));
    }
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(players.map(player => player.id === updatedPlayer.id ? updatedPlayer : player));
  };

  const handleResetGame = () => {
    setShowResetConfirmation(true);
  };

  const confirmResetGame = () => {
    onResetGame();
    setShowResetConfirmation(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Nana Bhau Pathsanstha Dashboard
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <ManagePricesModal
              companies={companies}
              priceInputs={priceInputs}
              lastDeltas={lastDeltas}
              handleInputChange={handleInputChange}
              updateCompanyPriceByDelta={updateCompanyPriceByDelta}
              suspendLastOperation={suspendLastOperation}
            />
            <Dialog open={showSharesModal} onOpenChange={setShowSharesModal}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Show All Shares
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>All Players' Share Holdings</DialogTitle>
                  <DialogDescription>
                    View all players and their share holdings
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue={players[0]?.id.toString()} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    {players.map((player) => (
                      <TabsTrigger key={player.id} value={player.id.toString()} className="text-xs">
                        {player.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {players.map((player) => (
                    <TabsContent key={player.id} value={player.id.toString()} className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">{player.name}</h3>
                        <p className="text-sm text-gray-600">Balance: ₹{player.balance.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companies.map(company => {
                          const holdings = player.holdings?.[company.name] || 0;
                          const totalValue = holdings * company.price;
                          const imagePath = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
                          
                          return (
                            <div key={company.name} className="flex items-center gap-3 p-3 bg-gray-50 border rounded">
                              <img
                                src={imagePath}
                                alt={company.name}
                                width={50}
                                height={50}
                                className="rounded shadow"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/logos/default.png';
                                }}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{company.name}</div>
                                <div className="text-sm text-gray-600">
                                  {holdings} shares × ₹{company.price} = ₹{totalValue.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {Object.keys(player.holdings || {}).length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          No shares owned
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button
              onClick={handleResetGame}
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Game
            </Button>
            {/* <Button
              onClick={() => {
                if (window.confirm('Are you sure you want to refresh the page? This will reset the entire game.')) {
                  window.location.reload();
                }
              }}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button> */}
          </div>
        </div>

                 {/* Company Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
           {companies.map(company => {
             const logoSrc = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
             return (
                               <div key={company.name} className="flex items-center justify-between p-4 pr-6 bg-white border rounded shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoSrc}
                      alt={company.name}
                      width={80}
                      height={40}
                      className="rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logos/default.png';
                      }}
                    />
                    <div className="flex flex-col">
                      <div className="font-medium text-sm">{company.name}</div>
                      <div className="text-xs text-gray-600">
                        Available: {company.availableShares} shares
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">₹{company.price}</div>
                    <div className="text-xs text-gray-500">per share</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCompanyForHistory(company);
                        setShowPriceHistoryModal(true);
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      History
                    </Button>
                  </div>
                </div>
             );
           })}
         </div>

        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onUpdatePlayer={updatePlayer}
              companies={companies}
              setCompanies={setCompanies}
            />
          ))}
        </div>
      </div>

      {/* Reset Game Confirmation Dialog */}
      <Dialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle>Start New Game?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to start a new game? This will reset all players, balances, and share holdings.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirmation(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResetGame}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Start New Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price History Modal */}
      <Dialog open={showPriceHistoryModal} onOpenChange={setShowPriceHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCompanyForHistory?.name} - Price History
            </DialogTitle>
            <DialogDescription>
              Track the rise and fall of {selectedCompanyForHistory?.name} share prices over time
            </DialogDescription>
          </DialogHeader>
          {selectedCompanyForHistory && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedCompanyForHistory.name}</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      Current Price: ₹{selectedCompanyForHistory.price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Changes</p>
                    <p className="text-lg font-semibold">
                      {selectedCompanyForHistory.priceHistory.length - 1}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Price History Timeline</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedCompanyForHistory.priceHistory.map((entry, index) => {
                    const previousPrice = index > 0 ? selectedCompanyForHistory.priceHistory[index - 1].price : entry.price;
                    const change = entry.price - previousPrice;
                    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            change > 0 ? 'bg-green-500' : change < 0 ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <div className="font-medium">₹{entry.price.toFixed(2)}</div>
                            <div className="text-xs text-gray-600">
                              {entry.timestamp.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {index > 0 && (
                            <div className={`text-sm font-medium ${
                              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
