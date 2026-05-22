import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost/pb";

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function avatarUrl(user: Pick<User, "id" | "avatar">) {
  if (!user.avatar) return undefined;
  return `${PB_URL}/api/files/users/${user.id}/${user.avatar}?thumb=80x80`;
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
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };

export function UserAvatar({ user, size = "md", className }: Props) {
  return (
    <Avatar className={cn(SIZE[size], className)}>
      <AvatarImage src={avatarUrl(user)} />
      <AvatarFallback className={cn("text-white font-semibold", colorForId(user.id))}>
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
