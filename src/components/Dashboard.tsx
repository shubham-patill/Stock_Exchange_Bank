import * as React from 'react';
import { useState, useEffect } from 'react';
import { Player } from '@/pages/Index';
import { PlayerCard } from '@/components/PlayerCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Banknote, Eye, AlertTriangle, TrendingUp, Trophy } from 'lucide-react';
import { ManagePricesModal } from '@/components/ManagePricesModal';
import { PriceChangesModal } from '@/components/PriceChangesModal';
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
  const [companies, setCompanies] = React.useState<Company[]>(initialCompanies);
  const [showSharesModal, setShowSharesModal] = React.useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = React.useState(false);
  const [showPriceHistoryModal, setShowPriceHistoryModal] = React.useState(false);
  const [selectedCompanyForHistory, setSelectedCompanyForHistory] = React.useState<Company | null>(null);
  const [showEndGame, setShowEndGame] = React.useState(false);
  const [allPlayersApproved, setAllPlayersApproved] = React.useState(false);

  // State for ManagePricesModal
  const [priceInputs, setPriceInputs] = React.useState<{ [key: string]: string }>({});
  const [lastDeltas, setLastDeltas] = React.useState<{ [key: string]: number }>({});
  const [priceStatus, setPriceStatus] = React.useState<{ [key: string]: 'up' | 'down' | 'unchanged' | undefined }>({});

  // Holdings viewer state (Dashboard modal)
  const [showHoldingsModal, setShowHoldingsModal] = React.useState(false);
  const [selectedPlayerForHoldings, setSelectedPlayerForHoldings] = React.useState<number | null>(players[0]?.id ?? null);

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

  const finalizeManagePrices = () => {
    // Any company without an explicit up/down in this session becomes 'unchanged' (blue)
    setPriceStatus((prev) => {
      const next = { ...prev } as { [key: string]: 'up' | 'down' | 'unchanged' | undefined };
      companies.forEach((c) => {
        if (next[c.name] === undefined) {
          next[c.name] = 'unchanged';
        }
      });
      return next;
    });
  };

  const computeHoldingsValue = (p: Player) => {
    const holdings = p.holdings || {};
    return companies.reduce((sum, c) => sum + (holdings[c.name] || 0) * c.price, 0);
  };
  const leaderboard = React.useMemo(() => {
    return players
      .map((p) => {
        const holdingsValue = computeHoldingsValue(p);
        const total = p.balance + holdingsValue;
        return { player: p, holdingsValue, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [players, companies]);

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
    setPriceStatus((prev) => ({ ...prev, [companyName]: delta > 0 ? 'up' : 'down' }));
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
      setPriceStatus((prev) => ({ ...prev, [companyName]: 'unchanged' }));
    }
  };

  // Add browser refresh confirmation
  React.useEffect(() => {
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
              onDone={finalizeManagePrices}
            />
            <PriceChangesModal companies={companies} />
            {/* Show Shares (Dashboard) */}
            <Dialog open={showHoldingsModal} onOpenChange={(open) => { setShowHoldingsModal(open); }}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={() => { setShowHoldingsModal(true); setSelectedPlayerForHoldings(players[0]?.id ?? null); }}>
                  Show Shares
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Player Holdings</DialogTitle>
                  <DialogDescription>View current shares held by each player.</DialogDescription>
                </DialogHeader>
                {/* Player Tabs */}
                <Tabs value={selectedPlayerForHoldings?.toString() || ''} onValueChange={(v) => { setSelectedPlayerForHoldings(Number(v)); }} className="w-full mb-3">
                  <TabsList className="grid w-full grid-cols-4">
                    {players.map((p) => (
                      <TabsTrigger key={p.id} value={p.id.toString()} className="text-xs">{p.name}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {selectedPlayerForHoldings && (() => {
                  const player = players.find(p => p.id === selectedPlayerForHoldings)!;
                  const holdings = player.holdings || {};
                  const items = companies.filter(c => (holdings[c.name] || 0) > 0);
                  if (items.length === 0) {
                    return <div className="text-sm text-gray-600">No shares owned.</div>;
                  }
                  return (
                    <div className="space-y-2">
                      {items.map((c) => {
                        const qty = holdings[c.name] || 0;
                        const value = qty * c.price;
                        const logoSrc = `/logos/${c.name.replace(/\s+/g, '').toLowerCase()}.png`;
                        return (
                          <div key={c.name} className="flex items-center justify-between p-3 bg-white border rounded">
                            <div className="flex items-center gap-3">
                              <img src={logoSrc} alt={c.name} width={48} height={32} className="rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/logos/default.png'; }} />
                              <div>
                                <div className="font-medium text-sm">{c.name}</div>
                                <div className="text-xs text-gray-600">Qty: {qty.toLocaleString('en-IN')}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">₹{c.price}</div>
                              <div className="text-xs text-gray-600">Value: ₹{value.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={() => setShowEndGame(true)}
              title="Show final results and end the game"
            >
              <Trophy className="w-4 h-4" />
              End Game
            </Button>
          </div>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {companies.map(company => {
            const logoSrc = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
            const colorClass =
              priceStatus[company.name] === 'up'
                ? 'text-green-600'
                : priceStatus[company.name] === 'down'
                ? 'text-red-600'
                : 'text-blue-600';
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
                  <div className={`text-3xl font-bold ${colorClass}`}>₹{company.price}</div>
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

      {/* End Game Results Modal */}
      <Dialog open={showEndGame} onOpenChange={(open) => { setShowEndGame(open); if (!open) setAllPlayersApproved(false); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Final Results</DialogTitle>
            <DialogDescription>Ranking by total wealth = Cash + Current value of holdings</DialogDescription>
          </DialogHeader>
          <div className="mb-4 p-3 border rounded bg-gray-50 flex items-center gap-2">
            <input
              type="checkbox"
              id="approveEndGame"
              checked={allPlayersApproved}
              onChange={(e) => setAllPlayersApproved(e.target.checked)}
            />
            <label htmlFor="approveEndGame" className="font-medium">All players approve to end the game</label>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-gray-50">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Cash</th>
                  <th className="px-3 py-2">Holdings Value</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, idx) => (
                  <tr key={row.player.id} className="border-b">
                    <td className="px-3 py-2 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2">{row.player.name}</td>
                    <td className="px-3 py-2">₹{row.player.balance.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">₹{row.holdingsValue.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 font-semibold">₹{row.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowEndGame(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              disabled={!allPlayersApproved}
              onClick={() => {
                setShowEndGame(false);
                onResetGame();
              }}
            >
              <Trophy className="w-4 h-4" />
              End Game & Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
