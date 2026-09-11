import type { CreateAddress } from "@api/lib/validations";
import { api } from "@lib";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building,
  Check,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type ZCreateAddress, zCreateAddressSchema } from "@/_definitions";
import { FieldInfo } from "@/components/forms/field-info";
import { lookupPincode, type PostOffice } from "@/lib/pincode-lookup";
import { PostOfficePickerModal } from "./post-office-picker-modal";
import StateDistrictSelect from "./state-district-select";

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

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (addressId?: string) => void;
  editingAddress?: Address | null;
  invalidateQueryKey?: unknown[];
}

/**
 * Reusable Address Form Modal
 * Can be used for both adding and editing addresses
 * Works in checkout flow and profile settings
 */
export function AddressFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingAddress,
  invalidateQueryKey = ["address-list"],
}: AddressFormModalProps) {
  const queryClient = useQueryClient();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pincode lookup state
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [pincodeSuccess, setPincodeSuccess] = useState(false);
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [postOfficesToPick, setPostOfficesToPick] = useState<
    PostOffice[] | null
  >(null);
  const [pickerPincode, setPickerPincode] = useState<string>("");
  const form = useForm({
    defaultValues: {
      fullName: "",
      mobile: "",
      altMobile: undefined,
      address1: "",
      address2: undefined,
      address3: undefined,
      city: "",
      district: "",
      state: "",
      zip: "",
    } as ZCreateAddress,
    validators: {
      onSubmit: zCreateAddressSchema,
    },
    onSubmit: async ({ value }) => {
      // Block submission if pincode is not verified (for both new and edited addresses)
      if (!pincodeVerified) {
        setPincodeError("Please enter a valid PIN code");
        return;
      }

      const submitData = {
        ...value,
        altMobile: value.altMobile || null,
        address2: value.address2 || null,
        address3: value.address3 || null,
      };
      if (editingAddress) {
        updateMutation.mutate({ id: editingAddress.id, data: submitData });
      } else {
        createMutation.mutate(submitData);
      }
    },
  });

  // Update form when editingAddress changes
  useEffect(() => {
    if (editingAddress) {
      form.setFieldValue("fullName", editingAddress.fullName);
      form.setFieldValue("mobile", editingAddress.mobile);
      form.setFieldValue("altMobile", editingAddress.altMobile ?? undefined);
      form.setFieldValue("address1", editingAddress.address1);
      form.setFieldValue("address2", editingAddress.address2 ?? undefined);
      form.setFieldValue("address3", editingAddress.address3 ?? undefined);
      form.setFieldValue("city", editingAddress.city);
      form.setFieldValue("district", editingAddress.district);
      form.setFieldValue("state", editingAddress.state);
      form.setFieldValue("zip", editingAddress.zip);
      // Mark pincode as verified for existing addresses
      setPincodeVerified(true);
    } else {
      form.reset();
      setPincodeVerified(false);
      setPincodeError(null);
      setPincodeSuccess(false);
      setPostOfficesToPick(null);
      setPickerPincode("");
    }
  }, [editingAddress, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateAddress) => {
      return await api.users.addresses.post(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
      onSuccess?.(response.data?.data?.id);
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateAddress }) => {
      return await api.users.addresses({ id }).put(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateQueryKey });
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    onClose();
    // Reset form after animation completes
    setTimeout(() => {
      form.reset();
      setPincodeError(null);
      setPincodeSuccess(false);
      setPostOfficesToPick(null);
      setPickerPincode("");
    }, 300);
  };

  const handlePostOfficeSelect = useCallback(
    (office: PostOffice) => {
      form.setFieldValue("city", office.Name);
      setPostOfficesToPick(null);
      setPincodeVerified(true);
      setPincodeSuccess(true);
      setTimeout(() => setPincodeSuccess(false), 3000);
    },
    [form],
  );

  // Pincode lookup handler
  const handlePincodeLookup = useCallback(
    async (pincode: string) => {
      // Reset states
      setPincodeError(null);
      setPincodeSuccess(false);
      setPincodeVerified(false);
      setPostOfficesToPick(null);

      // Only lookup when we have 6 digits
      if (!/^\d{6}$/.test(pincode)) {
        return;
      }

      setPincodeLoading(true);

      try {
        const result = await lookupPincode(pincode);

        // State and district are the same for all offices under a pincode
        form.setFieldValue("state", result.state);
        form.setFieldValue("district", result.district);

        if (result.postOffices.length === 1) {
          // Single result — auto-fill city immediately
          form.setFieldValue("city", result.postOffices[0]?.Name ?? "");
          setPincodeVerified(true);
          setPincodeSuccess(true);
          setTimeout(() => setPincodeSuccess(false), 3000);
        } else {
          // Multiple results — show picker so user can choose their area
          setPostOfficesToPick(result.postOffices);
          setPickerPincode(pincode);
        }
      } catch (error) {
        setPincodeVerified(false);
        setPincodeError(
          error instanceof Error ? error.message : "Failed to lookup pincode",
        );
      } finally {
        setPincodeLoading(false);
      }
    },
    [form],
  );

  if (!isMounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-[90] p-0 sm:p-4 cursor-pointer"
            onClick={handleClose}
          >
            <motion.div
              initial={{
                y:
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? "100%"
                    : 20,
                opacity:
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? 1
                    : 0,
                scale:
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? 1
                    : 0.95,
              }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{
                y:
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? "100%"
                    : 20,
                opacity:
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? 1
                    : 0,
                scale:
                  typeof window !== "undefined" && window.innerWidth < 640
                    ? 1
                    : 0.95,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full sm:max-w-2xl bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar cursor-default pb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:pb-0 text-left"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[var(--gmc-mahogany)] to-[var(--gmc-mahogany-light)] text-white p-5 sm:p-6 rounded-t-[2rem] sm:rounded-t-3xl flex items-center justify-between z-10">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider flex items-center gap-3">
                  {editingAddress ? (
                    <>
                      <Edit2 size={20} />
                      Edit Address
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      Add Address
                    </>
                  )}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="p-5 sm:p-6 space-y-6"
              >
                {/* Error Message */}
                {(createMutation.isError || updateMutation.isError) && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-650 text-xs sm:text-sm font-semibold">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : updateMutation.error instanceof Error
                        ? updateMutation.error.message
                        : "Failed to save address"}
                  </div>
                )}

                {/* Personal Info Section */}
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2 border-b border-slate-100 pb-2 text-left">
                    <User
                      className="text-[var(--gmc-gold-deep)] shrink-0"
                      size={18}
                    />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form.Field name="fullName">
                      {(field) => (
                        <div className="md:col-span-2 text-left">
                          <label
                            htmlFor="fullName"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            Full Name <span className="text-red-550">*</span>
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                              field.state.meta.errors.length > 0
                                ? "border-red-500"
                                : "border-slate-200"
                            } rounded-xl bg-white shadow-2xs`}
                            placeholder="John Doe"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="mobile">
                      {(field) => (
                        <div className="text-left">
                          <label
                            htmlFor="mobile"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            Mobile <span className="text-red-555">*</span>
                          </label>
                          <input
                            type="tel"
                            id="mobile"
                            minLength={10}
                            maxLength={10}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                              field.state.meta.errors.length > 0
                                ? "border-red-500"
                                : "border-slate-200"
                            } rounded-xl bg-white shadow-2xs`}
                            placeholder="9876543210"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="altMobile">
                      {(field) => (
                        <div className="text-left">
                          <label
                            htmlFor="altMobile"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            Alternate Mobile
                          </label>
                          <input
                            type="tel"
                            id="altMobile"
                            minLength={10}
                            maxLength={10}
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(e.target.value || undefined)
                            }
                            className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                              field.state.meta.errors.length > 0
                                ? "border-red-500"
                                : "border-slate-200"
                            } rounded-xl bg-white shadow-2xs`}
                            placeholder="9876543210"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2 border-b border-slate-100 pb-2 text-left">
                    <MapPin
                      className="text-[var(--gmc-gold-deep)] shrink-0"
                      size={18}
                    />
                    Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form.Field name="zip">
                      {(field) => (
                        <div className="text-left">
                          <label
                            htmlFor="zip"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            PIN Code <span className="text-red-550">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              id="zip"
                              minLength={6}
                              maxLength={6}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                const value = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6);
                                field.handleChange(value);
                                handlePincodeLookup(value);
                              }}
                              className={`w-full px-4 py-3 pr-12 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                                pincodeError
                                  ? "border-red-500"
                                  : pincodeSuccess
                                    ? "border-green-500"
                                    : field.state.meta.errors.length > 0
                                      ? "border-red-500"
                                      : "border-slate-200"
                              } rounded-xl bg-white shadow-2xs`}
                              placeholder="Enter 6-digit PIN code"
                            />
                            {/* Loading/Success/Error indicator */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {pincodeLoading && (
                                <Loader2 className="w-5 h-5 text-[var(--gmc-gold)] animate-spin" />
                              )}
                              {pincodeSuccess && !pincodeLoading && (
                                <Check className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                          </div>
                          {/* Pincode error message */}
                          {pincodeError && (
                            <p className="text-red-500 text-xs mt-1 font-semibold">
                              {pincodeError}
                            </p>
                          )}
                          {/* Pincode success message */}
                          {pincodeSuccess && !pincodeLoading && (
                            <p className="text-green-600 text-xs mt-1 font-semibold">
                              Location auto-filled successfully!
                            </p>
                          )}
                          {/* Multiple areas hint */}
                          {postOfficesToPick && !pincodeLoading && (
                            <p className="text-amber-600 text-xs mt-1 font-semibold">
                              Multiple areas found — select your area below.
                            </p>
                          )}
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="state">
                      {(stateField) => (
                        <form.Field name="district">
                          {(districtField) => (
                            <form.Field name="city">
                              {(cityField) => (
                                <StateDistrictSelect
                                  stateField={stateField}
                                  districtField={districtField}
                                  cityField={cityField}
                                  statePlaceholder="Select State"
                                  districtPlaceholder="Select District"
                                  cityPlaceholder="Enter City"
                                />
                              )}
                            </form.Field>
                          )}
                        </form.Field>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* Address Details Section */}
                <div className="space-y-4">
                  <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2 border-b border-slate-100 pb-2 text-left">
                    <Building
                      className="text-[var(--gmc-gold-deep)] shrink-0"
                      size={18}
                    />
                    Address Details
                  </h3>
                  <div className="space-y-4">
                    <form.Field name="address1">
                      {(field) => (
                        <div className="text-left">
                          <label
                            htmlFor="address1"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            Address Line 1{" "}
                            <span className="text-red-550">*</span>
                          </label>
                          <input
                            type="text"
                            id="address1"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                              field.state.meta.errors.length > 0
                                ? "border-red-500"
                                : "border-slate-200"
                            } rounded-xl bg-white shadow-2xs`}
                            placeholder="House No., Building Name"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="address2">
                      {(field) => (
                        <div className="text-left">
                          <label
                            htmlFor="address2"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            id="address2"
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(e.target.value || undefined)
                            }
                            className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                              field.state.meta.errors.length > 0
                                ? "border-red-500"
                                : "border-slate-200"
                            } rounded-xl bg-white shadow-2xs`}
                            placeholder="Road Name, Area"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name="address3">
                      {(field) => (
                        <div className="text-left">
                          <label
                            htmlFor="address3"
                            className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
                          >
                            Address Line 3
                          </label>
                          <input
                            type="text"
                            id="address3"
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                              field.handleChange(e.target.value || undefined)
                            }
                            className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
                              field.state.meta.errors.length > 0
                                ? "border-red-500"
                                : "border-slate-200"
                            } rounded-xl bg-white shadow-2xs`}
                            placeholder="Landmark"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] hover:from-[var(--gmc-gold-bright)] hover:to-[var(--gmc-gold)] text-white rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm shadow-md shadow-[var(--gmc-gold)]/20 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : editingAddress ? (
                      <>
                        <Edit2 size={16} />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PostOfficePickerModal
        isOpen={!!postOfficesToPick}
        postOffices={postOfficesToPick ?? []}
        pincode={pickerPincode}
        onSelect={handlePostOfficeSelect}
        onClose={() => setPostOfficesToPick(null)}
      />
    </>,
    document.body,
  );
}
