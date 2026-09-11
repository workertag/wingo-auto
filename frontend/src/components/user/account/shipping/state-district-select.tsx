import type { AnyFieldApi } from "@tanstack/react-form";
import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import indianDistricts from "./indian-districts";

interface StateDistrictSelectProps {
  stateField: AnyFieldApi;
  districtField: AnyFieldApi;
  cityField: AnyFieldApi;
  stateLabel?: string;
  districtLabel?: string;
  cityLabel?: string;
  statePlaceholder?: string;
  districtPlaceholder?: string;
  cityPlaceholder?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  options: string[];
  placeholder: string;
  label: string;
  hasError: boolean;
  errorMessage?: string;
  disabled?: boolean;
}

function CustomDropdown({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  label,
  hasError,
  errorMessage,
  disabled = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
    onBlur();
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label
        htmlFor=""
        className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
      >
        {label}
      </label>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 flex items-center justify-between gap-2 ${
          hasError
            ? "border-red-500"
            : isOpen
              ? "border-[var(--gmc-gold)] ring-1 ring-[var(--gmc-gold)]/20"
              : "border-slate-200 hover:border-[var(--gmc-gold)]/40"
        } ${
          disabled
            ? "bg-slate-50 cursor-not-allowed opacity-50 text-slate-400"
            : "bg-white cursor-pointer text-slate-800"
        } focus:outline-none`}
      >
        <span
          className={`flex-1 text-left text-sm ${
            value ? "font-bold text-slate-800" : "text-slate-400"
          }`}
        >
          {value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.15 }}
              onClick={clearSelection}
              className="w-6 h-6 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <X size={13} className="text-red-650" />
            </motion.div>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0"
          >
            <ChevronDown
              size={18}
              className={`${disabled ? "text-slate-300" : "text-[var(--gmc-gold-deep)]"}`}
            />
          </motion.div>
        </div>
      </button>

      {/* Error Message */}
      {hasError && errorMessage && (
        <em className="text-red-500 text-xs mt-1 block font-semibold">
          {errorMessage}
        </em>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white border border-amber-200/80 rounded-2xl shadow-xl overflow-hidden text-left"
          >
            {/* Search Input */}
            <div className="p-3 bg-gradient-to-r from-amber-50/20 to-white border-b border-amber-100/40">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gmc-gold-deep)]"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all text-xs sm:text-sm text-slate-800 bg-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                <div className="p-1.5 space-y-0.5">
                  {filteredOptions.map((option, index) => (
                    <motion.button
                      key={option}
                      type="button"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.015 }}
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-semibold ${
                        value === option
                          ? "bg-gradient-to-r from-[var(--gmc-gold)] to-[var(--gmc-gold-amber)] text-white shadow-sm"
                          : "hover:bg-amber-50 text-slate-700 hover:text-[var(--gmc-gold-deep)]"
                      }`}
                    >
                      <MapPin
                        size={14}
                        className={
                          value === option
                            ? "text-white"
                            : "text-[var(--gmc-gold-deep)]"
                        }
                      />
                      {option}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search
                    size={32}
                    className="mx-auto text-slate-300 mb-2 opacity-60"
                  />
                  <p className="text-slate-500 text-xs sm:text-sm font-bold">
                    No results found
                  </p>
                  <p className="text-slate-400 text-[10px] sm:text-xs mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>

            {/* Footer with count */}
            {filteredOptions.length > 0 && (
              <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold text-center">
                  {filteredOptions.length} option
                  {filteredOptions.length !== 1 ? "s" : ""} available
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StateDistrictSelect({
  stateField,
  districtField,
  cityField,
  stateLabel = "State *",
  districtLabel = "District/Sub District *",
  cityLabel = "City/Town *",
  statePlaceholder = "Select State",
  districtPlaceholder = "Select District",
  cityPlaceholder = "Enter City",
}: StateDistrictSelectProps) {
  // Get list of states (this is small, so we can keep it in memory)
  const states = useMemo(() => Object.keys(indianDistricts).sort(), []);

  // Get districts for selected state
  const districts = useMemo(() => {
    const selectedState = stateField.state.value;
    if (!selectedState || !(selectedState in indianDistricts)) {
      return [];
    }
    return indianDistricts[selectedState as keyof typeof indianDistricts] || [];
  }, [stateField.state.value]);

  // When state changes, clear district and city
  const handleStateChange = (value: string) => {
    stateField.handleChange(value);
    districtField.handleChange("");
    cityField.handleChange("");
  };

  // When district changes, optionally set it as city too
  const handleDistrictChange = (value: string) => {
    districtField.handleChange(value);
    // Auto-populate city with district if city is empty
    if (!cityField.state.value) {
      cityField.handleChange(value);
    }
  };

  return (
    <>
      {/* State Dropdown */}
      <CustomDropdown
        value={stateField.state.value}
        onChange={handleStateChange}
        onBlur={stateField.handleBlur}
        options={states}
        placeholder={statePlaceholder}
        label={stateLabel}
        hasError={stateField.state.meta.errors.length > 0}
        errorMessage={stateField.state.meta.errors
          .map((err) => err.message)
          .join(", ")}
      />

      {/* District Dropdown */}
      <CustomDropdown
        value={districtField.state.value}
        onChange={handleDistrictChange}
        onBlur={districtField.handleBlur}
        options={districts}
        placeholder={districtPlaceholder}
        label={districtLabel}
        hasError={districtField.state.meta.errors.length > 0}
        errorMessage={districtField.state.meta.errors
          .map((err) => err.message)
          .join(", ")}
        disabled={!stateField.state.value || districts.length === 0}
      />

      {/* City Input */}
      <div className="text-left">
        <label
          htmlFor="city"
          className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 mb-2"
        >
          {cityLabel}
        </label>
        <input
          type="text"
          id="city"
          value={cityField.state.value}
          onBlur={cityField.handleBlur}
          onChange={(e) => cityField.handleChange(e.target.value)}
          className={`w-full px-4 py-3 border text-sm text-slate-800 placeholder-slate-400 focus:border-[var(--gmc-gold)] focus:ring-1 focus:ring-[var(--gmc-gold)]/20 outline-none transition-all ${
            cityField.state.meta.errors.length > 0
              ? "border-red-500"
              : "border-slate-200"
          } rounded-xl bg-white shadow-2xs`}
          placeholder={cityPlaceholder}
        />
        {cityField.state.meta.isTouched &&
          cityField.state.meta.errors.length > 0 && (
            <em className="text-red-500 text-xs mt-1 block font-semibold">
              {cityField.state.meta.errors.map((err) => err.message).join(", ")}
            </em>
          )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #faf8f6;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--gmc-gold);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--gmc-gold-amber);
        }
      `}</style>
    </>
  );
}
