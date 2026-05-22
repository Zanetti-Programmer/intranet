import type { Achievement } from "@/types";
import { UserAvatar } from "@/components/shared/UserAvatar";

const ICON_BG: Record<string, string> = {
  "🏆": "from-yellow-500/30 to-amber-500/10",
  "⭐": "from-blue-500/30 to-indigo-500/10",
  "🎯": "from-red-500/30 to-rose-500/10",
  "💡": "from-purple-500/30 to-violet-500/10",
  "❤️": "from-pink-500/30 to-rose-500/10",
  "🌟": "from-amber-500/30 to-yellow-500/10",
  "🚀": "from-cyan-500/30 to-blue-500/10",
  "🦁": "from-orange-500/30 to-amber-500/10",
  "💎": "from-sky-500/30 to-blue-500/10",
  "🔥": "from-orange-500/30 to-red-500/10",
  "👏": "from-green-500/30 to-emerald-500/10",
};
const defaultBg = "from-primary/20 to-primary/5";

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const recipient = achievement.expand?.recipient;
  const author = achievement.expand?.author;
  const bg = ICON_BG[achievement.icon] ?? defaultBg;

  return (
    <div className={`bg-gradient-to-br ${bg} border border-border rounded-2xl p-5 flex flex-col items-center text-center gap-3`}>
      <div className="text-5xl leading-none">{achievement.icon || "🏆"}</div>
      <div>
        <h3 className="font-bold text-base">{achievement.title}</h3>
        {achievement.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{achievement.description}</p>
        )}
      </div>
      {recipient && (
        <div className="flex items-center gap-2 bg-background/50 rounded-xl px-3 py-2">
          <UserAvatar user={recipient} size="sm" />
          <div className="text-left">
            <p className="text-xs font-semibold leading-none">{recipient.name}</p>
            {recipient.department && <p className="text-[10px] text-muted-foreground mt-0.5">{recipient.department}</p>}
          </div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">
        {achievement.date
          ? new Date(achievement.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
          : ""
        }
        {author && ` · por ${author.name}`}
      </p>
    </div>
  );
}
