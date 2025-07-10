import { useState } from 'react';
import { Player } from '@/pages/Index';
import { PlayerCard } from '@/components/PlayerCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Banknote, Eye } from 'lucide-react';
import { ManagePricesModal } from '@/components/ManagePricesModal';
import { ManageShareModal } from '@/components/ManageShareModal';

interface DashboardProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  onResetGame: () => void;
}

interface Company {
  name: string;
  price: number;
  availableShares: number;
}
// https://github.com/shubham-patill/StockBank.git
const initialCompanies: Company[] = [
  { name: 'SunPharma', price: 25.0, availableShares: 200000 },
  { name: 'ICICI Bank', price: 35.0, availableShares: 200000 },
  { name: 'Tisco', price: 45.0, availableShares: 200000 },
  { name: 'Adani', price: 55.0, availableShares: 200000 },      // changed from 'Adani Gas'
  { name: 'Reliance', price: 70.0, availableShares: 200000 },
  { name: 'TCS', price: 80.0, availableShares: 200000 },        // changed from 'Infosys'
];

export const Dashboard = ({ players, setPlayers, onResetGame }: DashboardProps) => {
  const totalBalance = players.reduce((sum, player) => sum + player.balance, 0);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [showShares, setShowShares] = useState(false);

  // State for ManagePricesModal
  const [priceInputs, setPriceInputs] = useState<{ [key: string]: string }>({});
  const [lastDeltas, setLastDeltas] = useState<{ [key: string]: number }>({});

  const handleInputChange = (companyName: string, value: string) => {
    setPriceInputs((prev) => ({ ...prev, [companyName]: value }));
  };

  const updateCompanyPriceByDelta = (companyName: string, delta: number) => {
    if (!delta) return;
    setCompanies((prev) =>
      prev.map((c) =>
        c.name === companyName
          ? { ...c, price: Math.max(0, c.price + delta) }
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
            ? { ...c, price: Math.max(0, c.price - delta) }
            : c
        )
      );
      setLastDeltas((prev) => ({ ...prev, [companyName]: 0 }));
    }
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(players.map(player => player.id === updatedPlayer.id ? updatedPlayer : player));
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
                ZSE Bank Dashboard
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
            <ManageShareModal
              players={players}
              setPlayers={setPlayers}
              companies={companies}
              setCompanies={setCompanies}
            />
            <Button
              onClick={() => setShowShares(!showShares)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showShares ? 'Hide Shares' : 'Show Shares'}
            </Button>
            <Button
              onClick={onResetGame}
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New Game
            </Button>
          </div>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {companies.map(company => {
            const logoSrc = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
            return (
              <div key={company.name} className="flex items-center gap-3 p-2 bg-white border rounded shadow-sm">
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
                <div className="flex flex-col w-full">
                  <div className="font-medium text-sm">{company.name}</div>
                  <div className="text-blue-600 font-bold text-md">₹{company.price}</div>
                  {showShares && (
                    <div className="text-xs text-gray-600 mt-1">
                      Available: {company.availableShares} shares
                    </div>
                  )}
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
              showShares={showShares}
              companies={companies}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
