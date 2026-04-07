import { ChevronRight, Plus, Trash2 } from 'lucide-react';

type BillingTabProps = {
  colors: Record<string, any>;
  theme: string;
  paymentMethods: any[];
  isLinking: boolean;
  removingCardId: string | null;
  onAddCard: () => void;
  onRemoveCard: (id: string) => void;
  onLinkUnionBank: () => void;
  onLinkPayPal: () => void;
};

export function BillingTab({
  colors,
  theme,
  paymentMethods,
  isLinking,
  removingCardId,
  onAddCard,
  onRemoveCard,
  onLinkUnionBank,
  onLinkPayPal,
}: BillingTabProps) {
  return (
    <>
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-1 h-6 rounded-full ${theme === 'dark' ? 'bg-violet-500' : 'bg-violet-600'}`} />
          <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: colors.text.primary }}>
            Billing & Registry
          </h2>
        </div>
        <p className="text-sm font-medium opacity-60 leading-relaxed max-w-md" style={{ color: colors.text.secondary }}>
          Manage your commercial standing, subscription tier, and verified payment gateways.
        </p>
      </div>

      <div className="space-y-12">
        <div
          className="relative overflow-hidden rounded-[2.5rem] border p-6 sm:p-8 lg:p-10 transition-all duration-500 group"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            borderColor: colors.border.faint,
          }}
        >
          <div className="absolute top-0 right-0 h-56 w-56 sm:h-64 sm:w-64 bg-violet-500/5 blur-[80px] -mr-20 -mt-20 rounded-full" />

          <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="order-2 min-w-0 flex-1 xl:order-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3 mb-4">
                <span className="inline-flex w-fit px-3 py-1 rounded-full bg-violet-500 text-[9px] font-black uppercase tracking-widest text-white">
                  Active
                </span>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tighter" style={{ color: colors.text.primary }}>
                  Professional Plan
                </h3>
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40 mb-8 max-w-xl" style={{ color: colors.text.secondary }}>
                Standard Monthly Cycle — Next Invoice: April 01, 2026
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                <button className="relative w-full sm:w-auto group/btn overflow-hidden rounded-full px-4 py-2.5 text-[9px] sm:px-5 sm:py-3 sm:text-[10px] lg:px-6 lg:py-3.5 transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-violet-500/10">
                  <div
                    className={`absolute inset-0 transition-opacity group-hover/btn:opacity-90 ${theme === 'dark' ? 'bg-[#FFCC00]' : 'bg-linear-to-r from-violet-600 to-pink-600'}`}
                  />
                  <span
                    className={`relative z-10 font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-[#120533]' : 'text-white'}`}
                  >
                    Upgrade Tier
                  </span>
                </button>
                <button
                  className="w-full sm:w-auto rounded-full border px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:bg-red-500 hover:border-red-500 hover:text-white sm:px-5 sm:py-3 sm:text-[10px] lg:px-6 lg:py-3.5"
                  style={{ borderColor: colors.border.faint}}
                >
                  Cancel Access
                </button>
              </div>
            </div>

            <div className="order-1 shrink-0 text-left xl:order-2 xl:text-right">
              <div className="text-4xl sm:text-5xl font-black tracking-tighter" style={{ color: colors.text.primary }}>
                ₱49<span className="text-base sm:text-lg opacity-30 font-medium">/mo</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-30">Tax inclusive</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-6 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: colors.border.faint }}>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Verified Sources</span>
            </div>
            <button
              onClick={onAddCard}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest text-violet-500 transition-all hover:bg-violet-500/5 hover:border-violet-500/30"
              style={{ borderColor: colors.border.faint }}
            >
              <Plus className="h-3 w-3" /> Add New Card
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {paymentMethods.map((card) => (
              <div
                key={card.id}
                className="group relative flex flex-col gap-4 rounded-3xl border p-5 sm:p-6 transition-all hover:border-violet-500/30 md:flex-row md:items-center md:justify-between"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  borderColor: colors.border.faint,
                }}
              >
                <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                  <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white">
                      {card.type === 'paypal' ? 'PayPal' : card.type === 'unionbank' ? 'UPay' : 'VISA'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold tracking-tight" style={{ color: colors.text.primary }}>
                      {card.type === 'paypal' ? card.email : `•••• •••• •••• ${card.last4}`}
                    </p>
                    <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] opacity-30">
                      {card.type === 'paypal' ? 'Primary Gateway' : `Expiry: ${card.expMonth}/${card.expYear}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveCard(card.id)}
                  className="self-end rounded-full p-3 text-red-500 opacity-80 transition-all hover:bg-red-500/10 hover:opacity-100 md:self-auto md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Remove payment method"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[
              { id: 'ub', label: 'UPay (UnionBank)', color: '#fd6412', action: onLinkUnionBank },
              { id: 'pp', label: 'PayPal International', color: '#003087', action: onLinkPayPal },
            ].map((gate) => (
              <button
                key={gate.id}
                onClick={gate.action}
                className="group relative overflow-hidden flex w-full items-start justify-between gap-4 rounded-xl border p-5 text-left transition-all duration-500 hover:bg-violet-500/2 sm:items-center"
                style={{
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  borderColor: colors.border.faint,
                }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg shadow-md" style={{ backgroundColor: gate.color }}>
                    <span className="text-[8px] font-black text-white">{gate.id.toUpperCase()}</span>
                  </div>
                  <span className="min-w-0 truncate text-xs font-black uppercase tracking-tight" style={{ color: colors.text.primary }}>
                    {gate.label}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-30 transition-all group-hover:opacity-60" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6 border-b pb-4" style={{ borderColor: colors.border.faint }}>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Audit Trail</span>
          </div>

          <div
            className="divide-y divide-white/5 rounded-[2.5rem] border overflow-hidden transition-all duration-500"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              borderColor: colors.border.faint,
            }}
          >
            {[
              { date: 'Jan 01, 2026', amount: '₱49.00', id: 'INV-LX-8801' },
              { date: 'Dec 01, 2025', amount: '₱49.00', id: 'INV-LX-8794' },
              { date: 'Nov 01, 2025', amount: '₱49.00', id: 'INV-LX-8612' },
            ].map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-4 px-4 py-5 transition-all hover:bg-white/5 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                  <div>
                    <p className="text-[11px] font-black tracking-widest" style={{ color: colors.text.primary }}>
                      {invoice.id}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium opacity-40">{invoice.date}</p>
                  </div>
                  <div className="flex w-fit items-center gap-2 rounded-full border border-green-500/10 bg-green-500/5 px-3 py-1">
                    <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Settled</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 lg:gap-8">
                  <p className="text-sm font-black tracking-tighter" style={{ color: colors.text.primary }}>
                    {invoice.amount}
                  </p>
                  <button className="text-[10px] font-black uppercase tracking-widest text-[#FFCC00] opacity-60 transition-all hover:opacity-100 hover:underline">
                    Get PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
