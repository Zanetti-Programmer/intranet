export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  department?: string;
  role: "admin" | "user" | "rh" | "ti";
  bio?: string;
  phone?: string;
  birthday?: string;
  created: string;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  created_by: string;
}

export interface Post {
  id: string;
  author: string;
  expand?: { author: User };
  content: string;
  space: string;
  attachments?: string[];
  pinned: boolean;
  created: string;
  updated: string;
}

export interface PostReaction {
  id: string;
  post: string;
  user: string;
  emoji: string;
}

export interface PostComment {
  id: string;
  post: string;
  author: string;
  expand?: { author: User };
  content: string;
  created: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category?: string;
  author: string;
  expand?: { author: User };
  space?: string;
  pinned: boolean;
  expires?: string;
  priority: "normal" | "high" | "urgent";
  created: string;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  type: "channel" | "dm";
  description?: string;
  space?: string;
  created_by?: string;
  expand?: { space?: Space };
}

export interface ChannelMember {
  id: string;
  channel: string;
  user: string;
  expand?: { user: User; channel: Channel };
}

export interface Message {
  id: string;
  channel: string;
  author: string;
  expand?: { author: User };
  content: string;
  attachments?: string[];
  created: string;
  updated: string;
}

export interface TypingStatus {
  id: string;
  channel: string;
  user: string;
  expand?: { user: User };
  updated: string;
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  title: string;
  description: string;
  author: string;
  expand?: { author: User; assignee?: User };
  assignee?: string;
  status: "aberto" | "em_andamento" | "resolvido" | "fechado";
  category: "hardware" | "software" | "rede" | "acesso" | "outro";
  priority: "baixa" | "media" | "alta" | "urgente";
  created: string;
  updated: string;
}

// ── Achievements & Marketplace ────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  recipient: string;
  expand?: { recipient: User; author: User };
  author: string;
  icon: string;
  date: string;
  public: boolean;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  file: string;
  category: string;
  author: string;
  expand?: { author: User };
  created: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department?: string;
  description: string;
  requirements?: string;
  type: "CLT" | "PJ" | "Estágio" | "Temporário";
  deadline?: string;
  status: "aberta" | "encerrada";
  author: string;
  expand?: { author: User };
  created: string;
}

export interface JobApplication {
  id: string;
  job: string;
  user: string;
  expand?: { user: User };
  message?: string;
  status: "inscrito" | "em_analise" | "aprovado" | "reprovado";
  created: string;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  details?: string;
  category: string;
  icon: string;
  link?: string;
  author: string;
  created: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string;
  author: string;
  expand?: { author: User };
  created: string;
  updated: string;
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  icon?: string;
  author: string;
  order?: number;
  created: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  cover?: string;
  type: "news" | "blog";
  tags?: string;
  status: "published" | "draft";
  author: string;
  expand?: { author: User };
  created: string;
}

export interface WallCard {
  id: string;
  message: string;
  type: "parabens" | "boas_vindas" | "conquista" | "despedida" | "recado";
  recipient?: string;
  author: string;
  emoji: string;
  expand?: { author: User; recipient?: User };
  created: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  author: string;
  expand?: { author: User };
  deadline?: string;
  status: "ativa" | "encerrada";
  created: string;
}

export interface PollVote {
  id: string;
  poll: string;
  user: string;
  option_idx: number;
  created: string;
}

export interface Training {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration?: string;
  category: string;
  author: string;
  expand?: { author: User };
  created: string;
}

export interface TrainingCompletion {
  id: string;
  training: string;
  user: string;
  created: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string;
  created_by: string;
  expand?: { assignee: User; created_by: User };
  due_date?: string;
  status: "pendente" | "em_andamento" | "concluida";
  priority: "baixa" | "media" | "alta";
  is_team: boolean;
  created: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  photos?: string[];
  author: string;
  expand?: { author: User };
  status: "disponivel" | "vendido" | "reservado";
  category: string;
  contact_dm: boolean;
  created: string;
}
