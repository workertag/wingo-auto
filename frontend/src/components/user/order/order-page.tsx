import {
  BV_PER_UNIT,
  PRODUCT_DESCRIPTION,
  PRODUCT_IMAGE_PATH,
  PRODUCT_NAME,
  PRODUCT_UNIT_PRICE_USDT,
} from "@api/lib/constants/product";
import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ExternalLink,
  History,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Check,
  Home,
} from "lucide-react";
import { getExplorerTxUrl } from "@/lib/utils";
import {
  useOrderActions,
  useOrderId,
  useOrderStep,
  useOrderUnits,
} from "@/stores/order-store";
import DeliveryStep from "./delivery-step";
import PaymentStep from "./payment-step";

const QUANTITY_CHIPS = [1, 2, 4, 5, 10];
const PRODUCT_IMAGES = ["/gmc1.webp", "/gmc2.webp", "/gmc3.webp"];

function ProductImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % PRODUCT_IMAGES.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + PRODUCT_IMAGES.length) % PRODUCT_IMAGES.length,
    );
  };

  useEffect(() => {
    const timer = setInterval(nextImage, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart(touch.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchEnd(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      nextImage();
    } else if (diff < -50) {
      prevImage();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="relative w-full aspect-square overflow-hidden bg-white rounded-3xl border border-[var(--gmc-gold)]/15 shadow-md shadow-amber-950/5 group select-none">
      {/* Slides */}
      <div
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {PRODUCT_IMAGES.map((src, index) => (
          <div
            key={src}
            className="w-full h-full shrink-0 flex items-center justify-center"
          >
            <img
              src={src}
              alt={`${PRODUCT_NAME} view ${index + 1}`}
              className="max-w-full max-h-full object-contain drop-shadow-xl transition-all duration-300 hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90 cursor-pointer"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      <button
        type="button"
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90 cursor-pointer"
        aria-label="Next image"
      >
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {PRODUCT_IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              currentIndex === index
                ? "w-6 bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)]"
                : "w-2 bg-slate-300/60 hover:bg-slate-400/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function QuantityStep() {
  const units = useOrderUnits();
  const { setUnits, nextStep } = useOrderActions();

  const totalPrice = units * PRODUCT_UNIT_PRICE_USDT;
  const totalBv = units * BV_PER_UNIT;

  return (
    <>
      {/* ── DESKTOP VIEW ── */}
      <div className="hidden md:grid grid-cols-12 gap-8 items-start text-left">
        <div className="col-span-5">
          <ProductImageCarousel />
        </div>

        <div className="col-span-7 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--gmc-gold-deep)] uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Flagship Product
            </div>
            <h2 className="text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif leading-tight">
              {PRODUCT_NAME}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {PRODUCT_DESCRIPTION}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#ffffff] via-[#fffdfa] to-[#f8f4ec] border border-[var(--gmc-gold)]/20 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                Select Quantity
              </span>
              <span className="text-base font-extrabold text-[var(--gmc-gold-deep)]">
                {units} {units === 1 ? "Unit" : "Units"}
              </span>
            </div>

            {/* Stepper with circular - and + buttons */}
            <div className="flex items-center gap-4 py-1">
              <button
                type="button"
                onClick={() => setUnits(units - 1)}
                disabled={units <= 1}
                className="w-11 h-11 rounded-full border border-amber-200 bg-white flex items-center justify-center text-xl font-bold text-slate-700 active:scale-95 disabled:opacity-40 transition-all cursor-pointer hover:bg-amber-50/50"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={1000}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value) || 1)}
                className="w-20 text-center py-2 border-b-2 border-amber-200 text-xl font-black font-mono text-slate-800 outline-none focus:border-[var(--gmc-gold)] bg-transparent"
              />
              <button
                type="button"
                onClick={() => setUnits(units + 1)}
                className="w-11 h-11 rounded-full border border-amber-200 bg-white flex items-center justify-center text-xl font-bold text-slate-700 active:scale-95 transition-all cursor-pointer hover:bg-amber-50/50"
              >
                +
              </button>

              <div className="flex items-center gap-1.5 ml-auto flex-1 max-w-[280px]">
                {QUANTITY_CHIPS.map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setUnits(qty)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      units === qty
                        ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white font-extrabold shadow-sm shadow-[var(--gmc-gold)]/20"
                        : "bg-white border border-amber-900/10 text-slate-700 hover:bg-amber-50/50"
                    }`}
                  >
                    {qty}x
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-900/10">
              <div className="p-4 rounded-2xl bg-white border border-amber-900/5 shadow-inner space-y-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Order Total
                </div>
                <div className="text-3xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
                  ${totalPrice}
                </div>
                <div className="text-[10px] text-[var(--gmc-gold-deep)] font-extrabold uppercase tracking-wide">
                  USDT ON-CHAIN
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/[0.04] to-amber-100/[0.15] border border-[var(--gmc-gold)]/15 shadow-inner space-y-1">
                <div className="text-[10px] text-[var(--gmc-gold-deep)] font-bold uppercase tracking-wider">
                  GNX Rewards
                </div>
                <div className="text-2xl font-black text-emerald-600">
                  + {totalBv} BV
                </div>
                <div className="text-[9px] text-[var(--gmc-gold-ochre)] font-semibold leading-relaxed">
                  Earned instantly in wallet
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="w-full py-4 rounded-2xl text-xs sm:text-sm font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 hover:shadow-lg cursor-pointer transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MOBILE VIEW ── */}
      <div className="md:hidden flex flex-col space-y-5 pb-24">
        {/* Swiper */}
        <div className="px-1">
          <ProductImageCarousel />
        </div>

        {/* Product Details */}
        <div className="px-1.5 space-y-1 text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--gmc-gold-deep)] uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Bio-Wellness Flagship
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black text-[var(--gmc-mahogany-dark)] font-serif">
              {PRODUCT_NAME}
            </h2>
            <span className="text-xl font-extrabold text-[var(--gmc-gold-deep)]">
              ${PRODUCT_UNIT_PRICE_USDT}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {PRODUCT_DESCRIPTION}
          </p>
        </div>

        {/* Quantity Select Card */}
        <div className="mx-1 p-5 rounded-3xl bg-white border border-amber-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Choose Quantity:</span>
            <span className="text-sm font-extrabold text-[var(--gmc-gold-deep)]">
              {units} {units === 1 ? "Unit" : "Units"}
            </span>
          </div>

          {/* Stepper with circular - and + buttons */}
          <div className="flex items-center justify-center gap-5 py-1">
            <button
              type="button"
              onClick={() => setUnits(units - 1)}
              disabled={units <= 1}
              className="w-10 h-10 rounded-full border border-amber-200 bg-white flex items-center justify-center text-lg font-bold text-slate-700 active:scale-90 disabled:opacity-40 transition-all cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={1000}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value) || 1)}
              className="w-16 text-center py-1.5 border-b-2 border-amber-100 text-lg font-black font-mono text-slate-800 bg-transparent outline-none focus:border-[var(--gmc-gold)]"
            />
            <button
              type="button"
              onClick={() => setUnits(units + 1)}
              className="w-10 h-10 rounded-full border border-amber-200 bg-white flex items-center justify-center text-lg font-bold text-slate-700 active:scale-90 transition-all cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Preset Chips */}
          <div className="flex items-center gap-1.5">
            {QUANTITY_CHIPS.map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setUnits(qty)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  units === qty
                    ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white font-extrabold shadow-sm"
                    : "bg-amber-50/20 border border-amber-900/5 text-slate-600 hover:bg-amber-50"
                }`}
              >
                {qty}x
              </button>
            ))}
          </div>
        </div>

        {/* Benefits Badges */}
        <div className="mx-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-amber-950/5 shadow-xs space-y-0.5 text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Mito Rewards
            </span>
            <div className="text-base font-black text-emerald-600">
              + {totalBv} BV
            </div>
            <div className="text-[9px] text-slate-400 leading-tight">
              Instantly credited in smart contract
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-amber-950/5 shadow-xs space-y-0.5 text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Settlement
            </span>
            <div className="text-base font-black text-[var(--gmc-gold-deep)]">
              USDT On-Chain
            </div>
            <div className="text-[9px] text-slate-400 leading-tight">
              Direct secure checkout
            </div>
          </div>
        </div>

        {/* Sticky Bottom CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex items-center justify-between shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              Order Total
            </span>
            <span className="text-xl font-black text-[var(--gmc-mahogany-dark)] font-serif leading-none mt-0.5">
              ${totalPrice} USDT
            </span>
          </div>
          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-3.5 rounded-xl text-xs font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function ConfirmationStep() {
  const orderId = useOrderId();
  const { reset } = useOrderActions();

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-amber-200/80 shadow-lg shadow-amber-950/5 text-center space-y-6 max-w-lg mx-auto my-4 relative overflow-hidden">
      {/* Background soft glow circles */}
      <div className="absolute top-[-30%] left-[-30%] w-[250px] h-[250px] rounded-full bg-emerald-100/30 blur-2xl" />
      <div className="absolute bottom-[-30%] right-[-30%] w-[250px] h-[250px] rounded-full bg-amber-100/30 blur-2xl" />

      <div className="relative z-10 w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-500/10">
        <CheckCircle2 className="w-10 h-10 animate-bounce" />
      </div>

      <div className="space-y-2 relative z-10">
        <h3 className="text-2xl font-black text-[var(--gmc-mahogany-dark)] font-serif uppercase tracking-tight">
          Order Confirmed!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
          Your payment was processed, on-chain verification succeeded, and your
          order has been registered.
        </p>
      </div>

      {orderId && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 inline-block w-full text-center relative z-10">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
            Order Reference
          </div>
          <div className="font-mono font-bold text-sm text-slate-700 select-all">
            {orderId}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 relative z-10">
        <button
          type="button"
          onClick={() => reset()}
          className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/20 active:scale-95 cursor-pointer transition-all duration-300"
        >
          Place Another Order
        </button>
        <a
          href="/dashboard"
          className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 cursor-pointer transition-all duration-300 text-center flex items-center justify-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" /> Return to Dashboard
        </a>
      </div>
    </div>
  );
}

function OrderHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders-list"],
    queryFn: async () => {
      const { data } = await api.users.orders.list.get({
        query: { page: 1, size: 15 },
      });
      return data?.data ?? null;
    },
  });

  const orders = data?.list ?? [];

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-amber-200/40 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
            Order History
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {orders.length} total
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4.5 h-4.5 animate-spin text-[var(--gmc-gold)]" />
          Loading order history…
        </div>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center text-xs font-bold text-slate-400">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 p-3.5 rounded-2xl border border-amber-100/50 bg-amber-50/[0.08] hover:bg-amber-50/[0.15] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800">
                    {order.units} × {PRODUCT_NAME}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    ${(order.totalAmountUsdt / 100).toFixed(2)} ·{" "}
                    {order.deliveryMethod === "self_collect"
                      ? "Self Collect"
                      : "Shipping"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                  style={{
                    background:
                      order.status === "confirmed"
                        ? "rgba(16, 185, 129, 0.08)"
                        : order.status === "failed"
                          ? "rgba(239, 68, 68, 0.08)"
                          : "rgba(245, 158, 11, 0.08)",
                    color:
                      order.status === "confirmed"
                        ? "#047857"
                        : order.status === "failed"
                          ? "#b91c1c"
                          : "#d97706",
                  }}
                >
                  {order.status}
                </span>
                <a
                  href={getExplorerTxUrl(31337, order.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[var(--gmc-gold-deep)] transition-colors"
                  title="View transaction"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrderPage() {
  const step = useOrderStep();
  const { previousStep } = useOrderActions();

  // Determine if order history should be shown on mobile
  const showHistoryOnMobile = step === "quantity" || step === "confirmation";

  return (
    <div className="relative min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)]">
      {/* Background ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/25 via-orange-100/15 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/30 via-amber-50/40 to-transparent blur-[140px]" />
      </div>

      {/* ── MOBILE SCREENTAKEOVER CONTAINER (NATIVE APP FEEL) ── */}
      <div className="md:hidden fixed inset-0 z-50 bg-[#faf8f6] flex flex-col overflow-hidden">
        {/* Sticky Mobile Header */}
        <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 pt-5 pb-3 sticky top-0 z-30 shrink-0 select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== "quantity" && step !== "confirmation" ? (
                <button
                  type="button"
                  onClick={previousStep}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-700 active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : step === "quantity" ? (
                <a
                  href="/dashboard"
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-700 active:scale-95 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5" />
                </a>
              ) : (
                <div className="w-5 h-5" />
              )}
              <span className="text-base font-black text-slate-900 font-serif leading-none">
                {step === "quantity" && "Configure Order"}
                {step === "delivery" && "Delivery Method"}
                {step === "payment" && "Secure Payment"}
                {step === "confirmation" && "Order Success"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Secure Checkout</span>
            </div>
          </div>

          {/* Stepper progress bar */}
          {step !== "confirmation" && (
            <div className="w-full mt-3">
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] transition-all duration-300"
                  style={{
                    width:
                      step === "quantity"
                        ? "33%"
                        : step === "delivery"
                          ? "66%"
                          : "100%",
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                <span>
                  Step{" "}
                  {step === "quantity" ? "1" : step === "delivery" ? "2" : "3"}{" "}
                  of 3
                </span>
                <span>
                  Next:{" "}
                  {step === "quantity"
                    ? "Delivery"
                    : step === "delivery"
                      ? "Payment"
                      : "Confirm"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {step === "quantity" && <QuantityStep />}
          {step === "delivery" && <DeliveryStep />}
          {step === "payment" && <PaymentStep />}
          {step === "confirmation" && <ConfirmationStep />}

          {showHistoryOnMobile && (
            <div className="mt-4 pb-20">
              <OrderHistory />
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP VIEW CONTAINER (PREMIUM DASHBOARD STYLE) ── */}
      <div className="hidden md:block relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-3 text-left">
          <div className="w-2.5 h-10 bg-gradient-to-b from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] rounded-full shadow-sm shadow-[var(--gmc-gold)]/30 shrink-0 animate-pulse" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-900 leading-none">
              Order {PRODUCT_NAME}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
              Decentralized purchase portal: Pay directly with your Web3 wallet
              and receive GNX rewards.
            </p>
          </div>
        </div>

        {/* Desktop Step Indicator */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-amber-200/30 flex items-center justify-between shadow-xs select-none">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {(["quantity", "delivery", "payment", "confirmation"] as const).map(
              (s, idx) => {
                const isActive = step === s;
                const isCompleted =
                  (s === "quantity" &&
                    (step === "delivery" ||
                      step === "payment" ||
                      step === "confirmation")) ||
                  (s === "delivery" &&
                    (step === "payment" || step === "confirmation")) ||
                  (s === "payment" && step === "confirmation");

                return (
                  <div key={s} className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isActive
                          ? "bg-[var(--gmc-gold)] text-white shadow-md shadow-[var(--gmc-gold)]/20"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                            : "bg-amber-50/50 text-amber-600 border border-amber-900/10"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    <span
                      className={`transition-colors duration-200 ${
                        isActive
                          ? "text-slate-900 font-extrabold"
                          : "text-slate-400"
                      }`}
                    >
                      {s}
                    </span>
                    {idx < 3 && (
                      <span className="text-slate-300 font-normal ml-1">
                        &rarr;
                      </span>
                    )}
                  </div>
                );
              },
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Secure Web3 Checkout</span>
          </div>
        </div>

        {/* Dynamic step component rendering */}
        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-2 md:p-1">
          {step === "quantity" && <QuantityStep />}
          {step === "delivery" && <DeliveryStep />}
          {step === "payment" && <PaymentStep />}
          {step === "confirmation" && <ConfirmationStep />}
        </div>

        {/* Order History */}
        <div className="pt-4">
          <OrderHistory />
        </div>
      </div>
    </div>
  );
}
