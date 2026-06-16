import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "@/icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;
import { cn } from "@/lib/utils";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  onValueChange?: (value: string) => void;
  defaultDate?: DateOption;
  value?: string;
  minDate?: DateOption;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  onValueChange,
  label,
  defaultDate,
  value,
  minDate,
  placeholder,
  className,
  inputClassName,
}: PropsType) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef<Hook | Hook[] | undefined>(onChange);
  const onValueChangeRef = useRef<PropsType["onValueChange"]>(onValueChange);

  useEffect(() => {
    onChangeRef.current = onChange;
    onValueChangeRef.current = onValueChange;
  }, [onChange, onValueChange]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const flatPickr = flatpickr(input, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate: value || defaultDate,
      minDate,
      allowInput: true,
      disableMobile: false,
      onChange: (selectedDates, currentDateString, instance, data) => {
        onValueChangeRef.current?.(currentDateString);

        if (Array.isArray(onChangeRef.current)) {
          onChangeRef.current.forEach((hook) =>
            hook(selectedDates, currentDateString, instance, data)
          );
          return;
        }

        onChangeRef.current?.(selectedDates, currentDateString, instance, data);
      },
    });
    pickerRef.current = flatPickr;

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [defaultDate, id, minDate, mode]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;

    const nextValue = value?.trim();
    const currentValue = picker.input.value?.trim();

    if (!nextValue) {
      if (currentValue) {
        picker.clear();
      }
      return;
    }

    if (currentValue !== nextValue) {
      picker.setDate(nextValue, false, "Y-m-d");
    }
  }, [value]);

  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    picker.set("minDate", minDate);
  }, [minDate]);

  return (
    <div className={className}>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          value={value ?? ""}
          onChange={(event) => onValueChange?.(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "input-date-icon h-11 w-full rounded-lg border appearance-none bg-transparent px-3 py-2 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 md:px-4 md:py-2.5 md:text-sm",
            "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
            inputClassName
          )}
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
