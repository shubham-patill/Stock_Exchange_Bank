import { useState } from 'react';
import { Player, Transaction } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Minus, TrendingUp, History, RotateCcw, Edit3, Check, ShoppingCart, DollarSign, Percent, Eye, EyeOff, KeyRound, Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  name: string;
  price: number;
  availableShares: number;
  priceHistory: { price: number; timestamp: Date }[];
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
  const [isPercentageDialogOpen, setIsPercentageDialogOpen] = useState(false);
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
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [revealCode, setRevealCode] = useState(false);
  const [showDebentureModal, setShowDebentureModal] = useState(false);

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

  const handlePercentageOperation = (action: 'add' | 'subtract', percentage: number) => {
    const currentBalance = player.balance;
    const rawAmount = currentBalance * (percentage / 100);
    
    // If raw percentage amount is below 5000, don't perform transaction
    if (rawAmount < 5000) {
      toast.error('Cash below 5000');
      return;
    }
    
    // Round to nearest multiple of 5000
    let amount = Math.round(rawAmount / 5000) * 5000;
    
    if (action === 'subtract' && amount > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    const description = action === 'add' 
      ? `Cash Added: +${percentage}% (₹${amount.toLocaleString('en-IN')})`
      : `Cash Withdrawn: -${percentage}% (₹${amount.toLocaleString('en-IN')})`;

    addTransaction(action === 'add' ? 'add' : 'subtract', amount, description);
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
    
    // Close modal and reset to step 1
    setShowBuyModal(false);
    setBuyStep(1);
    setSelectedBuyCompany(null);
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
    
    // Close modal and reset to step 1
    setShowSellModal(false);
    setSellStep(1);
    setSelectedSellCompany(null);
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

  const handleDebenture = (companyName: string) => {
    const company = companies.find(c => c.name === companyName);
    const playerHoldingShares = player.holdings?.[companyName] || 0;

    if (!company || playerHoldingShares === 0 || company.price > 0) {
      toast.error("Debenture is not applicable for this company.");
      return;
    }

    const initialPrice = company.priceHistory[0]?.price;
    if (initialPrice === undefined) {
      toast.error("Could not find the initial price for this company.");
      return;
    }

    const saleAmount = playerHoldingShares * initialPrice;

    const updatedHoldings = { ...player.holdings };
    delete updatedHoldings[companyName];

    const updatedPlayer: Player = {
      ...player,
      balance: player.balance + saleAmount,
      holdings: updatedHoldings,
      transactions: [
        {
          id: `debenture-${Date.now()}`,
          type: 'add', // Using 'add' type for color coding, but description is specific
          amount: saleAmount,
          description: `Debenture: Sold ${playerHoldingShares} ${companyName} shares at initial price of ₹${initialPrice}`,
          timestamp: new Date(),
        },
        ...player.transactions,
      ],
    };

    onUpdatePlayer(updatedPlayer);

    // Also update the company's available shares
    setCompanies(companies.map(c =>
      c.name === companyName
        ? { ...c, availableShares: c.availableShares + playerHoldingShares }
        : c
    ));

    toast.success(`Debenture executed for ${companyName}.`);
    setShowDebentureModal(false);
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
                onBlur={handleNameSave} // Save on blur
                autoFocus
              />
              <Button variant="ghost" size="sm" onClick={handleNameSave} className="p-1 h-8 w-8">
                <Check className="w-4 h-4 text-green-600" />
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
          {/* Secret Code viewer */}
          <Dialog open={showCodeDialog} onOpenChange={(open) => { setShowCodeDialog(open); if (!open) setRevealCode(false); }}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2" title="Show secret code">
                <KeyRound className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>{player.name} - Secret Code</DialogTitle>
                <DialogDescription>Keep your code private. Only reveal when you need to confirm.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-3 py-2">
                <div className="text-2xl font-mono tracking-widest select-all">
                  {revealCode ? player.secretCode : '•'.repeat(4)}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setRevealCode((v) => !v)} aria-label={revealCode ? 'Hide code' : 'Reveal code'}>
                  {revealCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(player.secretCode);
                      toast.success('Code copied');
                    } catch {
                      toast.error('Failed to copy');
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <div className="text-3xl font-bold text-green-600">
          ₹{player.balance.toLocaleString('en-IN')}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
                    const isPriceZero = company.price === 0;
                    return (
                      <div
                        key={company.name}
                        className={`flex items-center gap-3 p-2 bg-white border rounded shadow-sm ${
                          isPriceZero
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-blue-50'
                        }`}
                        onClick={() => { if (!isPriceZero) { setSelectedBuyCompany(company.name); setBuyStep(2); } }}
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
                              onClick={() => handleRightIssueBuy(company.name, parseInt(rightIssueInputs[company.name] || '0'), true)}
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
                    const isPriceZero = company.price === 0;
                    return (
                      <div
                        key={company.name}
                        className={`flex items-center gap-3 p-2 bg-white border rounded shadow-sm ${
                          isPriceZero
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-red-50'
                        }`}
                        onClick={() => { if (!isPriceZero) { setSelectedSellCompany(company.name); setSellStep(2); } }}
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
                        <div className="flex gap-2 mt-2">
                          <Button
                            className="bg-red-800 hover:bg-red-900 text-white"
                            variant="default"
                            onClick={() => sellShares(company.name, quantity)}
                            disabled={quantity < 1000}
                          >
                            Sell All ({quantity} shares)
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

        {/* Main Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Dialog open={showDebentureModal} onOpenChange={setShowDebentureModal}>
            <DialogTrigger asChild>
              <Button className="bg-gray-500 hover:bg-gray-600 text-white">
                Debenture
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Debenture Options for {player.name}</DialogTitle>
                <DialogDescription>
                  Sell shares of companies whose price is ₹0 at their original starting price.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-60">
                <div className="space-y-2 pr-4">
                  {companies
                    .filter(company => {
                      const holding = player.holdings?.[company.name] || 0;
                      return company.price === 0 && holding > 0;
                    })
                    .map(company => {
                      const holding = player.holdings?.[company.name] || 0;
                      const initialPrice = company.priceHistory[0]?.price ?? 0;
                      return (
                        <div key={company.name} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-semibold">{company.name}</p>
                            <p className="text-sm text-gray-500">Holding: {holding} shares</p>
                            <p className="text-sm text-gray-500">Initial Price: ₹{initialPrice}</p>
                          </div>
                          <Button size="sm" onClick={() => handleDebenture(company.name)}>
                            Sell for ₹{(holding ?? 0) * initialPrice}
                          </Button>
                        </div>
                      );
                    })}
                  {companies.filter(c => c.price === 0 && (player.holdings?.[c.name] || 0) > 0).length === 0 && (
                    <p className="text-center text-gray-500 py-4">No companies eligible for debenture.</p>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button
            className="bg-purple-500 hover:bg-purple-600 text-white"
            onClick={handleLSM}
          >
            Loan Stock
          </Button>

          <Dialog open={isPercentageDialogOpen} onOpenChange={setIsPercentageDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <span className="font-bold ml-0.5" style={{ fontSize: 'calc(1rem + 2pt)' }}>%</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Percentage Operations</DialogTitle>
                <DialogDescription>
                  Add or subtract a percentage of current balance (₹{player.balance.toLocaleString('en-IN')})
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  onClick={() => {
                    handlePercentageOperation('add', 10);
                    setIsPercentageDialogOpen(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  +10%
                </Button>
                <Button
                  onClick={() => {
                    handlePercentageOperation('add', 20);
                    setIsPercentageDialogOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  +20%
                </Button>
                <Button
                  onClick={() => {
                    handlePercentageOperation('subtract', 10);
                    setIsPercentageDialogOpen(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  -10%
                </Button>
                <Button
                  onClick={() => {
                    handlePercentageOperation('subtract', 20);
                    setIsPercentageDialogOpen(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  -20%
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Issue (moved below as full-width outline) */}
        <Dialog open={showRightIssueModal} onOpenChange={setShowRightIssueModal}>
          <DialogTrigger asChild>
            <Button className="w-full mt-2 bg-yellow-500 hover:bg-yellow-600 text-white">
              Right Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Right Issue - {player.name}</DialogTitle>
              <DialogDescription>
                Buy shares at a discounted rate based on your current holdings.
              </DialogDescription>
            </DialogHeader>
            {rightIssueStep === 1 ? (
              // Step 1: Company selection
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
                const halfPrice = company.price * 0.5;
                const riPrice = Math.ceil(halfPrice / 5) * 5;
                const maxRightIssueQuantity = Math.floor(playerHoldings * 0.5);
                const qtyValue = rightIssueInput[company.name] || '';
                const cashValue = rightIssueCashInput[company.name] || '';
                return (
                  <div>
                    <Button variant="outline" onClick={() => setRightIssueStep(1)} className="mb-4">← Back</Button>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <img src={`/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`} alt={company.name} width={60} height={60} className="rounded shadow" />
                      <div>
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                        <p className="text-blue-600 font-bold">₹{company.price} per share</p>
                        <p className="text-sm text-gray-600">Available: {company.availableShares} shares</p>
                        <p className="text-sm text-green-600">Your holdings: {playerHoldings} shares</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <input id="riToggle" type="checkbox" checked={rightIssueCheckbox} onChange={(e) => setRightIssueCheckbox(e.target.checked)} />
                      <label htmlFor="riToggle" className="text-sm">Use Right Issue (50% price, max {maxRightIssueQuantity} shares)</label>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 rounded border">
                      <div className="font-medium mb-2">Right Issue Planning Calculator:</div>
                      <div className="text-xs text-gray-600 mb-2">Formula: ((Cash ÷ (Price + ((Right Issue Price) ÷ 2))) ÷ 1000) × 1000</div>
                      <div className="text-xs text-gray-700 mb-2">Right Issue Price: ₹{riPrice} per share</div>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={cashValue}
                          onChange={(e) => setRightIssueCashInput((prev) => ({ ...prev, [company.name]: e.target.value }))}
                          placeholder={`Enter cash to use (default: your balance ₹${player.balance.toLocaleString('en-IN')})`}
                          className="flex-1"
                        />
                        <Button
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          onClick={() => {
                            const cash = cashValue ? Number(cashValue) : player.balance;
                            const plan = calculateRightIssuePlan(company, cash);
                            setRightIssueInput((prev) => ({ ...prev, [company.name]: String(plan.buyNow) }));
                            setRightIssueCalcResult((prev) => ({ ...prev, [company.name]: plan }));
                          }}
                        >
                          Calculate
                        </Button>
                      </div>
                      {rightIssueCalcResult[company.name] && (
                        <div className="text-xs text-gray-700 mt-2">
                          Suggested Buy Now: {rightIssueCalcResult[company.name].buyNow} shares · Next Right Issue: {rightIssueCalcResult[company.name].nextRightIssue} shares
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium">Buy Shares:</h4>
                      <p className="text-xs text-gray-600">Minimum purchase: 1000 shares</p>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={qtyValue}
                          onChange={(e) => setRightIssueInput((prev) => ({ ...prev, [company.name]: e.target.value }))}
                          placeholder="Quantity (min 1000)"
                          min={1000}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleRightIssueBuy(company.name, parseInt(qtyValue || '0'), rightIssueCheckbox)}
                          disabled={!qtyValue || parseInt(qtyValue) < 1000 || (rightIssueCheckbox && parseInt(qtyValue) > maxRightIssueQuantity)}
                        >
                          Buy
                        </Button>
                      </div>
                      {rightIssueCheckbox && (
                        <div className="text-xs text-gray-600">Max right issue quantity: {maxRightIssueQuantity} shares</div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
