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
  author: string;
  expand?: { author: User };
  space?: string;
  pinned: boolean;
  expires?: string;
  priority: "normal" | "high" | "urgent";
  created: string;
}

export interface Channel {
  id: string;
  name: string;
  space?: string;
  type: "channel" | "dm";
  created_by: string;
}

export interface Message {
  id: string;
  channel: string;
  author: string;
  expand?: { author: User };
  content: string;
  attachments?: string[];
  created: string;
}

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
  contact_via_dm: boolean;
  created: string;
}
