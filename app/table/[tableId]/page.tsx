"use client";

import { use, useMemo, useState } from "react";
import { menu } from "@/lib/menu";
import { supabase } from "@/lib/supabase";

type BasketItem = {
  name: string;
  image: string;
  category: string;
  quantity: number;
  specialRequest: string;
};

const VALID_TABLES = new Set([
  "1", "2", "3", "4", "5", "6",
  "7", "8", "9", "10", "11", "12",
  "20", "21", "22", "23", "24",
]);

export default function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  const { tableId } = use(params);

  const isValidTable = VALID_TABLES.has(tableId);

  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const basketCount = useMemo(
    () => basket.reduce((sum, item) => sum + item.quantity, 0),
    [basket]
  );

  const addToBasket = (item: {
    name: string;
    image: string;
    category: string;
  }) => {
    setBasket((prev) => {
      const existing = prev.find((i) => i.name === item.name);

      if (existing) {
        return prev.map((i) =>
          i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          specialRequest: "",
        },
      ];
    });
  };

  const updateQuantity = (name: string, change: number) => {
    setBasket((prev) =>
      prev
        .map((i) =>
          i.name === name
            ? { ...i, quantity: Math.max(0, i.quantity + change) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const updateSpecialRequest = (name: string, value: string) => {
    setBasket((prev) =>
      prev.map((i) =>
        i.name === name ? { ...i, specialRequest: value } : i
      )
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const getQuantity = (name: string) =>
    basket.find((i) => i.name === name)?.quantity || 0;

  const sendWaiterRequest = async () => {
    if (!isValidTable) return;

    const { error } = await supabase.from("requests").insert([
      {
        table_id: tableId,
        request_type: "waiter",
        status: "new",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error sending waiter request");
      return;
    }

    alert("Waiter has been notified");
  };

  const sendOrder = async () => {
    if (!isValidTable || basket.length === 0 || isSending) return;

    setIsSending(true);

    try {
      const orderGroupId = crypto.randomUUID();

      const rows = basket.map((item) => ({
        table_id: tableId,
        request_type: item.category === "drinks" ? "drinks" : "food",
        item_name: item.name,
        quantity: item.quantity,
        order_group_id: orderGroupId,
        special_request: item.specialRequest.trim() || null,
        status: "new",
      }));

      const { error } = await supabase.from("requests").insert(rows);

      if (error) {
        console.error(error);
        alert("Error sending order");
        return;
      }

      setBasket([]);
      setDrawerOpen(false);
      alert("Order sent");
    } finally {
      setIsSending(false);
    }
  };

  if (!isValidTable) {
    return (
      <div className="min-h-screen bg-[#1c5f35] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-black/20 p-8 text-center shadow-2xl">
          <img
            src="/brand/fratelli-logo-pizza-p-2000.png"
            alt="Fratelli"
            className="w-28 mx-auto mb-6"
          />
          <p className="text-xs tracking-[0.2em] text-white/70 mb-2 uppercase">
            Invalid Table
          </p>
          <h1 className="text-3xl font-black mb-3">Table not recognised</h1>
          <p className="text-white/80 text-sm">
            This QR code or link is not assigned to a valid table. Please speak to a member of staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c5f35] text-white relative">
      <img
        src="/brand/fratelli-logo-p-2000.png"
        alt=""
        className="fixed left-2 top-1/2 -translate-y-1/2 w-24 md:w-32 opacity-80 pointer-events-none z-10"
      />
      <img
        src="/brand/fratelli-logo-p-2000.png"
        alt=""
        className="fixed right-2 top-1/2 -translate-y-1/2 w-24 md:w-32 opacity-80 pointer-events-none z-10"
      />

      <div className="px-4 pt-6 pb-4 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <img
            src="/brand/fratelli-logo-pizza-p-2000.png"
            alt="Fratelli"
            className="w-28 md:w-36"
          />

          <button
            onClick={sendWaiterRequest}
            className="shrink-0 rounded-full border-4 border-black bg-[#f7931e] px-4 py-2 md:px-5 md:py-3 text-black text-sm md:text-base font-bold shadow-lg hover:scale-[1.02] transition"
          >
            REQUEST WAITER
          </button>
        </div>

        <p className="text-xs tracking-[0.2em] text-white/70 mb-1">
          TABLE {tableId}
        </p>

        <h1 className="text-3xl md:text-5xl font-black mb-2">
          BUILD YOUR ORDER
        </h1>

        <p className="text-white/80 text-sm max-w-md">
          Tap any item to add. Open basket to adjust quantities and add notes.
        </p>
      </div>

      <div className="px-4 max-w-5xl mx-auto space-y-8 pb-24">
        {menu.map((section) => (
          <div key={section.category}>
            <h2 className="text-xl md:text-2xl font-black mb-3">
              {section.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.items.map((item) => {
                const quantity = getQuantity(item.name);
                const selected = quantity > 0;

                return (
                  <button
                    key={item.name}
                    onClick={() =>
                      addToBasket({
                        name: item.name,
                        image: item.image,
                        category: section.category,
                      })
                    }
                    className={`text-left rounded-xl border transition ${
                      selected
                        ? "border-[#f7931e] bg-black/30"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        {selected && (
                          <div className="absolute -top-2 -right-2 bg-[#f7931e] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {quantity}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{item.name}</h3>
                        <p className="text-xs text-white/70">
                          {selected ? "Added" : "Tap to add"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-5 right-5 z-40 bg-[#f7931e] text-black font-bold px-5 py-3 rounded-full shadow-lg"
      >
        Basket ({basketCount})
      </button>

      {drawerOpen && (
        <button
          aria-label="Close basket backdrop"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-black/35 z-40"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-50 transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        } bg-[#143d26]/95 backdrop-blur-md border-l border-white/10 shadow-2xl text-white`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Order</h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {basket.length === 0 ? (
              <p className="text-sm text-white/70">No items added yet.</p>
            ) : (
              basket.map((item) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <p className="font-semibold text-sm leading-tight">
                          {item.name}
                        </p>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateQuantity(item.name, -1)}
                            className="w-8 h-8 rounded-lg bg-black/30 border border-white/10"
                          >
                            −
                          </button>
                          <span className="min-w-4 text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.name, 1)}
                            className="w-8 h-8 rounded-lg bg-black/30 border border-white/10"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs text-white/70 mb-1">
                          Special request
                        </label>
                        <textarea
                          value={item.specialRequest}
                          onChange={(e) =>
                            updateSpecialRequest(item.name, e.target.value)
                          }
                          placeholder="e.g. no parmesan, add hot honey"
                          className="w-full rounded-lg bg-black/25 border border-white/10 p-2 text-sm text-white placeholder:text-white/40 resize-none outline-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/70">Total items</span>
              <span className="font-bold">{basketCount}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearBasket}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold hover:bg-white/10 transition"
              >
                Clear
              </button>

              <button
                onClick={sendOrder}
                disabled={basket.length === 0 || isSending}
                className="flex-[2] rounded-2xl border-4 border-black bg-[#f7931e] px-4 py-3 text-black font-black uppercase tracking-wide shadow-lg disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send Order"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}