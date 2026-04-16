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
  placeholder?: string;
}

const MAX_TEXTAREA_HEIGHT = 140;
const TYPING_HEARTBEAT_INTERVAL = 2200;

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  compact = false,
  placeholder = "Nhập tin nhắn...",
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingHeartbeatRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const isFocusedRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      onTypingStop?.();
      isTypingRef.current = false;
    }

    if (typingHeartbeatRef.current !== null) {
      window.clearInterval(typingHeartbeatRef.current);
      typingHeartbeatRef.current = null;
    }
  }, [onTypingStop]);

  const startTypingHeartbeat = useCallback(() => {
    if (isTypingRef.current) {
      return;
    }

    isTypingRef.current = true;
    onTypingStart?.();

    typingHeartbeatRef.current = window.setInterval(() => {
      if (isTypingRef.current && isFocusedRef.current) {
        onTypingStart?.();
      }
    }, TYPING_HEARTBEAT_INTERVAL);
  }, [onTypingStart]);

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

  const handleChange = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      resizeTextarea();

      const hasMeaningfulContent = nextValue.trim().length > 0;

      if (!hasMeaningfulContent) {
        stopTyping();
        return;
      }

      if (isFocusedRef.current) {
        startTypingHeartbeat();
      }
    },
    [resizeTextarea, startTypingHeartbeat, stopTyping]
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTyping();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopTyping]);

  return (
    <div
      className={`border-t border-gray-200 bg-white/95 px-3 py-3 dark:border-gray-800 dark:bg-gray-900/90 ${
        compact ? "sm:px-3" : "sm:px-4"
      }`}
    >
      <div className="flex items-center gap-2">
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
          onFocus={() => {
            isFocusedRef.current = true;
            if (value.trim().length > 0) {
              startTypingHeartbeat();
            }
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            stopTyping();
          }}
          placeholder={placeholder}
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
