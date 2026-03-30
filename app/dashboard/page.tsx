"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RequestRow = {
  id: number;
  table_id: string;
  request_type: string;
  item_name: string | null;
  quantity: number | null;
  order_group_id: string | null;
  created_at: string;
  status: string | null;
  special_request: string | null;
  completed_at: string | null;
};

type GroupedOrder = {
  groupId: string;
  items: RequestRow[];
  first: RequestRow;
};

function groupRequests(requests: RequestRow[]): GroupedOrder[] {
  const grouped: Record<string, RequestRow[]> = {};

  for (const request of requests) {
    const key = request.order_group_id || `single-${request.id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(request);
  }

  return Object.entries(grouped)
    .map(([groupId, items]) => ({
      groupId,
      items,
      first: items[0],
    }))
    .sort(
      (a, b) =>
        new Date(b.first.created_at).getTime() -
        new Date(a.first.created_at).getTime()
    );
}

export default function DashboardPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [completedToday, setCompletedToday] = useState<RequestRow[]>([]);

  const fetchRequests = async () => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();

    const [{ data: activeData, error: activeError }, { data: completedData, error: completedError }] =
      await Promise.all([
        supabase
          .from("requests")
          .select("*")
          .eq("status", "new")
          .order("created_at", { ascending: false }),
        supabase
          .from("requests")
          .select("*")
          .eq("status", "completed")
          .gte("completed_at", startOfToday)
          .order("completed_at", { ascending: false }),
      ]);

    if (activeError) {
      console.error("Error fetching active requests:", activeError);
    } else {
      setRequests(activeData || []);
    }

    if (completedError) {
      console.error("Error fetching completed requests:", completedError);
    } else {
      setCompletedToday(completedData || []);
    }
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel("requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
        },
        async () => {
          await fetchRequests();
        }
      )
      .subscribe();

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      2
    );
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      fetchRequests();
    }, msUntilMidnight);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(midnightTimeout);
    };
  }, []);

  const groupedActiveOrders = useMemo(
    () => groupRequests(requests),
    [requests]
  );

  const groupedCompletedOrders = useMemo(
    () => groupRequests(completedToday),
    [completedToday]
  );

  const completeOrder = async (items: RequestRow[]) => {
    const ids = items.map((item) => item.id);

    const { error } = await supabase
      .from("requests")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      console.error("Error completing order:", error);
      alert("Failed to complete order");
      return;
    }

    setRequests((prev) => prev.filter((r) => !ids.includes(r.id)));

    const completedItems = items.map((item) => ({
      ...item,
      status: "completed",
      completed_at: new Date().toISOString(),
    }));

    setCompletedToday((prev) => [...completedItems, ...prev]);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 uppercase">
            Waiter Dashboard
          </h1>
          <p className="text-white/60">
            Live orders and completed history for today.
          </p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black uppercase">Active Orders</h2>
            <span className="text-sm text-white/60">
              {groupedActiveOrders.length} active
            </span>
          </div>

          {groupedActiveOrders.length === 0 ? (
            <p className="text-white/60">No active orders</p>
          ) : (
            <div className="space-y-4">
              {groupedActiveOrders.map(({ groupId, items, first }) => (
                <div
                  key={groupId}
                  className="rounded-2xl bg-[#143d26] border border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-lg font-bold">Table {first.table_id}</p>
                      <p className="text-sm text-white/60">
                        {new Date(first.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    <button
                      onClick={() => completeOrder(items)}
                      className="rounded-xl border-2 border-black bg-[#f7931e] px-4 py-2 text-black font-bold"
                    >
                      Complete
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-black/20 border border-white/10 p-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {item.item_name || item.request_type}
                          </p>
                          <p className="text-sm text-white/70">
                            Qty: {item.quantity || 1}
                          </p>
                        </div>

                        {item.special_request && (
                          <div className="mt-2">
                            <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
                              Special request
                            </p>
                            <p className="text-sm text-orange-300">
                              {item.special_request}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black uppercase">Completed Today</h2>
            <span className="text-sm text-white/60">
              {groupedCompletedOrders.length} completed
            </span>
          </div>

          {groupedCompletedOrders.length === 0 ? (
            <p className="text-white/60">No completed orders today</p>
          ) : (
            <div className="space-y-4">
              {groupedCompletedOrders.map(({ groupId, items, first }) => (
                <div
                  key={groupId}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-lg font-bold">Table {first.table_id}</p>
                      <p className="text-sm text-white/60">
                        Completed{" "}
                        {first.completed_at
                          ? new Date(first.completed_at).toLocaleTimeString()
                          : ""}
                      </p>
                    </div>

                    <span className="rounded-xl bg-green-700/80 px-3 py-1 text-sm font-bold">
                      Done
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-black/20 border border-white/10 p-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {item.item_name || item.request_type}
                          </p>
                          <p className="text-sm text-white/70">
                            Qty: {item.quantity || 1}
                          </p>
                        </div>

                        {item.special_request && (
                          <div className="mt-2">
                            <p className="text-xs uppercase tracking-wide text-white/50 mb-1">
                              Special request
                            </p>
                            <p className="text-sm text-orange-300">
                              {item.special_request}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}