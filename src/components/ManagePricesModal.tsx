import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface Company {
  name: string;
  price: number;
  availableShares: number;
  priceHistory: { price: number; timestamp: Date }[];
}

interface ManagePricesModalProps {
  companies: Company[];
  priceInputs: { [key: string]: string };
  lastDeltas: { [key: string]: number };
  handleInputChange: (companyName: string, value: string) => void;
  updateCompanyPriceByDelta: (companyName: string, delta: number) => void;
  suspendLastOperation: (companyName: string) => void;
  onDone?: () => void;
}

export const ManagePricesModal = ({
  companies,
  priceInputs,
  lastDeltas,
  handleInputChange,
  updateCompanyPriceByDelta,
  suspendLastOperation,
  onDone,
}: ManagePricesModalProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" onClick={() => setOpen(true)}>Manage Prices</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Company Share Prices</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {companies.map((company) => {
            const imagePath = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;
            const priceHistory = company.priceHistory || [];
            const previousPrice =
              priceHistory.length > 1
                ? priceHistory[priceHistory.length - 2].price
                : null;
            const variation = previousPrice !== null ? company.price - previousPrice : null;

            return (
              <div
                key={company.name}
                className="flex items-center gap-4 p-3 bg-gray-50 border rounded"
              >
                {/* Company Logo */}
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

                <div className="flex flex-col gap-1 w-full">
                  <div className="font-medium">{company.name}</div>
                  <div className="text-blue-600 font-semibold">
                    ₹{company.price}
                    {variation !== null && (
                      <span
                        className={`ml-2 text-sm ${
                          variation > 0
                            ? 'text-green-600'
                            : variation < 0
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        ({variation > 0 ? '+' : ''}
                        {variation.toFixed(2)})
                      </span>
                    )}
                  </div>
                  {previousPrice !== null && (
                    <div className="text-xs text-gray-500">
                      Prev: ₹{previousPrice.toFixed(2)}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      value={priceInputs[company.name] || ''}
                      onChange={(e) => handleInputChange(company.name, e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      placeholder="+/-"
                      step={5}
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        updateCompanyPriceByDelta(
                          company.name,
                          Number(priceInputs[company.name] || 0)
                        )
                      }
                      className="px-2 py-1"
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateCompanyPriceByDelta(
                          company.name,
                          -Number(priceInputs[company.name] || 0)
                        )
                      }
                      className="px-2 py-1"
                    >
                      −
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => suspendLastOperation(company.name)}
                      disabled={!lastDeltas[company.name]}
                      className="px-2 py-1"
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              onDone && onDone();
              setOpen(false);
            }}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
