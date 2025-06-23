import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Company {
  name: string;
  price: number;
  availableShares: number;
}

interface ManagePricesModalProps {
  companies: Company[];
  priceInputs: { [key: string]: string };
  lastDeltas: { [key: string]: number };
  handleInputChange: (companyName: string, value: string) => void;
  updateCompanyPriceByDelta: (companyName: string, delta: number) => void;
  suspendLastOperation: (companyName: string) => void;
}

export const ManagePricesModal = ({
  companies,
  priceInputs,
  lastDeltas,
  handleInputChange,
  updateCompanyPriceByDelta,
  suspendLastOperation,
}: ManagePricesModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Manage Prices</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Company Share Prices</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {companies.map((company) => {
            const imagePath = `/logos/${company.name.replace(/\s+/g, '').toLowerCase()}.png`;

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
                  <div className="text-blue-600 font-semibold">₹{company.price}</div>

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
      </DialogContent>
    </Dialog>
  );
};
