"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
}

export function TagInput({ tags, onChange, placeholder, id }: TagInputProps) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput("");
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg min-h-[50px]">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs text-[#C9A84C]">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? (placeholder ?? "Press enter to add tags...") : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm px-2"
      />
    </div>
  );
}
