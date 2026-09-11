import { api } from "@lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building,
  Copy,
  Edit2,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AddressFormModal } from "./address-form-modal";

interface Address {
  id: string;
  fullName: string;
  mobile: string;
  altMobile?: string | null;
  address1: string;
  address2?: string | null;
  address3?: string | null;
  city: string;
  district: string;
  state: string;
  zip: string;
}

interface ShippingAddressProps {
  /** When provided, fetches addresses for this userId via the admin API (read-only) */
  adminUserId?: number;
}

export default function ShippingAddress({
  adminUserId,
}: ShippingAddressProps = {}) {
  const isAdmin = adminUserId !== undefined;
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: addressData, isLoading } = useQuery({
    queryKey: isAdmin ? ["admin-address-list", adminUserId] : ["address-list"],
    queryFn: async () => {
      if (isAdmin) {
        const { data: responseData } = await api.admin.addresses.list.get({
          query: { userId: adminUserId },
        });
        return responseData?.data;
      }
      const { data: responseData } = await api.users.addresses.list.get();
      return responseData?.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.users.addresses({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["address-list"] });
      setDeleteConfirm(null);
    },
  });

  const openModal = (address?: Address) => {
    setEditingAddress(address || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] flex items-center justify-center p-4">
        {/* Global ambient background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-[var(--gmc-gold)] rounded-full animate-spin" />
          </div>
          <div className="text-slate-800 text-base sm:text-lg font-black animate-pulse">
            Loading Addresses...
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#faf8f6] text-slate-800 selection:bg-[var(--gmc-gold)]/20 selection:text-[var(--gmc-gold-deep)]">
      {/* Global ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#faf8f6]" />
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/35 via-orange-100/25 to-transparent blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-100/40 via-amber-50/50 to-transparent blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in-up">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-2 h-8 bg-gradient-to-b from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] rounded-full shadow-sm shadow-[var(--gmc-gold)]/40 shrink-0" />
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 leading-none">
                  Shipping Addresses
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                  {isAdmin
                    ? `Viewing addresses for User #${adminUserId}`
                    : "Manage your delivery addresses"}
                </p>
              </div>
            </div>
            {!isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-[var(--gmc-gold)]/25 transition-all duration-300 cursor-pointer"
              >
                <Plus size={18} />
                Add New Address
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Address Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {addressData?.list?.map((address: Address, index: number) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-amber-200/80 overflow-hidden text-left"
              >
                {/* Decorative background gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/10 to-orange-100/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-[var(--gmc-mahogany)] to-[var(--gmc-mahogany-light)] rounded-xl flex items-center justify-center shadow-md shadow-[var(--gmc-mahogany)]/20 transition-transform duration-300 group-hover:scale-105">
                        <MapPin className="text-white h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-sm sm:text-base leading-tight">
                          {address.fullName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const addressParts = [
                            address.address1,
                            address.address2,
                            address.address3,
                          ]
                            .filter(Boolean)
                            .join(", ");
                          const cityLine = [
                            address.city,
                            address.state,
                            address.zip,
                          ]
                            .filter(Boolean)
                            .join(", ");
                          const text = `${address.fullName}\n${addressParts}\n${cityLine}\nMob- ${address.mobile}`;
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard
                              .writeText(text)
                              .then(() => toast.success("Address copied!"));
                          } else {
                            const ta = document.createElement("textarea");
                            ta.value = text;
                            ta.style.position = "fixed";
                            ta.style.left = "-9999px";
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand("copy");
                            document.body.removeChild(ta);
                            toast.success("Address copied!");
                          }
                        }}
                        className="h-8 w-8 sm:w-9 sm:h-9 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer border border-green-200/50"
                        title="Copy Address"
                      >
                        <Copy size={14} />
                      </motion.button>
                      {!isAdmin && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openModal(address)}
                            className="h-8 w-8 sm:w-9 sm:h-9 bg-amber-50 hover:bg-[var(--gmc-gold)] text-[var(--gmc-gold-deep)] hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer border border-amber-200/50"
                            title="Edit Address"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05, rotate: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirm(address.id)}
                            className="h-8 w-8 sm:w-9 sm:h-9 bg-red-50 hover:bg-red-650 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer border border-red-200/50"
                            title="Delete Address"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Phone
                        size={14}
                        className="text-[var(--gmc-gold-deep)] shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-600 font-mono">
                        {address.mobile}
                      </span>
                    </div>
                    {address.altMobile && (
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Phone
                          size={14}
                          className="text-[var(--gmc-gold-deep)] shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-600 font-mono">
                          {address.altMobile}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="bg-amber-50/20 rounded-2xl p-4 border border-amber-100/40 text-left">
                    <div className="flex items-start gap-2 mb-3">
                      <Building
                        size={14}
                        className="text-[var(--gmc-gold-deep)] shrink-0 mt-0.5"
                      />
                      <div className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
                        {address.address1}
                        {address.address2 && <>, {address.address2}</>}
                        {address.address3 && <>, {address.address3}</>}
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 font-medium flex flex-wrap gap-1.5">
                      <span className="bg-amber-50 text-[var(--gmc-gold-deep)] border border-amber-500/50 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold">
                        {address.city}
                      </span>
                      <span className="bg-orange-50 text-orange-700 border border-orange-500/50 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold">
                        {address.district}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-500/50 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold">
                        {address.state}
                      </span>
                      <span className="bg-slate-50 text-slate-700 border border-slate-500/50 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-bold font-mono">
                        {address.zip}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete Confirmation Overlay */}
                <AnimatePresence>
                  {deleteConfirm === address.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20"
                    >
                      <div className="text-center px-6">
                        <AlertCircle
                          className="text-red-500 mx-auto mb-3"
                          size={40}
                        />
                        <h4 className="font-bold text-base sm:text-lg text-slate-800 mb-1">
                          Delete Address?
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold mb-4">
                          This action cannot be undone
                        </p>
                        <div className="flex gap-2 justify-center">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDelete(address.id)}
                            className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-black transition-colors cursor-pointer shadow-sm"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {(!addressData?.list || addressData.list.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-1 sm:py-24 relative z-10"
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-500/5 to-amber-200/5 border border-amber-200/30 rounded-full mx-auto mb-6 flex items-center justify-center">
              <MapPin className="text-[var(--gmc-gold-deep)]" size={48} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
              No Addresses Yet
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 font-semibold">
              {isAdmin
                ? "This user has no saved addresses"
                : "Add your first shipping address to get started"}
            </p>
            {/* {!isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-md shadow-[var(--gmc-gold)]/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <Plus size={18} />
                Add Address
              </motion.button>
            )} */}
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        {!isAdmin && (
          <AddressFormModal
            isOpen={isModalOpen}
            onClose={closeModal}
            editingAddress={editingAddress}
            invalidateQueryKey={["address-list"]}
          />
        )}
      </div>
    </div>
  );
}
