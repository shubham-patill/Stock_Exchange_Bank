import * as React from 'react';
import { Player } from '@/pages/Index';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, EyeOff, KeyRound, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerOnboardingProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  onComplete: () => void;
}

export const PlayerOnboarding: React.FC<PlayerOnboardingProps> = ({ players, setPlayers, onComplete }) => {
  const [names, setNames] = React.useState<Record<number, string>>(() => Object.fromEntries(players.map(p => [p.id, p.name])));
  const [ack, setAck] = React.useState<Record<number, boolean>>(() => Object.fromEntries(players.map(p => [p.id, false])));
  const [openDialogFor, setOpenDialogFor] = React.useState<number | null>(null);
  const [reveal, setReveal] = React.useState<boolean>(false);

  const updateName = (id: number, value: string) => {
    setNames(prev => ({ ...prev, [id]: value }));
  };

  const applyNames = () => {
    const updated = players.map(p => ({ ...p, name: (names[p.id] || `Player ${p.id}`).trim() || `Player ${p.id}` }));
    setPlayers(updated);
    toast.success('Player names saved');
  };

  const allValid = players.every(p => (names[p.id]?.trim().length ?? 0) > 0) && players.every(p => ack[p.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-2xl border-0 bg-white/85 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Player Setup</CardTitle>
          <CardDescription>Enter each player's name. Privately reveal and note your 4-digit code. All players must acknowledge before continuing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map(p => (
              <div key={p.id} className="p-3 rounded border bg-white/70">
                <div className="text-sm text-gray-600 mb-1">Player {p.id}</div>
                <Input
                  value={names[p.id] || ''}
                  onChange={(e) => updateName(p.id, e.target.value)}
                  placeholder={`Name for Player ${p.id}`}
                  className="mb-2"
                />
                <div className="flex items-center gap-2">
                  <Dialog open={openDialogFor === p.id} onOpenChange={(open) => { setOpenDialogFor(open ? p.id : null); setReveal(false); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4" /> Reveal Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>{names[p.id]?.trim() || `Player ${p.id}`} - Secret Code</DialogTitle>
                        <DialogDescription>Keep this private. Do not show others.</DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center gap-3 py-2">
                        <div className="text-2xl font-mono tracking-widest select-all">
                          {reveal ? p.secretCode : '•'.repeat(4)}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setReveal(v => !v)} aria-label={reveal ? 'Hide code' : 'Reveal code'}>
                          {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(p.secretCode);
                              toast.success('Code copied');
                            } catch {
                              toast.error('Failed to copy');
                            }
                          }}
                        >
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id={`ack-${p.id}`}
                          type="checkbox"
                          checked={!!ack[p.id]}
                          onChange={(e) => setAck(prev => ({ ...prev, [p.id]: e.target.checked }))}
                        />
                        <label htmlFor={`ack-${p.id}`} className="text-sm">I have noted my code</label>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {ack[p.id] && (
                    <span title="Acknowledged">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button variant="secondary" onClick={applyNames}>Save Names</Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              disabled={!allValid}
              onClick={() => {
                applyNames();
                onComplete();
              }}
            >
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
