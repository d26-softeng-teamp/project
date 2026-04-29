import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
};

export function HelpTooltip({ text, position = "top" }: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [visible]);

  function updateCoords() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const TOOLTIP_W = 208; // w-52
    const GAP = 8;

    let top = 0;
    let left = 0;

    if (position === "top") {
      top = rect.top + window.scrollY - GAP;
      left = rect.left + window.scrollX + rect.width / 2;
    } else if (position === "bottom") {
      top = rect.bottom + window.scrollY + GAP;
      left = rect.left + window.scrollX + rect.width / 2;
    } else if (position === "left") {
      top = rect.top + window.scrollY + rect.height / 2;
      left = rect.left + window.scrollX - GAP;
    } else {
      top = rect.top + window.scrollY + rect.height / 2;
      left = rect.right + window.scrollX + GAP;
    }

    // Keep tooltip within viewport horizontally
    const halfW = TOOLTIP_W / 2;
    if (position === "top" || position === "bottom") {
      left = Math.max(halfW + 4, Math.min(left, window.innerWidth - halfW - 4));
    }

    setCoords({ top, left });
  }

  function handleMouseEnter() {
    updateCoords();
    setVisible(true);
  }

  function handleClick() {
    updateCoords();
    setVisible((v) => !v);
  }

  const transformMap: Record<string, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0%)",
    left: "translate(-100%, -50%)",
    right: "translate(0%, -50%)",
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        onClick={handleClick}
        aria-label="Help"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold text-muted-foreground hover:border-hanover-green hover:text-hanover-green transition-colors"
      >
        ?
      </button>

      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              transform: transformMap[position],
              zIndex: 9999,
            }}
            className="w-52 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg"
          >
            <p className="text-xs font-normal text-foreground">{text}</p>
          </div>,
          document.body,
        )}
    </div>
  );
}
