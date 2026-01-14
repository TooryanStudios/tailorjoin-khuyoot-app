import React from 'react';

export const ClientListRail: React.FC = () => {
  const clients = Array.from({ length: 16 }).map((_, i) => ({
    id: `client-${i + 1}`,
    name: `عميل ${i + 1}`,
    lastOrder: i % 3 === 0 ? 'عباية' : i % 3 === 1 ? 'ثوب' : 'قميص',
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-bold text-gold-400">العملاء</h2>
        <div className="mt-3">
          <input
            type="text"
            placeholder="بحث عن عميل..."
            className="w-full rounded-xl px-4 py-2 bg-white/5 border border-white/10 outline-none text-sm placeholder-white/40 focus:border-white/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {clients.map((c) => (
          <button
            key={c.id}
            className="w-full text-right px-4 py-3 hover:bg-white/5 transition-colors"
            onClick={() => { /* TODO: select client */ }}
          >
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="text-[11px] text-white/60">آخر طلب: {c.lastOrder}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClientListRail;
