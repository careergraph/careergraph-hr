import { ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";

// ScrollReveal tạo hiệu ứng hiện dần khi phần tử đi vào khung nhìn.

type Direction = "up" | "down" | "left" | "right";

type ScrollRevealProps = {
  children: ReactNode;
  direction?: Direction;
  once?: boolean;
  className?: string;
  delay?: number;
};

// Lớp chuyển động ban đầu tùy theo hướng.
const hiddenClassByDirection: Record<Direction, string> = {
  up: "translate-y-10",
  down: "-translate-y-10",
  left: "translate-x-10",
  right: "-translate-x-10",
};

export function ScrollReveal({
  children,
  direction = "up",
  once = true,
  className,
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Quan sát phần tử để bật/tắt trạng thái hiển thị khi cuộn tới.
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, once]);

  return (
    <div
      ref={ref}
      className={clsx(
        "transition-all duration-700 ease-out will-change-transform",
        // Khi hiển thị thì reset transform, ngược lại áp dụng lớp ẩn tương ứng.
        isVisible ? "opacity-100 translate-x-0 translate-y-0" : clsx("opacity-0", hiddenClassByDirection[direction]),
        className
      )}
    >
      {children}
    </div>
  );
}
