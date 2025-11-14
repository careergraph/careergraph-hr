import { useEffect, useMemo, useRef } from "react";

export default function Otp6Input({
  value,
  onChange,
  disabled,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  name?: string;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // chuẩn hóa về 6 ký tự số
  const safe = (s: string) => (s || "").replace(/\D/g, "").slice(0, 6);

  // fill vào các ô từ string hiện tại
  const cells = useMemo(() => {
    const v = safe(value);
    return Array.from({ length: 6 }, (_, i) => v[i] ?? "");
  }, [value]);

  const focusAt = (idx: number) => {
    const el = inputsRef.current[idx];
    if (el) el.focus();
  };

  const setAt = (idx: number, digit: string) => {
    const cur = safe(value);
    const chars = cur.split("");
    chars[idx] = digit;
    const next = chars.join("").padEnd(6, "").slice(0, 6);
    onChange(next);
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, "").slice(-1); // chỉ lấy ký tự số cuối
    if (!d) {
      setAt(idx, "");
      return;
    }
    setAt(idx, d);
    if (idx < 5) focusAt(idx + 1);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    if (key === "Backspace") {
      if (cells[idx]) {
        setAt(idx, "");
      } else if (idx > 0) {
        focusAt(idx - 1);
        setAt(idx - 1, "");
      }
      e.preventDefault();
      return;
    }
    if (key === "ArrowLeft" && idx > 0) {
      focusAt(idx - 1);
      e.preventDefault();
      return;
    }
    if (key === "ArrowRight" && idx < 5) {
      focusAt(idx + 1);
      e.preventDefault();
      return;
    }
  };

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const cur = cells.slice();
    let j = idx;
    for (const ch of text) {
      if (j > 5) break;
      cur[j++] = ch;
    }
    onChange(cur.join("").slice(0, 6));
    if (j <= 5) focusAt(j);
  };

  useEffect(() => {
    // auto focus vào ô đầu tiên khi chưa đủ 6 số
    if (!safe(value).length && inputsRef.current[0]) {
      inputsRef.current[0]?.focus();
    }
  }, []);

  return (
    <div className="flex items-center justify-between gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d*"
          maxLength={1}
          name={i === 0 ? name : undefined} // name cho ô đầu để form không kêu
          value={cells[i]}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          disabled={disabled}
          className="h-12 w-12 rounded-xl border border-gray-300 text-center text-lg font-semibold tracking-widest
                     focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
        />
      ))}
    </div>
  );
}
