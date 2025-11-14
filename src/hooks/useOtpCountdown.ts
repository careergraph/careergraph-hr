import { useCallback, useEffect, useRef, useState } from "react";

export function useOtpCountdown(defaultDurationSec = 120) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Dừng đếm ngược
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Bắt đầu đếm ngược (hoặc đồng bộ lại)
  const startOrSync = useCallback(
    (durationSec: number = defaultDurationSec) => {
      clearTimer();
      setSecondsLeft(durationSec);

      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer, defaultDurationSec]
  );

  // Dọn dẹp khi unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    startOrSync,
  };
}
