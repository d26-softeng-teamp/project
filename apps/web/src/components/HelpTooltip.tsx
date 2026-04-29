import { useState, useRef, useEffect } from "react";

type Props = {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
};

export function HelpTooltip({ text, position = "top" }: Props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible]);

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        aria-label="Help"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold text-muted-foreground hover:border-hanover-green hover:text-hanover-green transition-colors"
      >
        ?
      </button>

      {visible && (
        <div
          className={`absolute z-50 w-52 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg ${positionClasses[position]}`}
        >
          <p className="text-xs font-normal text-foreground">{text}</p>
        </div>
      )}
    </div>
  );
}
