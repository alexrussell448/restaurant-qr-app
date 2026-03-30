"use client";

import { useState } from "react";

export default function TablePage({ params }: { params: { tableId: string } }) {
  const tableId = params.tableId;

  const [basket, setBasket] = useState<any[]>([]);

  const addToBasket = (item: any) => {
    setBasket((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  return (
    <div className="min-h-screen bg-[#1c5f35] text-white relative pt-12 md:pt-0">

      {/* 🔹 MOBILE TOP STRIP */}
      <div className="fixed top-0 left-0 right-0 z-20 md:hidden bg-[#1c5f35]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-center gap-4 py-2">
          <img
            src="/brand/fratelli-logo-p-2000.png"
            alt=""
            className="w-8 h-8 object-contain opacity-90 pointer-events-none"
          />
          <img
            src="/brand/fratelli-logo-pizza-p-2000.png"
            alt="Fratelli"
            className="h-8 w-auto object-contain"
          />
          <img
            src="/brand/fratelli-logo-p-2000.png"
            alt=""
            className="w-8 h-8 object-contain opacity-90 pointer-events-none"
          />
        </div>
      </div>

      {/* 🔹 DESKTOP SIDE LOGOS */}
      <img
        src="/brand/fratelli-logo-p-2000.png"
        alt=""
        className="hidden md:block fixed left-2 top-1/2 -translate-y-1/2 w-24 lg:w-32 opacity-80 pointer-events-none z-10"
      />
      <img
        src="/brand/fratelli-logo-p-2000.png"
        alt=""
        className="hidden md:block fixed right-2 top-1/2 -translate-y-1/2 w-24 lg:w-32 opacity-80 pointer-events-none z-10"
      />

      {/* 🔹 HEADER */}
      <div className="max-w-5xl mx-auto px-4 py-6 text-center">
        <img
          src="/brand/fratelli-logo-pizza-p-2000.png"
          alt="Fratelli"
          className="w-24 mx-auto mb-4"
        />

        <p className="text-xs tracking-[0.2em] text-white/70 mb-1">
          TABLE {tableId}
        </p>

        <h1 className="text-3xl md:text-5xl font-black mb-2">
          BUILD YOUR ORDER
        </h1>

        <p className="text-white/80 text-sm">
          Tap any item to add. Open basket to adjust quantities and add notes.
        </p>
      </div>

      {/* 🔹 SAMPLE MENU (keep yours here) */}
      <div className="max-w-5xl mx-auto px-4 pb-32 space-y-4">
        <h2 className="text-2xl font-bold">The Dips</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["Basil Pesto", "Garlic Aioli", "House Chilli"].map((name) => (
            <div
              key={name}
              onClick={() => addToBasket({ name })}
              className="bg-black/20 border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-black/30 transition"
            >
              <div className="w-16 h-16 bg-white/10 rounded-xl"></div>
              <div>
                <p className="font-bold">{name}</p>
                <p className="text-xs text-white/60">Tap to add</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 FLOATING BASKET BUTTON */}
      <button className="fixed bottom-6 right-6 bg-[#f7931e] text-black font-bold px-5 py-3 rounded-full shadow-lg">
        Basket ({basket.reduce((a, b) => a + b.qty, 0)})
      </button>
    </div>
  );
}