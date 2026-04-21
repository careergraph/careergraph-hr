interface LoadingSpinnerProps {
  message?: string;
  variant?: "overlay" | "inline";
  size?: "sm" | "md" | "lg";
}

/**
 * Simple 3-dots loading spinner (ported from client LoadingSpinner)
 * Used by Kanban confirm dialog to show progress while API call runs.
 */
export default function LoadingSpinner({
  message = "Đang xử lý...",
  variant = "overlay",
  size = "md",
}: LoadingSpinnerProps) {
  const dotSizes: Record<string, string> = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const dotSize = dotSizes[size] || dotSizes.md;
  const dotToneClasses = ["bg-primary", "bg-primary/80", "bg-primary/60"];

  if (variant === "overlay") {
    return (
      // Use a higher z-index so the spinner overlay appears above the
      // Radix AlertDialog overlay/content (which use z-50). This ensures
      // the loading overlay is visible and dims the dialog while still
      // allowing the dialog UI to be seen under a translucent layer.
      <div className="absolute inset-0 z-60 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5">
            {dotToneClasses.map((toneClass) => (
              <div
                key={`overlay-dot-${toneClass}`}
                className={`${dotSize} ${toneClass} rounded-full animate-bounce`}
              />
            ))}
          </div>
          {message ? (
            <div className="text-center">
              <p className="text-sm text-slate-700 font-semibold">{message}</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-1.5">
        {dotToneClasses.map((toneClass) => (
          <div
            key={`inline-dot-${toneClass}`}
            className={`${dotSize} ${toneClass} rounded-full animate-bounce`}
          />
        ))}
      </div>
      {message ? (
        <div className="text-center">
          <p className="text-sm text-slate-700 font-semibold">{message}</p>
        </div>
      ) : null}
    </div>
  );
}
