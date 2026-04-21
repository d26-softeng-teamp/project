import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const presetColors = [
    "#7f1d1d",
    "#b91c1c",
    "#ef4444",
    "#7c2d12",
    "#c2410c",
    "#f97316",
    "#713f12",
    "#a16207",
    "#eab308",
    "#14532d",
    "#15803d",
    "#22c55e",
    "#1e3a8a",
    "#1d4ed8",
    "#3b82f6",
    "#312e81",
    "#4338ca",
    "#6366f1",
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded border px-3 py-2 text-sm"
      >
        Color
        <span className="ml-2 inline-block h-3 w-3 rounded" style={{ backgroundColor: value }} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-35 rounded border bg-background p-2 shadow-lg">
          <div className="grid grid-cols-6 gap-.5">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className="h-5 w-5 rounded-sm border hover:scale-110 transition"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
