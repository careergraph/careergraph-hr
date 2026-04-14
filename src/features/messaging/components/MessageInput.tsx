import { useCallback, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const MAX_TEXTAREA_HEIGHT = 140;
const TYPING_STOP_DELAY = 2800;

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  compact = false,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      onTypingStop?.();
      isTypingRef.current = false;
    }

    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [onTypingStop]);

  const resizeTextarea = useCallback(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      MAX_TEXTAREA_HEIGHT
    )}px`;
  }, []);

  const scheduleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      stopTyping();
    }, TYPING_STOP_DELAY);
  }, [stopTyping]);

  const handleChange = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      resizeTextarea();

      const hasMeaningfulContent = nextValue.trim().length > 0;

      if (hasMeaningfulContent && !isTypingRef.current) {
        onTypingStart?.();
        isTypingRef.current = true;
      }

      if (!hasMeaningfulContent) {
        stopTyping();
        return;
      }

      scheduleTypingStop();
    },
    [onTypingStart, resizeTextarea, scheduleTypingStop, stopTyping]
  );

  const submitMessage = useCallback(async () => {
    const payload = value.trim();

    if (!payload || disabled || isSending) {
      return;
    }

    setIsSending(true);
    stopTyping();

    try {
      const sent = await onSend(payload);

      if (sent) {
        setValue("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } finally {
      setIsSending(false);
    }
  }, [disabled, isSending, onSend, stopTyping, value]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return (
    <div
      className={`border-t border-gray-200 bg-white/95 px-3 py-3 dark:border-gray-800 dark:bg-gray-900/90 ${
        compact ? "sm:px-3" : "sm:px-4"
      }`}
    >
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submitMessage();
            }
          }}
          placeholder="Nhập tin nhắn..."
          className="min-h-10.5 max-h-35 resize-none rounded-2xl border-gray-200 bg-gray-50 text-sm shadow-inner focus-visible:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800"
          disabled={disabled || isSending}
        />

        <Button
          type="button"
          className="h-10 shrink-0 rounded-xl px-3"
          onClick={() => {
            void submitMessage();
          }}
          disabled={disabled || isSending || value.trim().length === 0}
        >
          <SendHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Gửi</span>
        </Button>
      </div>
    </div>
  );
}

export default MessageInput;
