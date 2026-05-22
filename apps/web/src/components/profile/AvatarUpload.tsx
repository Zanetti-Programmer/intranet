"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { cn, getPBBaseUrl } from "@/lib/utils";
import type { User } from "@/types";

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const COLORS = [
  "bg-blue-500","bg-violet-500","bg-rose-500","bg-amber-500",
  "bg-emerald-500","bg-cyan-500","bg-pink-500","bg-indigo-500",
];
function colorForId(id: string) {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return COLORS[n % COLORS.length];
}

interface Props {
  user: Pick<User, "id" | "avatar" | "name">;
  onFileSelect: (file: File) => void;
}

export function AvatarUpload({ user, onFileSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const currentUrl = user.avatar
    ? `${getPBBaseUrl()}/api/files/users/${user.id}/${user.avatar}?thumb=200x200`
    : null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }

  const src = preview ?? currentUrl;

  return (
    <div className="relative w-24 h-24 group cursor-pointer" onClick={() => inputRef.current?.click()}>
      {src ? (
        <img src={src} alt={user.name} className="w-24 h-24 rounded-full object-cover border-2 border-border" />
      ) : (
        <div className={cn("w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-border", colorForId(user.id))}>
          {initials(user.name)}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="w-6 h-6 text-white" />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
