import type { Ticket } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";

const STATUS_STYLE: Record<Ticket["status"], { label: string; class: string }> = {
  aberto:        { label: "Aberto",         class: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  em_andamento:  { label: "Em andamento",   class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  resolvido:     { label: "Resolvido",      class: "bg-green-500/15 text-green-400 border-green-500/30" },
  fechado:       { label: "Fechado",        class: "bg-muted text-muted-foreground border-border" },
};

const PRIORITY_STYLE: Record<Ticket["priority"], { label: string; dot: string }> = {
  urgente: { label: "Urgente", dot: "bg-red-500"    },
  alta:    { label: "Alta",    dot: "bg-orange-500" },
  media:   { label: "Média",   dot: "bg-yellow-500" },
  baixa:   { label: "Baixa",   dot: "bg-blue-400"   },
};

const CATEGORY_LABEL: Record<Ticket["category"], string> = {
  hardware: "Hardware", software: "Software", rede: "Rede",
  acesso: "Acesso", outro: "Outro",
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const status = STATUS_STYLE[ticket.status];
  const priority = PRIORITY_STYLE[ticket.priority];
  const author = ticket.expand?.author;

  return (
    <Link href={`/chamados/${ticket.id}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", status.class)}>
              {status.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
              {priority.label}
            </span>
            <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {CATEGORY_LABEL[ticket.category]}
            </span>
          </div>
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {ticket.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.description}</p>
        </div>
        {author && <UserAvatar user={author} size="sm" className="shrink-0" />}
      </div>
      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
        <span>{author?.name}</span>
        <div className="flex items-center gap-2">
          {ticket.expand?.assignee && (
            <span className="text-primary">→ {ticket.expand.assignee.name}</span>
          )}
          <span>{formatDistanceToNow(ticket.created)}</span>
        </div>
      </div>
    </Link>
  );
}
