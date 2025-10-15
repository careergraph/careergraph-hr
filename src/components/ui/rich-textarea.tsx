import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  touched?: boolean;
  className?: string;
  minHeight?: string;
  onBlur?: () => void;
  onFocus?: () => void;
}

export function RichTextarea({
  id,
  value,
  onChange,
  placeholder,
  error,
  touched,
  className,
  minHeight = "8rem",
  onBlur,
  onFocus,
}: RichTextareaProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 🧠 State theo dõi trạng thái định dạng hiện tại
  const [format, setFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    ul: false,
    ol: false,
  });

  // 🧩 Chỉ set innerHTML khi value đổi từ ngoài
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  // ✅ Giữ focus trước khi exec command
  const exec = (command: string) => {
    ref.current?.focus();
    document.execCommand(command, false);
    updateFormatState();
  };

  // 🔍 Hàm cập nhật trạng thái format hiện tại
  const updateFormatState = () => {
    setFormat({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
  };

  // 🎯 Gọi khi người dùng thay đổi vùng chọn (chuột / phím)
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === ref.current) {
        updateFormatState();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return (
    <div
      className={cn(
        "border rounded-md",
        touched && error && "border-red-500 ring-1 ring-red-500"
      )}
    >
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b bg-muted/30">
        <Button
          variant={format.bold ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={format.italic ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={format.underline ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("underline")}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          variant={format.ul ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={format.ol ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("undo")}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => exec("redo")}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editable area */}
      <div
        id={id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={onBlur}
        onFocus={() => {
          updateFormatState();
          onFocus?.();
        }}
        className={cn(
          "p-3 text-sm focus:outline-none",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          "prose dark:prose-invert max-w-none",
          "min-h-[8rem]",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:italic",
          className
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
