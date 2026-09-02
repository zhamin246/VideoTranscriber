"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageIcon } from "lucide-react";
import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import { Link } from "@/i18n/navigation";
import type { ConvertHistoryItem } from "@/lib/convert/history";
import type { CreditLot, CreditRecord } from "@/types/user";
import { V } from "./visual";

type Tab = "history" | "orders" | "credits";

type DashboardOrder = {
  orderNo: string;
  productName: string;
  amountLabel: string;
  intervalLabel: string;
  credits: number;
  paidAt: string | null;
};

const PAGE_SIZE = 25;
const LIST_PAGE_SIZE = 10;

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function displayName(session: {
  user?: { nickname?: string | null; name?: string | null; email?: string | null } | null;
} | null): string | null {
  const user = session?.user;
  const raw = user?.nickname?.trim() || user?.name?.trim() || "";
  return raw || null;
}

export default function FaceRatingDashboardPage({
  paid = false,
  initialTab = "history",
}: {
  paid?: boolean;
  initialTab?: Tab;
}) {
  const { data: session, status } = useSession();
  const email =
    (session?.user as { email?: string } | undefined)?.email ||
    session?.user?.email ||
    null;
  const name = displayName(session);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [showPaidBanner, setShowPaidBanner] = useState(paid);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<(ConvertHistoryItem & { createdAt?: string })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [creditLots, setCreditLots] = useState<CreditLot[]>([]);
  const [isRecharged, setIsRecharged] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !email) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobsRes, creditsRes] = await Promise.all([
          fetch(
            `/api/convert/jobs?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
            { cache: "no-store" }
          ),
          fetch("/api/get-user-credits", { method: "POST", cache: "no-store" }),
        ]);
        const jobsData = await jobsRes.json().catch(() => ({}));
        const creditsData = await creditsRes.json().catch(() => ({}));
        if (!jobsRes.ok || jobsData?.code !== 0) {
          throw new Error(jobsData?.message || "Failed to load conversions");
        }
        if (!cancelled) {
          setItems(jobsData?.data?.items || []);
          setTotal(Number(jobsData?.data?.total) || 0);
          if (creditsRes.ok && creditsData?.code === 0) {
            setCredits(creditsData?.data?.left_credits ?? 0);
            setCreditLots(creditsData?.data?.lots || []);
            setIsRecharged(Boolean(creditsData?.data?.is_recharged));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load conversions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, email, page]);

  const signedIn = status === "authenticated" && Boolean(email);

  return (
    <div
      className="flex min-h-screen flex-col bg-white"
      style={{ color: V.ink }}
      data-theme="light"
    >
      <FaceRatingSiteHeader />

      <section
        className="px-5 pb-14 pt-12 text-center sm:px-8 sm:pb-16 sm:pt-14"
        style={{ backgroundColor: V.accent }}
      >
        <h1
          className="font-black tracking-tight text-white"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.03em" }}
        >
          My Dashboard
        </h1>
        {signedIn ? (
          <p className="mt-3 text-[14px] text-white/70">
            {name ? (
              <>
                <span className="text-white/90">{name}</span>
                <span className="mx-2 text-white/35">|</span>
              </>
            ) : null}
            {email}
          </p>
        ) : (
          <p className="mt-3 text-[14px] text-white/70">Sign in to see your drawings and credits.</p>
        )}
      </section>

      <div className="relative z-10 -mt-5 flex justify-center px-5">
        <div
          className="inline-flex rounded-full p-1"
          style={{ backgroundColor: "#F4F4F5", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
          role="tablist"
          aria-label="Dashboard sections"
        >
          {(
            [
              ["history", "Conversion History"],
              ["orders", "My Orders"],
              ["credits", "Credits & Plan"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-2 text-[12px] font-semibold transition-colors sm:px-5 sm:text-[14px] ${
                tab === id ? "bg-white text-[#0a0a0a] shadow-sm" : "text-[#71717A] hover:text-[#3F3F46]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1152px] flex-1 px-5 pb-16 pt-10 sm:px-8">
        {showPaidBanner ? (
          <div
            className="mb-8 rounded-[16px] border px-5 py-4 text-center"
            style={{
              borderColor: "rgba(159,18,57,0.2)",
              backgroundColor: "#FFF1F2",
            }}
          >
            <p className="text-[15px] font-semibold" style={{ color: V.accent }}>
              Payment successful. Your credits are ready.
            </p>
          </div>
        ) : null}
        {status === "loading" || loading ? (
          <p className="text-center text-sm text-[#737373]">Loading your dashboard…</p>
        ) : !signedIn ? (
          <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] px-6 py-10 text-center">
            <p className="text-sm text-[#525252]">Sign in to see conversions and credits.</p>
            <Link
              href="/auth/signin?callbackUrl=/dashboard"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-[#9F1239] px-5 text-sm font-bold text-white"
            >
              Log in
            </Link>
          </div>
        ) : tab === "history" ? (
          <HistoryPanel
            items={items}
            error={error}
            page={page}
            total={total}
            onPageChange={setPage}
          />
        ) : tab === "orders" ? (
          <OrdersPanel />
        ) : (
          <CreditsPanel
            credits={credits}
            lots={creditLots}
            isRecharged={isRecharged}
          />
        )}
      </main>

      <FaceRatingSiteFooter />
    </div>
  );
}

function HistoryPanel({
  items,
  error,
  page,
  total,
  onPageChange,
}: {
  items: (ConvertHistoryItem & { createdAt?: string })[];
  error: string | null;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }
  if (total === 0 && items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e5e5e5] px-6 py-12 text-center">
        <ImageIcon className="mx-auto h-10 w-10 text-[#9F1239]/50" />
        <p className="mt-4 text-base font-bold">No conversions yet</p>
        <p className="mt-2 text-sm text-[#737373]">
          Convert a photo to vector and it will show up here.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-[#9F1239] px-5 text-sm font-bold text-white"
        >
          Upload a photo
        </Link>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/convert?job=${encodeURIComponent(item.id)}`}
              className="block overflow-hidden rounded-2xl border border-[#ececec] bg-white transition-colors hover:border-[#9F1239]/40"
            >
              <div className="aspect-square bg-white">
                {item.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-[#a3a3a3]" />
                  </div>
                )}
              </div>
              <div className="border-t border-[#f4f4f4] px-3 py-2">
                <p className="truncate text-sm font-medium text-[#0a0a0a]">{item.title}</p>
                {item.createdAt ? (
                  <p className="mt-0.5 text-xs text-[#a3a3a3]">{formatDate(item.createdAt)}</p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {pageCount > 1 ? (
        <ListPager
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
          label="Conversion history pages"
        />
      ) : null}
    </div>
  );
}

function ListPager({
  page,
  pageCount,
  onPageChange,
  label,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label={label}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#525252] disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={`min-w-8 rounded-full px-2.5 py-1.5 text-[13px] font-semibold ${
            n === page ? "bg-[#9F1239] text-white" : "text-[#525252] hover:bg-[#F5F5F4]"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#525252] disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

function intervalTone(label: string) {
  if (label === "Monthly") return { bg: "#FFF1F2", color: V.accent };
  if (label === "Yearly") return { bg: "#F5F5F4", color: V.ink };
  return { bg: "#F4F4F5", color: "#525252" };
}

function OrdersPanel() {
  const [listTab, setListTab] = useState<"orders" | "credits">("orders");
  const [orderPage, setOrderPage] = useState(1);
  const [creditPage, setCreditPage] = useState(1);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([]);
  const [creditTotal, setCreditTotal] = useState(0);
  const [creditRecordsError, setCreditRecordsError] = useState<string | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      try {
        const response = await fetch(
          `/api/orders?page=${orderPage}&limit=${LIST_PAGE_SIZE}`,
          { cache: "no-store" }
        );
        const json = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok && json.code === 0) {
          setOrders(json.data?.items || []);
          setOrderTotal(Number(json.data?.total) || 0);
          setHasSubscription(Boolean(json.data?.hasSubscription));
          setOrdersError(null);
        } else {
          setOrdersError(json.message || "Failed to load orders");
        }
      } catch {
        if (!cancelled) setOrdersError("Failed to load orders");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderPage]);

  useEffect(() => {
    if (listTab !== "credits") return;
    let cancelled = false;
    (async () => {
      setCreditsLoading(true);
      try {
        const response = await fetch(
          `/api/credits/records?page=${creditPage}&limit=${LIST_PAGE_SIZE}`,
          { cache: "no-store" }
        );
        const json = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (response.ok && json.code === 0) {
          setCreditRecords(json.data?.items || []);
          setCreditTotal(Number(json.data?.total) || 0);
          setCreditRecordsError(null);
        } else {
          setCreditRecordsError(json.message || "Failed to load credit records");
        }
      } catch {
        if (!cancelled) setCreditRecordsError("Failed to load credit records");
      } finally {
        if (!cancelled) setCreditsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listTab, creditPage]);

  async function manageSubscription() {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.code === 0 && data.data?.url) {
        window.location.href = data.data.url;
        return;
      }
      window.alert(data.message || "Could not open billing portal");
    } catch {
      window.alert("Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  const orderPageCount = Math.max(1, Math.ceil(orderTotal / LIST_PAGE_SIZE));
  const creditPageCount = Math.max(1, Math.ceil(creditTotal / LIST_PAGE_SIZE));

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex rounded-full p-0.5"
          style={{ backgroundColor: V.surfaceAlt }}
          role="tablist"
          aria-label="Orders or credit records"
        >
          {(
            [
              ["orders", "Orders"],
              ["credits", "Credits record"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={listTab === id}
              onClick={() => setListTab(id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold sm:text-[13px] ${
                listTab === id
                  ? "bg-white text-[#0a0a0a] shadow-sm"
                  : "text-[#71717A] hover:text-[#3F3F46]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {hasSubscription ? (
          <button
            type="button"
            disabled={portalLoading}
            onClick={() => void manageSubscription()}
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: V.accent }}
          >
            {portalLoading ? "Opening…" : "Manage subscription"}
          </button>
        ) : null}
      </div>

      {listTab === "credits" ? (
        creditsLoading && creditRecords.length === 0 ? (
          <p className="text-center text-sm text-[#737373]">Loading credit records…</p>
        ) : (
          <>
            <CreditsRecordTable records={creditRecords} error={creditRecordsError} />
            <ListPager
              page={creditPage}
              pageCount={creditPageCount}
              onPageChange={setCreditPage}
              label="Credit record pages"
            />
          </>
        )
      ) : ordersLoading && orders.length === 0 && !ordersError ? (
        <p className="text-center text-sm text-[#737373]">Loading orders…</p>
      ) : ordersError ? (
        <p className="text-sm font-medium text-red-600">{ordersError}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e5e5e5] px-6 py-12 text-center">
          <p className="text-base font-bold">No orders yet</p>
          <p className="mt-2 text-sm text-[#737373]">
            Subscribe or buy a pack and it will show up here.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex h-10 items-center rounded-full bg-[#9F1239] px-5 text-sm font-bold text-white"
          >
            View plans
          </Link>
        </div>
      ) : (
        <>
          <OrdersTable orders={orders} />
          <ListPager
            page={orderPage}
            pageCount={orderPageCount}
            onPageChange={setOrderPage}
            label="Order pages"
          />
        </>
      )}
    </div>
  );
}

function OrdersTable({ orders }: { orders: DashboardOrder[] }) {
  return (
    <div
      className="overflow-hidden rounded-[16px] border bg-white"
      style={{ borderColor: V.line }}
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr style={{ backgroundColor: V.surfaceAlt, color: V.muted }}>
              <th className="px-5 py-3 font-semibold">Order</th>
              <th className="px-5 py-3 font-semibold">Product</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Billing</th>
              <th className="px-5 py-3 font-semibold">Credits</th>
              <th className="px-5 py-3 font-semibold">Paid</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.orderNo}
                className="border-t"
                style={{ borderColor: V.line }}
              >
                <td className="px-5 py-4 font-medium tabular-nums" style={{ color: V.ink }}>
                  {order.orderNo}
                </td>
                <td className="px-5 py-4" style={{ color: V.ink }}>
                  {order.productName}
                </td>
                <td className="px-5 py-4 tabular-nums" style={{ color: V.ink }}>
                  {order.amountLabel}
                </td>
                <td className="px-5 py-4">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold"
                    style={intervalTone(order.intervalLabel)}
                  >
                    {order.intervalLabel}
                  </span>
                </td>
                <td className="px-5 py-4 tabular-nums" style={{ color: V.ink }}>
                  {order.credits}
                </td>
                <td className="px-5 py-4" style={{ color: V.muted }}>
                  {formatDate(order.paidAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y md:hidden" style={{ borderColor: V.line }}>
        {orders.map((order) => (
          <li key={order.orderNo} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: V.ink }}>
                  {order.productName}
                </p>
                <p className="mt-1 text-[12px] tabular-nums" style={{ color: V.muted }}>
                  {order.orderNo}
                </p>
              </div>
              <p className="text-[15px] font-bold tabular-nums" style={{ color: V.ink }}>
                {order.amountLabel}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]" style={{ color: V.muted }}>
              <span
                className="inline-flex rounded-full px-2.5 py-1 font-semibold"
                style={intervalTone(order.intervalLabel)}
              >
                {order.intervalLabel}
              </span>
              <span>{order.credits} credits</span>
              {order.paidAt ? <span>{formatDate(order.paidAt)}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreditsRecordTable({
  records,
  error,
}: {
  records: CreditRecord[];
  error: string | null;
}) {
  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e5e5e5] px-6 py-12 text-center">
        <p className="text-base font-bold">No credit records yet</p>
        <p className="mt-2 text-sm text-[#737373]">
          Purchases, grants, and conversions will show up here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-[16px] border bg-white"
      style={{ borderColor: V.line }}
    >
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr style={{ backgroundColor: V.surfaceAlt, color: V.muted }}>
              <th className="px-5 py-3 font-semibold">Source</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Credits</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold">Expires</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.trans_no} className="border-t" style={{ borderColor: V.line }}>
                <td className="px-5 py-4" style={{ color: V.ink }}>
                  {row.source}
                </td>
                <td className="px-5 py-4" style={{ color: V.muted }}>
                  {row.type}
                </td>
                <td
                  className="px-5 py-4 font-semibold tabular-nums"
                  style={{ color: row.credits < 0 ? V.muted : V.accent }}
                >
                  {row.credits > 0 ? `+${row.credits}` : row.credits}
                </td>
                <td className="px-5 py-4" style={{ color: V.muted }}>
                  {formatDate(row.created_at)}
                </td>
                <td className="px-5 py-4" style={{ color: V.muted }}>
                  {row.expires_at ? formatDate(row.expires_at) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y md:hidden" style={{ borderColor: V.line }}>
        {records.map((row) => (
          <li key={row.trans_no} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold" style={{ color: V.ink }}>
                  {row.source}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: V.muted }}>
                  {row.type}
                  {row.created_at ? ` · ${formatDate(row.created_at)}` : ""}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: V.muted }}>
                  {row.expires_at ? `Expires ${formatDate(row.expires_at)}` : "No expiry"}
                </p>
              </div>
              <p
                className="text-[15px] font-bold tabular-nums"
                style={{ color: row.credits < 0 ? V.muted : V.accent }}
              >
                {row.credits > 0 ? `+${row.credits}` : row.credits}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function expiryCopy(lot: CreditLot) {
  if (!lot.expires_at) return "No expiry";
  const date = new Date(lot.expires_at);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { dateStyle: "medium" });
  if (lot.days_left == null) {
    return dateLabel ? `Expires ${dateLabel}` : "Expires later";
  }
  if (lot.days_left <= 0) return dateLabel ? `Expired ${dateLabel}` : "Expired";
  if (lot.days_left === 1) {
    return dateLabel ? `Expires tomorrow · ${dateLabel}` : "Expires tomorrow";
  }
  if (lot.days_left < 30) {
    return dateLabel
      ? `Expires in ${lot.days_left} days · ${dateLabel}`
      : `Expires in ${lot.days_left} days`;
  }
  return dateLabel ? `Expires ${dateLabel}` : `Expires in ${lot.days_left} days`;
}

function CreditsPanel({
  credits,
  lots,
  isRecharged,
}: {
  credits: number | null;
  lots: CreditLot[];
  isRecharged: boolean;
}) {
  const left = credits ?? 0;

  const visibleLots = lots.filter((lot) => Number(lot.remaining) > 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div
        className="rounded-[22px] border bg-white px-8 py-10 text-center"
        style={{ borderColor: V.line, boxShadow: "0 12px 40px rgba(0,0,0,0.06)" }}
      >
        <p className="text-[56px] font-black leading-none tracking-tight tabular-nums" style={{ color: V.accent }}>
          {left}
        </p>
        <p className="mt-3 text-[17px] font-semibold" style={{ color: V.ink }}>
          {left === 1 ? "conversion left" : "conversions left"}
        </p>
        <p className="mt-2 text-[14px]" style={{ color: V.muted }}>
          Each conversion uses 1 credit. Oldest lots are used first.
        </p>
      </div>

      <p
        className="mt-10 text-center text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "#A1A1AA" }}
      >
        Credit lots
      </p>
      {visibleLots.length === 0 ? (
        <p className="mt-4 text-center text-[14px]" style={{ color: V.muted }}>
          No unused credits right now.
        </p>
      ) : (
        <ul
          className="mt-4 overflow-hidden rounded-[16px] border bg-white"
          style={{ borderColor: V.line }}
        >
          {visibleLots.map((lot, index) => {
            const soon = lot.days_left != null && lot.days_left <= 7;
            return (
              <li
                key={`${lot.source}-${lot.expires_at}-${index}`}
                className="flex items-start justify-between gap-4 px-5 py-4"
                style={{
                  borderTop: index === 0 ? undefined : `1px solid ${V.line}`,
                }}
              >
                <div>
                  <p className="text-[15px] font-semibold" style={{ color: V.ink }}>
                    {lot.source}
                  </p>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: soon ? V.accent : V.muted }}
                  >
                    {expiryCopy(lot)}
                  </p>
                </div>
                <p
                  className="shrink-0 text-[22px] font-black tabular-nums leading-none"
                  style={{ color: V.accent }}
                >
                  {lot.remaining}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <p
        className="mt-10 text-center text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "#A1A1AA" }}
      >
        Your plan
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[16px] px-5 py-5" style={{ backgroundColor: V.surfaceAlt }}>
          <p className="text-[16px] font-bold" style={{ color: V.ink }}>
            {isRecharged ? "Paid plan" : "Free Plan"}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: V.muted }}>
            {isRecharged ? "Credits from your purchase" : "No active subscription"}
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[#9F1239] px-4 text-[13px] font-semibold text-white"
          >
            View plans
          </Link>
        </div>
        <div className="rounded-[16px] px-5 py-5" style={{ backgroundColor: V.surfaceAlt }}>
          <p className="text-[16px] font-bold" style={{ color: V.ink }}>
            Need more credits?
          </p>
          <p className="mt-1 text-[13px]" style={{ color: V.muted }}>
            Subscribe for a lower rate, or buy a pack that expires in 12 months.
          </p>
          <Link
            href="/pricing?tab=packs"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-[#9F1239] px-4 text-[13px] font-semibold text-white"
          >
            Buy credits
          </Link>
        </div>
      </div>
    </div>
  );
}
