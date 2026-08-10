"use client";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
}

export function ToggleSwitch({
  enabled,
  onChange,
  activeColor = "bg-[#C9A84C]",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`w-12 h-6 rounded-full transition-all relative ${enabled ? activeColor : "bg-[#2A2A2A]"}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-[#0D0D0D] transition-all ${enabled ? "left-7" : "left-1"}`}
      />
    </button>
  );
}
