import { Check, MapPin, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PostOffice } from "@/lib/pincode-lookup";

interface PostOfficePickerModalProps {
  isOpen: boolean;
  postOffices: PostOffice[];
  pincode: string;
  onSelect: (office: PostOffice) => void;
  onClose: () => void;
}

export function PostOfficePickerModal({
  isOpen,
  postOffices,
  pincode,
  onSelect,
  onClose,
}: PostOfficePickerModalProps) {
  const [selected, setSelected] = useState<PostOffice | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected);
    setSelected(null);
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex sm:items-center items-end justify-center z-[100] p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full sm:max-w-md max-w-full sm:max-h-[80vh] max-h-[90vh] flex flex-col overflow-y-auto text-left"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--gmc-mahogany)] to-[var(--gmc-mahogany-light)] text-white p-5 rounded-t-3xl flex items-start justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={18} />
                  Choose Your Area
                </h3>
                <p className="text-white/80 text-xs font-semibold mt-1">
                  {postOffices.length} areas found for PIN {pincode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {postOffices.map((office) => {
                const isSelected = selected?.Name === office.Name;
                return (
                  <button
                    key={office.Name}
                    type="button"
                    onClick={() => setSelected(office)}
                    className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-[var(--gmc-gold)] bg-[var(--gmc-gold)]/5"
                        : "border-slate-300 hover:border-[var(--gmc-gold)]/80 hover:bg-[var(--gmc-gold)]/5"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {office.Name}
                      </p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {office.BranchType} &middot; {office.DeliveryStatus}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--gmc-gold)] flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-white font-bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 shrink-0">
              <motion.button
                whileHover={{ scale: selected ? 1.02 : 1 }}
                whileTap={{ scale: selected ? 0.98 : 1 }}
                type="button"
                onClick={handleConfirm}
                disabled={!selected}
                className="w-full px-6 py-3 bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] text-white rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-md shadow-[var(--gmc-gold)]/20 hover:shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirm Selection
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
