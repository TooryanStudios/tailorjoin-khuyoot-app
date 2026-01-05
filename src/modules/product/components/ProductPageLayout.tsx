import React from 'react';

export type ProductPageLayoutProps = {
  left: React.ReactNode;
  children: React.ReactNode;
  swapPanels?: boolean;
};

export function ProductPageLayout({ left, children, swapPanels = false }: ProductPageLayoutProps) {
  return (
    <main
      className={`flex flex-col lg:flex-row w-full bg-slate-950 h-[calc(var(--app-height)-var(--header-height)-var(--footer-height)-env(safe-area-inset-bottom))] lg:h-[calc(var(--app-height)-var(--header-height))] overflow-y-auto lg:overflow-hidden custom-scrollbar ${
        swapPanels ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* LEFT PANE: Full-Bleed Imagery */}
      <section className="relative w-full lg:w-[60%] flex-shrink-0 overflow-hidden aspect-[3/4] lg:aspect-auto lg:h-full">
        {left}
      </section>

      {/* RIGHT PANE: Unified Scrollable Details */}
      <section className="w-full lg:w-[40%] bg-white dark:bg-slate-900 overflow-visible lg:overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">{children}</div>
      </section>
    </main>
  );
}
