import { useState } from 'react';
import { Player, Transaction } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, TrendingUp, History, RotateCcw, Edit3, Check, ShoppingCart, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  name: string;
  price: number;
  availableShares: number;
}

interface PlayerCardProps {
  player: Player;
  onUpdatePlayer: (player: Player) => void;
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
}

export const PlayerCard = ({ player, onUpdatePlayer, companies, setCompanies }: PlayerCardProps) => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [lastState, setLastState] = useState<Player | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [buyStep, setBuyStep] = useState<1 | 2>(1);
  const [sellStep, setSellStep] = useState<1 | 2>(1);
  const [selectedBuyCompany, setSelectedBuyCompany] = useState<string | null>(null);
  const [selectedSellCompany, setSelectedSellCompany] = useState<string | null>(null);
  const [buyInputs, setBuyInputs] = useState<{ [key: string]: string }>({});
  const [sellInputs, setSellInputs] = useState<{ [key: string]: string }>({});
  const [rightIssueInputs, setRightIssueInputs] = useState<{ [key: string]: string }>({});
  const [showRightIssueModal, setShowRightIssueModal] = useState(false);
  const [rightIssueStep, setRightIssueStep] = useState<1 | 2>(1);
  const [selectedRightIssueCompany, setSelectedRightIssueCompany] = useState<string | null>(null);
  const [rightIssueCheckbox, setRightIssueCheckbox] = useState(false);
  const [rightIssueInput, setRightIssueInput] = useState<{ [key: string]: string }>({});
  const [rightIssueCashInput, setRightIssueCashInput] = useState<{ [key: string]: string }>({});
  const [rightIssueCalcResult, setRightIssueCalcResult] = useState<{ [key: string]: { buyNow: number, nextRightIssue: number } }>({});

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

  // Buy shares function
  const buyShares = (companyName: string, quantity: number) => {
    const company = companies.find(c => c.name === companyName);
    
    if (!company) return;

    // Check minimum share requirement
    if (quantity < 1000) {
      toast.error(`Minimum purchase requirement is 1000 shares.`);
      return;
    }

    const totalCost = quantity * company.price;
    
    // Check if player has enough balance
    if (player.balance < totalCost) {
      toast.error(`${player.name} doesn't have enough balance to buy ${quantity} shares.`);
      return;
    }

    // Check if company has enough shares
    if (company.availableShares < quantity) {
      toast.error(`${company.name} doesn't have enough shares available.`);
      return;
    }

    // Update player
    const currentHoldings = player.holdings || {};
    const updatedPlayer: Player = {
      ...player,
      balance: player.balance - totalCost,
      holdings: {
        ...currentHoldings,
        [companyName]: (currentHoldings[companyName] || 0) + quantity
      },
      transactions: [
        {
          id: `buy-${Date.now()}`,
          type: 'subtract',
          amount: totalCost,
          timestamp: new Date(),
          description: `Bought ${quantity} shares of ${companyName} at ₹${company.price}`
        },
        ...player.transactions
      ]
    };

    onUpdatePlayer(updatedPlayer);

    // Update company available shares
    setCompanies(companies.map(c => 
      c.name === companyName 
        ? { ...c, availableShares: c.availableShares - quantity }
        : c
    ));

    // Clear input
    setBuyInputs((prev) => ({ ...prev, [companyName]: '' }));

    toast.success(`${player.name} bought ${quantity} shares of ${companyName} for ₹${totalCost}`);
  };

  // Sell shares function
  const sellShares = (companyName: string, quantity: number) => {
    const company = companies.find(c => c.name === companyName);
    
    if (!company) return;

    const currentHoldings = player.holdings || {};
    const playerShares = currentHoldings[companyName] || 0;

    // Check minimum share requirement
    if (quantity < 1000) {
      toast.error(`Minimum sale requirement is 1000 shares.`);
      return;
    }

    // Check if player has enough shares
    if (playerShares < quantity) {
      toast.error(`${player.name} doesn't have enough shares of ${companyName} to sell.`);
      return;
    }

    const totalValue = quantity * company.price;

    // Update player
    const updatedPlayer: Player = {
      ...player,
      balance: player.balance + totalValue,
      holdings: {
        ...currentHoldings,
        [companyName]: playerShares - quantity
      },
      transactions: [
        {
          id: `sell-${Date.now()}`,
          type: 'add',
          amount: totalValue,
          timestamp: new Date(),
          description: `Sold ${quantity} shares of ${companyName} at ₹${company.price}`
        },
        ...player.transactions
      ]
    };

    onUpdatePlayer(updatedPlayer);

    // Update company available shares
    setCompanies(companies.map(c => 
      c.name === companyName 
        ? { ...c, availableShares: c.availableShares + quantity }
        : c
    ));

    // Clear input
    setSellInputs((prev) => ({ ...prev, [companyName]: '' }));

    toast.success(`${player.name} sold ${quantity} shares of ${companyName} for ₹${totalValue}`);
  };

  // Right Issue buy logic
  const handleRightIssueBuy = (companyName: string, quantity: number, useRightIssue: boolean) => {
    const company = companies.find(c => c.name === companyName);
    if (!company) return;

    const currentHoldings = player.holdings?.[companyName] || 0;
    let price = company.price;
    let maxQty = company.availableShares;
    if (useRightIssue) {
      price = Math.ceil((company.price * 0.5) / 5) * 5;
      maxQty = Math.floor(currentHoldings * 0.5);
      if (quantity > maxQty) {
        toast.error(`Right issue can only buy up to ${maxQty} shares (50% of current holdings).`);
        return;
      }
    }
    if (quantity < 1000) {
      toast.error(`Minimum purchase requirement is 1000 shares.`);
      return;
    }
    const totalCost = quantity * price;
    if (player.balance < totalCost) {
      toast.error(`${player.name} doesn't have enough balance to buy ${quantity} shares.`);
      return;
    }
    if (company.availableShares < quantity) {
      toast.error(`${company.name} doesn't have enough shares available.`);
      return;
    }
    // Update player
    const updatedPlayer: Player = {
      ...player,
      balance: player.balance - totalCost,
      holdings: {
        ...player.holdings,
        [companyName]: (player.holdings?.[companyName] || 0) + quantity
      },
      transactions: [
        {
          id: `right-issue-${Date.now()}`,
          type: 'subtract',
          amount: totalCost,
          timestamp: new Date(),
          description: useRightIssue
            ? `Right issue: Bought ${quantity} shares of ${companyName} at ₹${price}`
            : `Bought ${quantity} shares of ${companyName} at ₹${price}`
        },
        ...player.transactions
      ]
    };
    onUpdatePlayer(updatedPlayer);
    setCompanies(companies.map(c =>
      c.name === companyName
        ? { ...c, availableShares: c.availableShares - quantity }
        : c
    ));
    setRightIssueInput((prev) => ({ ...prev, [companyName]: '' }));
    setShowRightIssueModal(false);
    setRightIssueStep(1);
    setSelectedRightIssueCompany(null);
    setRightIssueCheckbox(false);
    toast.success(`${player.name} bought ${quantity} shares of ${companyName} for ₹${totalCost}`);
  };

  // When opening modal, reset to step 1
  const openBuyModal = () => { setShowBuyModal(true); setBuyStep(1); setSelectedBuyCompany(null); };
  const openSellModal = () => { setShowSellModal(true); setSellStep(1); setSelectedSellCompany(null); };

  const calculateRightIssueShares = (company, cash) => {
    // price of share
    const price = company.price;
    // right issue price (rounded up to nearest 5)
    const rightIssuePrice = Math.ceil((price * 0.5) / 5) * 5;
    // equation: ((cash ÷ (price + ((rightIssuePrice) ÷ 2))) ÷ 1000) × 1000
    const denominator = price + (rightIssuePrice / 2);
    let shares = Math.floor((cash / denominator) / 1000) * 1000;
    // cannot exceed max right issue quantity
    const playerHoldings = player.holdings?.[company.name] || 0;
    const maxRightIssueQuantity = Math.floor(playerHoldings * 0.5);
    if (shares > maxRightIssueQuantity) shares = maxRightIssueQuantity;
    return shares;
  };

  const calculateRightIssuePlan = (company, cash) => {
    // price of share
    const price = company.price;
    // right issue price (rounded up to nearest 5)
    const rightIssuePrice = Math.ceil((price * 0.5) / 5) * 5;
    // equation: ((cash ÷ (price + ((rightIssuePrice) ÷ 2))) ÷ 1000) × 1000
    const denominator = price + (rightIssuePrice / 2);
    let buyNow = Math.floor((cash / denominator) / 1000) * 1000;
    if (buyNow < 0) buyNow = 0;
    // next right issue will be 50% of holdings, rounded down to nearest 1000
    let nextRightIssue = Math.floor(buyNow * 0.5 / 1000) * 1000;
    return { buyNow, nextRightIssue };
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
              <Button variant="ghost" size="sm" onClick={handleNameCancel} className="px-2 py-1 text-xs">
                Done
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

      <CardContent className="space-y-3">
        {/* Buy and Sell Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* BUY MODAL */}
          <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
            <DialogTrigger asChild>
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={openBuyModal}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Buy Shares
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Buy Shares - {player.name}</DialogTitle>
              </DialogHeader>
              {buyStep === 1 ? (
                // Step 1: Company selection
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {companies.map(company => {
                    const logoSrc = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
                return (
                      <div
                        key={company.name}
                        className="flex items-center gap-3 p-2 bg-white border rounded shadow-sm cursor-pointer hover:bg-blue-50"
                        onClick={() => { setSelectedBuyCompany(company.name); setBuyStep(2); }}
                      >
                        <img
                          src={logoSrc}
                          alt={company.name}
                          width={60}
                          height={40}
                          className="rounded"
                          onError={e => { (e.target as HTMLImageElement).src = '/logos/default.png'; }}
                        />
                        <div>
                          <div className="font-medium text-sm">{company.name}</div>
                          <div className="text-blue-600 font-bold text-md">₹{company.price}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Available: {company.availableShares} shares
                          </div>
                        </div>
                  </div>
                );
                  })}
                </div>
              ) : (
                // Step 2: Buy UI for selected company
                selectedBuyCompany && (() => {
                  const company = companies.find(c => c.name === selectedBuyCompany);
                  if (!company) return null;
                  const playerHoldings = player.holdings?.[company.name] || 0;
                  const halfPrice = company.price * 0.5;
                  const rightIssuePrice = Math.ceil(halfPrice / 5) * 5;
                  const maxRightIssueQuantity = Math.floor(playerHoldings * 0.5);
                  return (
                    <div>
                      <Button variant="outline" onClick={() => setBuyStep(1)} className="mb-4">← Back</Button>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img src={`/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`} alt={company.name} width={60} height={60} className="rounded shadow" />
                        <div>
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          <p className="text-blue-600 font-bold">₹{company.price} per share</p>
                          <p className="text-sm text-gray-600">Available: {company.availableShares} shares</p>
                          {playerHoldings > 0 && (
                            <p className="text-sm text-green-600">Your holdings: {playerHoldings} shares</p>
            )}
          </div>
        </div>
                      {/* Regular Buy */}
                      <div className="space-y-2 mt-4">
                        <h4 className="font-medium">Buy Shares:</h4>
                        <p className="text-xs text-gray-600">Minimum purchase: 1000 shares</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={buyInputs[company.name] || ''}
                            onChange={(e) => setBuyInputs((prev) => ({ ...prev, [company.name]: e.target.value }))}
                            placeholder="Quantity (min 1000)"
                            min="1000"
                            max={company.availableShares}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => buyShares(company.name, parseInt(buyInputs[company.name] || '0'))}
                            disabled={!buyInputs[company.name] || parseInt(buyInputs[company.name]) < 1000 || parseInt(buyInputs[company.name]) > company.availableShares}
                          >
                            Buy
                          </Button>
                        </div>
                      </div>
                      {/* Right Issue */}
                      {playerHoldings > 0 && (
                        <div className="space-y-2 mt-4">
                          <h4 className="font-medium">Right Issue (₹{rightIssuePrice} per share):</h4>
                          <p className="text-xs text-gray-600">
                            Can buy up to {maxRightIssueQuantity} shares (50% of current holdings)
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={rightIssueInputs[company.name] || ''}
                              onChange={(e) => setRightIssueInputs((prev) => ({ ...prev, [company.name]: e.target.value }))}
                              placeholder="Quantity"
                              min="1"
                              max={maxRightIssueQuantity}
                              className="flex-1"
                            />
                            <Button
                              variant="secondary"
                              onClick={() => handleRightIssueBuy(company.name, parseInt(rightIssueInputs[company.name] || '0'), false)}
                              disabled={!rightIssueInputs[company.name] || parseInt(rightIssueInputs[company.name]) <= 0 || parseInt(rightIssueInputs[company.name]) > maxRightIssueQuantity}
                            >
                              Right Issue
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </DialogContent>
          </Dialog>

          {/* SELL MODAL */}
          <Dialog open={showSellModal} onOpenChange={setShowSellModal}>
            <DialogTrigger asChild>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={openSellModal}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Sell Shares
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Sell Shares - {player.name}</DialogTitle>
              </DialogHeader>
              {sellStep === 1 ? (
                // Step 1: Company selection (only companies player owns)
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {Object.entries(player.holdings || {}).filter(([_, qty]) => qty > 0).map(([companyName]) => {
                    const company = companies.find(c => c.name === companyName);
                    if (!company) return null;
                    const logoSrc = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
                    return (
                      <div
                        key={company.name}
                        className="flex items-center gap-3 p-2 bg-white border rounded shadow-sm cursor-pointer hover:bg-red-50"
                        onClick={() => { setSelectedSellCompany(company.name); setSellStep(2); }}
                      >
                        <img
                          src={logoSrc}
                          alt={company.name}
                          width={60}
                          height={40}
                          className="rounded"
                          onError={e => { (e.target as HTMLImageElement).src = '/logos/default.png'; }}
                        />
                        <div>
                          <div className="font-medium text-sm">{company.name}</div>
                          <div className="text-blue-600 font-bold text-md">₹{company.price}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            You own: {player.holdings?.[company.name] || 0} shares
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Step 2: Sell UI for selected company
                selectedSellCompany && (() => {
                  const company = companies.find(c => c.name === selectedSellCompany);
                  if (!company) return null;
                  const quantity = player.holdings?.[company.name] || 0;
                  return (
                    <div>
                      <Button variant="outline" onClick={() => setSellStep(1)} className="mb-4">← Back</Button>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img src={`/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`} alt={company.name} width={60} height={60} className="rounded shadow" />
                        <div>
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          <p className="text-blue-600 font-bold">₹{company.price} per share</p>
                          <p className="text-sm text-gray-600">You own: {quantity} shares</p>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <h4 className="font-medium">Sell Shares:</h4>
                        <p className="text-xs text-gray-600">Minimum sale: 1000 shares</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={sellInputs[company.name] || ''}
                            onChange={(e) => setSellInputs((prev) => ({ ...prev, [company.name]: e.target.value }))}
                            placeholder="Quantity (min 1000)"
                            min="1000"
                            max={quantity}
                            className="w-20"
                          />
                          <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            variant="default"
                            onClick={() => sellShares(company.name, parseInt(sellInputs[company.name] || '0'))}
                            disabled={!sellInputs[company.name] || parseInt(sellInputs[company.name]) < 1000 || parseInt(sellInputs[company.name]) > quantity}
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Dialog open={showRightIssueModal} onOpenChange={setShowRightIssueModal}>
            <DialogTrigger asChild>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => {
                  setShowRightIssueModal(true);
                  setRightIssueStep(1);
                  setSelectedRightIssueCompany(null);
                  setRightIssueCheckbox(false);
                }}
              >
                Right Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Right Issue - {player.name}</DialogTitle>
              </DialogHeader>
              {rightIssueStep === 1 ? (
                // Step 1: Company selection (only companies player owns)
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {companies.map(company => {
                    const logoSrc = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
                    const playerHoldings = player.holdings?.[company.name] || 0;
                    return (
                      <div
                        key={company.name}
                        className="flex items-center gap-3 p-2 bg-white border rounded shadow-sm cursor-pointer hover:bg-yellow-50"
                        onClick={() => { setSelectedRightIssueCompany(company.name); setRightIssueStep(2); }}
                      >
                        <img
                          src={logoSrc}
                          alt={company.name}
                          width={60}
                          height={40}
                          className="rounded"
                          onError={e => { (e.target as HTMLImageElement).src = '/logos/default.png'; }}
                        />
                        <div>
                          <div className="font-medium text-sm">{company.name}</div>
                          <div className="text-blue-600 font-bold text-md">₹{company.price}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            You own: {playerHoldings} shares
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Step 2: Right Issue UI for selected company
                selectedRightIssueCompany && (() => {
                  const company = companies.find(c => c.name === selectedRightIssueCompany);
                  if (!company) return null;
                  const playerHoldings = player.holdings?.[company.name] || 0;
                  const rightIssuePrice = Math.ceil((company.price * 0.5) / 5) * 5;
                  const maxRightIssueQuantity = Math.floor(playerHoldings * 0.5);
                  const priceToShow = rightIssueCheckbox ? rightIssuePrice : company.price;
                  const maxQty = rightIssueCheckbox ? maxRightIssueQuantity : company.availableShares;
                  return (
                    <div>
                      <Button variant="outline" onClick={() => setRightIssueStep(1)} className="mb-4">← Back</Button>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img src={`/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`} alt={company.name} width={60} height={60} className="rounded shadow" />
                        <div>
                          <h3 className="font-semibold text-lg">{company.name}</h3>
                          <p className="text-blue-600 font-bold">
                            ₹{priceToShow} per share
                            {rightIssueCheckbox && <span className="ml-2 text-xs text-yellow-600">(Right Issue Price)</span>}
                          </p>
                          <p className="text-sm text-gray-600">Available: {company.availableShares} shares</p>
                          <p className="text-sm text-green-600">Your holdings: {playerHoldings} shares</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          id="right-issue-checkbox"
                          checked={rightIssueCheckbox}
                          onChange={e => setRightIssueCheckbox(e.target.checked)}
                        />
                        <label htmlFor="right-issue-checkbox" className="text-sm font-medium">
                          Use Right Issue (50% price, max {maxRightIssueQuantity} shares)
                        </label>
                      </div>
                      <div className="space-y-2 mt-4">
                        <h4 className="font-medium">Right Issue Planning Calculator:</h4>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            value={rightIssueCashInput[company.name] || ''}
                            onChange={e => setRightIssueCashInput(prev => ({ ...prev, [company.name]: e.target.value }))}
                            placeholder={`Enter cash to use (default: your balance ₹${player.balance})`}
                            min="0"
                            className="flex-1"
                          />
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            onClick={() => {
                              const cash = rightIssueCashInput[company.name]
                                ? parseFloat(rightIssueCashInput[company.name])
                                : player.balance;
                              const result = calculateRightIssuePlan(company, cash);
                              setRightIssueCalcResult(prev => ({
                                ...prev,
                                [company.name]: result
                              }));
                            }}
                          >
                            Calculate
                          </Button>
                          <Button
                            className="bg-yellow-700 hover:bg-yellow-800 text-white"
                            onClick={() => {
                              const result = calculateRightIssuePlan(company, player.balance);
                              setRightIssueCalcResult(prev => ({
                                ...prev,
                                [company.name]: result
                              }));
                            }}
                          >
                            Calculate All
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600">
                          Formula: ((Cash ÷ (Price + (Price ÷ 2))) ÷ 1000) × 1000<br />
                          Right Issue Price: ₹{rightIssuePrice} per share
                        </p>
                        {rightIssueCalcResult[company.name] && (
                          <div className="mt-2 text-sm text-blue-700">
                            If you buy <b>{rightIssueCalcResult[company.name].buyNow}</b> shares now,
                            your next right issue will allow you to buy <b>{rightIssueCalcResult[company.name].nextRightIssue}</b> shares at 50% price.
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 mt-4">
                        <h4 className="font-medium">Buy Shares:</h4>
                        <p className="text-xs text-gray-600">
                          {rightIssueCheckbox
                            ? `Minimum purchase: 1000 shares, max: ${maxRightIssueQuantity} shares (50% of holdings)`
                            : `Minimum purchase: 1000 shares`}
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={rightIssueInput[company.name] || ''}
                            onChange={(e) => setRightIssueInput((prev) => ({ ...prev, [company.name]: e.target.value }))}
                            placeholder={`Quantity (min 1000${rightIssueCheckbox ? `, max ${maxRightIssueQuantity}` : ''})`}
                            min="1000"
                            max={maxQty}
                            className="flex-1"
                          />
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            onClick={() => handleRightIssueBuy(company.name, parseInt(rightIssueInput[company.name] || '0'), rightIssueCheckbox)}
                            disabled={
                              !rightIssueInput[company.name] ||
                              parseInt(rightIssueInput[company.name]) < 1000 ||
                              parseInt(rightIssueInput[company.name]) > maxQty
                            }
                          >
                            Buy
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleLSM}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Loan Stock
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
