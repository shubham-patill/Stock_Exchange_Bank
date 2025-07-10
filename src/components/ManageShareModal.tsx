import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Player } from '@/pages/Index';
import { toast } from '@/hooks/use-toast';

interface Company {
  name: string;
  price: number;
  availableShares: number;
}

interface ManageShareModalProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
}

export const ManageShareModal = ({
  players,
  setPlayers,
  companies,
  setCompanies,
}: ManageShareModalProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [buyInputs, setBuyInputs] = useState<{ [key: string]: string }>({});
  const [sellInputs, setSellInputs] = useState<{ [key: string]: string }>({});
  const [rightIssueInputs, setRightIssueInputs] = useState<{ [key: string]: string }>({});

  const handleBuyInputChange = (companyName: string, value: string) => {
    setBuyInputs((prev) => ({ ...prev, [companyName]: value }));
  };

  const handleSellInputChange = (companyName: string, value: string) => {
    setSellInputs((prev) => ({ ...prev, [companyName]: value }));
  };

  const handleRightIssueInputChange = (companyName: string, value: string) => {
    setRightIssueInputs((prev) => ({ ...prev, [companyName]: value }));
  };

  const buyShares = (playerId: number, companyName: string, quantity: number) => {
    const player = players.find(p => p.id === playerId);
    const company = companies.find(c => c.name === companyName);
    
    if (!player || !company) return;

    const totalCost = quantity * company.price;
    
    // Check if player has enough balance
    if (player.balance < totalCost) {
      toast({
        title: "Insufficient Balance",
        description: `${player.name} doesn't have enough balance to buy ${quantity} shares.`,
        variant: "destructive",
      });
      return;
    }

    // Check if company has enough shares
    if (company.availableShares < quantity) {
      toast({
        title: "Insufficient Shares",
        description: `${company.name} doesn't have enough shares available.`,
        variant: "destructive",
      });
      return;
    }

    // Update player
    setPlayers(players.map(p => {
      if (p.id === playerId) {
        const currentHoldings = p.holdings || {};
        return {
          ...p,
          balance: p.balance - totalCost,
          holdings: {
            ...currentHoldings,
            [companyName]: (currentHoldings[companyName] || 0) + quantity
          },
          transactions: [
            ...p.transactions,
            {
              id: `buy-${Date.now()}`,
              type: 'subtract',
              amount: totalCost,
              timestamp: new Date(),
              description: `Bought ${quantity} shares of ${companyName} at ₹${company.price}`
            }
          ]
        };
      }
      return p;
    }));

    // Update company available shares
    setCompanies(companies.map(c => 
      c.name === companyName 
        ? { ...c, availableShares: c.availableShares - quantity }
        : c
    ));

    // Clear input
    setBuyInputs((prev) => ({ ...prev, [companyName]: '' }));

    toast({
      title: "Shares Bought",
      description: `${player.name} bought ${quantity} shares of ${companyName} for ₹${totalCost}`,
    });
  };

  const sellShares = (playerId: number, companyName: string, quantity: number) => {
    const player = players.find(p => p.id === playerId);
    const company = companies.find(c => c.name === companyName);
    
    if (!player || !company) return;

    const currentHoldings = player.holdings || {};
    const playerShares = currentHoldings[companyName] || 0;

    // Check if player has enough shares
    if (playerShares < quantity) {
      toast({
        title: "Insufficient Shares",
        description: `${player.name} doesn't have enough shares of ${companyName} to sell.`,
        variant: "destructive",
      });
      return;
    }

    const totalValue = quantity * company.price;

    // Update player
    setPlayers(players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          balance: p.balance + totalValue,
          holdings: {
            ...currentHoldings,
            [companyName]: playerShares - quantity
          },
          transactions: [
            ...p.transactions,
            {
              id: `sell-${Date.now()}`,
              type: 'add',
              amount: totalValue,
              timestamp: new Date(),
              description: `Sold ${quantity} shares of ${companyName} at ₹${company.price}`
            }
          ]
        };
      }
      return p;
    }));

    // Update company available shares
    setCompanies(companies.map(c => 
      c.name === companyName 
        ? { ...c, availableShares: c.availableShares + quantity }
        : c
    ));

    // Clear input
    setSellInputs((prev) => ({ ...prev, [companyName]: '' }));

    toast({
      title: "Shares Sold",
      description: `${player.name} sold ${quantity} shares of ${companyName} for ₹${totalValue}`,
    });
  };

  const rightIssue = (playerId: number, companyName: string) => {
    const player = players.find(p => p.id === playerId);
    const company = companies.find(c => c.name === companyName);
    
    if (!player || !company) return;

    const currentHoldings = player.holdings || {};
    const playerShares = currentHoldings[companyName] || 0;

    // Check if player has any shares of this company
    if (playerShares === 0) {
      toast({
        title: "No Shares Owned",
        description: `${player.name} doesn't own any shares of ${companyName} to use right issue.`,
        variant: "destructive",
      });
      return;
    }

    // Get quantity from input
    const quantity = parseInt(rightIssueInputs[companyName] || '0');
    
    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity for right issue.",
        variant: "destructive",
      });
      return;
    }

    // Calculate maximum allowed quantity (50% of current holdings)
    const maxRightIssueQuantity = Math.floor(playerShares * 0.5);
    
    if (quantity > maxRightIssueQuantity) {
      toast({
        title: "Exceeds Limit",
        description: `Right issue can only buy up to ${maxRightIssueQuantity} shares (50% of current holdings).`,
        variant: "destructive",
      });
      return;
    }

    // Calculate right issue price (50% of current price, rounded up to nearest 5)
    const halfPrice = company.price * 0.5;
    const rightIssuePrice = Math.ceil(halfPrice / 5) * 5;
    const totalCost = quantity * rightIssuePrice;

    // Check if player has enough balance
    if (player.balance < totalCost) {
      toast({
        title: "Insufficient Balance",
        description: `${player.name} doesn't have enough balance for right issue.`,
        variant: "destructive",
      });
      return;
    }

    // Check if company has enough shares
    if (company.availableShares < quantity) {
      toast({
        title: "Insufficient Shares",
        description: `${company.name} doesn't have enough shares available for right issue.`,
        variant: "destructive",
      });
      return;
    }

    // Update player
    setPlayers(players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          balance: p.balance - totalCost,
          holdings: {
            ...currentHoldings,
            [companyName]: playerShares + quantity
          },
          transactions: [
            ...p.transactions,
            {
              id: `right-${Date.now()}`,
              type: 'subtract',
              amount: totalCost,
              timestamp: new Date(),
              description: `Right issue: Bought ${quantity} shares of ${companyName} at ₹${rightIssuePrice}`
            }
          ]
        };
      }
      return p;
    }));

    // Update company available shares
    setCompanies(companies.map(c => 
      c.name === companyName 
        ? { ...c, availableShares: c.availableShares - quantity }
        : c
    ));

    // Clear input
    setRightIssueInputs((prev) => ({ ...prev, [companyName]: '' }));

    toast({
      title: "Right Issue Executed",
      description: `${player.name} used right issue to buy ${quantity} shares of ${companyName} at ₹${rightIssuePrice} each`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Manage Shares</Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Player Shares</DialogTitle>
        </DialogHeader>
        
        {/* Player Selection */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Select Player:</label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Choose a player...</option>
            {players.map(player => (
              <option key={player.id} value={player.id}>
                {player.name} (₹{player.balance})
              </option>
            ))}
          </select>
        </div>

        {selectedPlayer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companies.map((company) => {
              const player = players.find(p => p.id === parseInt(selectedPlayer));
              const playerHoldings = player?.holdings?.[company.name] || 0;
              const imagePath = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
              const halfPrice = company.price * 0.5;
              const rightIssuePrice = Math.ceil(halfPrice / 5) * 5;
              const maxRightIssueQuantity = Math.floor(playerHoldings * 0.5);

              return (
                <div
                  key={company.name}
                  className="p-3 bg-gray-50 border rounded"
                >
                  {/* Company Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={imagePath}
                      alt={company.name}
                      width={40}
                      height={40}
                      className="rounded shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logos/default.png';
                      }}
                    />
                    <div>
                      <div className="font-medium">{company.name}</div>
                      <div className="text-blue-600 font-semibold">₹{company.price}</div>
                      <div className="text-sm text-gray-600">
                        Available: {company.availableShares} shares
                      </div>
                    </div>
                  </div>

                  {/* Player Holdings */}
                  <div className="mb-2 p-2 bg-blue-50 rounded">
                    <div className="text-sm font-medium">
                      {player?.name}'s Holdings: {playerHoldings} shares
                    </div>
                  </div>

                  {/* Buy Shares */}
                  <div className="mb-2">
                    <div className="text-sm font-medium mb-1">Buy Shares:</div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={buyInputs[company.name] || ''}
                        onChange={(e) => handleBuyInputChange(company.name, e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="Quantity"
                        min="1"
                      />
                      <Button
                        size="sm"
                        onClick={() => buyShares(
                          parseInt(selectedPlayer),
                          company.name,
                          parseInt(buyInputs[company.name] || '0')
                        )}
                        disabled={!buyInputs[company.name] || parseInt(buyInputs[company.name]) <= 0}
                      >
                        Buy
                      </Button>
                    </div>
                  </div>

                  {/* Sell Shares */}
                  <div className="mb-2">
                    <div className="text-sm font-medium mb-1">Sell Shares:</div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={sellInputs[company.name] || ''}
                        onChange={(e) => handleSellInputChange(company.name, e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="Quantity"
                        min="1"
                        max={playerHoldings}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sellShares(
                          parseInt(selectedPlayer),
                          company.name,
                          parseInt(sellInputs[company.name] || '0')
                        )}
                        disabled={!sellInputs[company.name] || parseInt(sellInputs[company.name]) <= 0 || parseInt(sellInputs[company.name]) > playerHoldings}
                      >
                        Sell
                      </Button>
                    </div>
                  </div>

                  {/* Right Issue */}
                  <div>
                    <div className="text-sm font-medium mb-1">
                      Right Issue (₹{rightIssuePrice} per share):
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      Can buy up to {maxRightIssueQuantity} shares (50% of current holdings)
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={rightIssueInputs[company.name] || ''}
                        onChange={(e) => handleRightIssueInputChange(company.name, e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        placeholder="Quantity"
                        min="1"
                        max={maxRightIssueQuantity}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => rightIssue(parseInt(selectedPlayer), company.name)}
                        disabled={!rightIssueInputs[company.name] || parseInt(rightIssueInputs[company.name]) <= 0 || parseInt(rightIssueInputs[company.name]) > maxRightIssueQuantity}
                      >
                        Right Issue
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
