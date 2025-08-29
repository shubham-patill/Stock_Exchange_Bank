import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { TrendingUp } from 'lucide-react';

interface Company {
  name: string;
  price: number;
  priceHistory: { price: number; timestamp: Date }[];
}

interface PriceChangesModalProps {
  companies: Company[];
  onEndTurn?: () => void;
}

export const PriceChangesModal = ({ companies, onEndTurn }: PriceChangesModalProps) => {
  // Build per-company arrays of price changes (exclude initial and zero-delta)
  const companyChanges = companies.map((company) => {
    const history = company.priceHistory || [];
    const changes = history
      .map((entry, idx, arr) => {
        const prev = idx > 0 ? arr[idx - 1].price : null;
        const ts = new Date(entry.timestamp);
        const change = prev !== null ? entry.price - prev : null;
        return {
          price: entry.price,
          prev,
          change,
          timestamp: ts,
        };
      })
      .filter((e) => e.prev !== null && (e.change ?? 0) !== 0);
    return { company, changes, initial: (company.priceHistory && company.priceHistory[0]) || null };
  });

  // Determine the maximum number of changes among companies to define row count
  const maxRows = companyChanges.reduce((max, c) => Math.max(max, c.changes.length), 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          View Price Changes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Price Changes</DialogTitle>
        </DialogHeader>

        {maxRows === 0 && companyChanges.every(c => !c.initial) ? (
          <div className="text-sm text-gray-500 p-4">No price data yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-500">
                  {companyChanges.map(({ company }) => (
                    <th
                      key={company.name}
                      className="px-3 py-2 text-left bg-gray-50 border-x border-gray-500 first:border-l-0 last:border-r-0"
                    >
                      <span className="font-medium">{company.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500">
                {/* Start prices row */}
                <tr className="bg-gray-50/60">
                  {companyChanges.map(({ company, initial }) => (
                    <td
                      key={company.name}
                      className="px-3 py-2 border-x border-gray-500 first:border-l-0 last:border-r-0"
                    >
                      {initial ? (
                        <div className="text-[13px]">₹{initial.price.toFixed(2)}</div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                {Array.from({ length: maxRows }).map((_, rowIdx) => (
                  <tr key={rowIdx}>
                    {companyChanges.map(({ company, changes }) => {
                      const item = changes[rowIdx];
                      if (!item) {
                        return (
                          <td
                            key={company.name}
                            className="px-3 py-2 text-gray-300 border-x border-gray-500 first:border-l-0 last:border-r-0"
                          >
                            —
                          </td>
                        );
                      }
                      const sign = (item.change ?? 0) > 0 ? '+' : '';
                      const color = (item.change ?? 0) > 0 ? 'text-green-600' : 'text-red-600';
                      return (
                        <td
                          key={company.name}
                          className="px-3 py-2 border-x border-gray-500 first:border-l-0 last:border-r-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className={`text-[13px] font-semibold ${color}`}>
                              ₹{item.price.toFixed(2)}
                            </div>
                            <div className={`text-[12px] font-medium text-gray-700`}>
                              {sign}{(item.change ?? 0).toFixed(2)}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button
              onClick={() => {
                onEndTurn?.();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Done (End Turn)
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
