import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { Check, MapPin, Package, Plus, Truck, ArrowRight } from "lucide-react";
import { useState } from "react";
import { AddressFormModal } from "@/components/user/account/shipping/address-form-modal";
import {
  useOrderActions,
  useOrderDeliveryMethod,
  useOrderSelectedAddressId,
} from "@/stores/order-store";

interface Address {
  id: string;
  fullName: string;
  mobile: string;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  district: string;
  state: string;
  zip: string;
}

export default function DeliveryStep() {
  const deliveryMethod = useOrderDeliveryMethod();
  const selectedAddressId = useOrderSelectedAddressId();
  const { setDeliveryMethod, setSelectedAddressId, nextStep, previousStep } =
    useOrderActions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: addressData, isLoading } = useQuery({
    queryKey: ["address-list"],
    queryFn: async () => {
      const { data } = await api.users.addresses.list.get();
      return data?.data;
    },
    enabled: deliveryMethod === "shipping",
  });

  const addresses: Address[] = addressData?.list ?? [];
  const canContinue =
    deliveryMethod === "self_collect" ||
    (deliveryMethod === "shipping" && !!selectedAddressId);

  return (
    <>
      {/* ── DESKTOP VIEW ── */}
      <div className="hidden md:block bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-amber-200/40 shadow-sm space-y-6 text-left max-w-3xl mx-auto">
        <div>
          <h3 className="text-lg font-black text-[var(--gmc-mahogany-dark)] font-serif uppercase tracking-wider">
            Choose Delivery Method
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Select whether you would like to pick up the product yourself or
            have it shipped to your address.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setDeliveryMethod("self_collect")}
            className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
              deliveryMethod === "self_collect"
                ? "border-[var(--gmc-gold)] bg-amber-500/[0.04] shadow-xs"
                : "border-amber-900/10 bg-white hover:bg-amber-50/[0.15]"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-800">
                Self Collect
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Pick up your order directly from our corporate vault — no
                address required.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryMethod("shipping")}
            className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
              deliveryMethod === "shipping"
                ? "border-[var(--gmc-gold)] bg-amber-500/[0.04] shadow-xs"
                : "border-amber-900/10 bg-white hover:bg-amber-50/[0.15]"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-800">
                Ship To Address
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Have the order delivered to your door via our express secure
                courier.
              </p>
            </div>
          </button>
        </div>

        {deliveryMethod === "shipping" && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Select Shipping Address
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--gmc-gold-deep)] hover:text-[var(--gmc-gold-bright)] cursor-pointer bg-[var(--gmc-gold)]/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                Loading address registry…
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400 border border-dashed border-amber-200/50 rounded-2xl">
                No saved addresses found. Click "Add New Address" to record your
                details.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {addresses.map((address) => {
                  const selected = selectedAddressId === address.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`relative text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        selected
                          ? "border-[var(--gmc-gold)] bg-amber-500/[0.03] shadow-xs"
                          : "border-amber-900/10 bg-white hover:bg-amber-50/[0.15]"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[var(--gmc-gold)] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-[var(--gmc-gold-deep)] shrink-0" />
                        <span className="text-xs font-black text-slate-800">
                          {address.fullName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pr-6">
                        {[address.address1, address.address2, address.address3]
                          .filter(Boolean)
                          .join(", ")}
                        , {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-slate-100/50">
                        {address.mobile}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={previousStep}
            className="px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer border border-slate-200"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={nextStep}
            className="px-8 py-3.5 rounded-xl text-xs sm:text-sm font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] shadow-md shadow-[var(--gmc-gold)]/25 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-all duration-300 active:scale-95 flex items-center gap-2"
          >
            <span>Continue to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MOBILE VIEW ── */}
      <div className="md:hidden flex flex-col space-y-5 pb-24 text-left">
        {/* iOS-style Segmented Controller */}
        <div className="mx-1">
          <div className="relative flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200/40 select-none">
            {/* Sliding background pill */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-md transition-all duration-300 ease-out"
              style={{
                left:
                  deliveryMethod === "self_collect" ? "6px" : "calc(50% + 3px)",
                width: "calc(50% - 9px)",
              }}
            />
            <button
              type="button"
              onClick={() => setDeliveryMethod("self_collect")}
              className="relative z-10 flex-1 py-2.5 text-center text-xs font-bold transition-all rounded-xl cursor-pointer"
              style={{
                color:
                  deliveryMethod === "self_collect"
                    ? "var(--gmc-mahogany-dark)"
                    : "#64748b",
              }}
            >
              Self Collect
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("shipping")}
              className="relative z-10 flex-1 py-2.5 text-center text-xs font-bold transition-all rounded-xl cursor-pointer"
              style={{
                color:
                  deliveryMethod === "shipping"
                    ? "var(--gmc-mahogany-dark)"
                    : "#64748b",
              }}
            >
              Ship To Address
            </button>
          </div>
        </div>

        {/* Dynamic method description card */}
        <div className="mx-1 p-4 rounded-3xl bg-white border border-amber-950/5 shadow-xs flex gap-3.5 items-start">
          <div className="w-10 h-10 rounded-xl bg-[var(--gmc-gold)]/10 text-[var(--gmc-gold-deep)] flex items-center justify-center shrink-0">
            {deliveryMethod === "self_collect" ? (
              <Package className="w-5 h-5" />
            ) : (
              <Truck className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {deliveryMethod === "self_collect"
                ? "Self Collection Vault"
                : "Direct Home Courier"}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
              {deliveryMethod === "self_collect"
                ? "No delivery charge. Pick up your orders directly at GMC Head Office or local secure vaults after confirmation."
                : "Insured express delivery to your recorded address. Shipping timelines take 3-5 business days."}
            </p>
          </div>
        </div>

        {/* Shipping address selection list */}
        {deliveryMethod === "shipping" && (
          <div className="mx-1 space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Select Address
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-[var(--gmc-gold-deep)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                Loading addresses…
              </div>
            ) : addresses.length === 0 ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full py-8 text-center text-xs font-bold text-slate-400 border border-dashed border-amber-200 rounded-3xl hover:bg-amber-50/10 cursor-pointer"
              >
                No saved addresses. Tap to add your first address.
              </button>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((address) => {
                  const selected = selectedAddressId === address.id;
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`w-full relative text-left p-4.5 rounded-3xl border transition-all duration-200 cursor-pointer ${
                        selected
                          ? "border-[var(--gmc-gold)] bg-amber-500/[0.02] shadow-xs"
                          : "border-amber-950/5 bg-white hover:bg-amber-50/10"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-4.5 right-4.5 w-5 h-5 rounded-full bg-[var(--gmc-gold)] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin className="w-4 h-4 text-[var(--gmc-gold-deep)] shrink-0" />
                        <span className="text-xs font-black text-slate-800">
                          {address.fullName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pr-6">
                        {[address.address1, address.address2]
                          .filter(Boolean)
                          .join(", ")}
                        , {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        {address.mobile}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sticky Mobile Bottom CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={previousStep}
            className="px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={nextStep}
            className="flex-1 py-3.5 rounded-xl text-xs font-black text-white uppercase tracking-widest bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] disabled:opacity-50 disabled:pointer-events-none active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Pay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invalidateQueryKey={["address-list"]}
        onSuccess={(addressId) => {
          if (addressId) setSelectedAddressId(addressId);
        }}
      />
    </>
  );
}
