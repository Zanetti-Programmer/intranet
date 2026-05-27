import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mock setup ────────────────────────────────────────────────────────────────
const makeColl = () => ({
  getFullList: vi.fn().mockResolvedValue([]),
  getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 1, page: 1, perPage: 100 }),
  create: vi.fn().mockResolvedValue({ id: "ticket-1" }),
  update: vi.fn().mockResolvedValue({ id: "ticket-1" }),
  delete: vi.fn().mockResolvedValue(true),
  subscribe: vi.fn().mockResolvedValue(undefined),
  unsubscribe: vi.fn().mockResolvedValue(undefined),
});
type MockColl = ReturnType<typeof makeColl>;
const cols: Record<string, MockColl> = {};

const mockPb = {
  authStore: {
    isValid: true,
    record: { id: "u1", name: "Admin", role: "admin", email: "a@t.com" },
    onChange: vi.fn(),
  },
  collection: vi.fn((name: string) => {
    if (!cols[name]) cols[name] = makeColl();
    return cols[name];
  }),
  autoCancellation: vi.fn(),
};

vi.mock("@/lib/pocketbase", () => ({ default: vi.fn(() => mockPb) }));

import { useTickets } from "@/lib/hooks/useTickets";

const TICKET = {
  id: "t1", title: "PC não liga", description: "Desc", category: "hardware",
  priority: "alta", status: "aberto" as const, author: "u1",
  created: "2024-01-01", updated: "2024-01-01",
};

describe("useTickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(cols)) delete cols[k];
    mockPb.collection.mockImplementation((name: string) => {
      if (!cols[name]) cols[name] = makeColl();
      return cols[name];
    });
  });

  it("busca tickets sem filtro de status", async () => {
    cols["tickets"] = makeColl();
    cols["tickets"].getList.mockResolvedValueOnce({ items: [TICKET], totalItems: 1, totalPages: 1, page: 1, perPage: 100 });

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const call = cols["tickets"].getList.mock.calls[0];
    expect(call[2].filter).toBe("");
    expect(result.current.tickets).toHaveLength(1);
  });

  it("busca tickets com filtro de status", async () => {
    cols["tickets"] = makeColl();
    cols["tickets"].getList.mockResolvedValueOnce({ items: [], totalItems: 0, totalPages: 1, page: 1, perPage: 100 });

    const { result } = renderHook(() => useTickets("aberto"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const call = cols["tickets"].getList.mock.calls[0];
    expect(call[2].filter).toBe(`status = "aberto"`);
  });

  it("createTicket cria com status=aberto e author do usuário", async () => {
    cols["tickets"] = makeColl();
    cols["tickets"].create.mockResolvedValueOnce({ id: "new-ticket" });
    cols["users"] = makeColl();
    cols["users"].getFullList.mockResolvedValueOnce([{ id: "ti1" }]);

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createTicket({
        title: "Impressora", description: "não imprime", category: "hardware", priority: "media",
      });
    });

    expect(cols["tickets"].create).toHaveBeenCalledWith(expect.objectContaining({
      title: "Impressora",
      status: "aberto",
      author: "u1",
    }));
  });

  it("createTicket notifica usuários com role=ti", async () => {
    cols["tickets"] = makeColl();
    cols["tickets"].create.mockResolvedValueOnce({ id: "t-new" });
    cols["users"] = makeColl();
    cols["users"].getFullList.mockResolvedValueOnce([{ id: "ti1" }, { id: "ti2" }]);
    cols["notifications"] = makeColl();

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createTicket({
        title: "Chamado TI", description: "ajuda", category: "software", priority: "baixa",
      });
    });

    // Pequeno delay para as promises de notificação resolverem
    await new Promise((r) => setTimeout(r, 10));

    expect(cols["users"].getFullList).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'role = "ti"' })
    );
    expect(cols["notifications"].create).toHaveBeenCalledTimes(2);
  });

  it("updateStatus atualiza API e estado local", async () => {
    cols["tickets"] = makeColl();
    cols["tickets"].getList.mockResolvedValueOnce({
      items: [TICKET], totalItems: 1, totalPages: 1, page: 1, perPage: 100,
    });

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.tickets[0]?.status).toBe("aberto"));

    await act(async () => {
      await result.current.updateStatus("t1", "em_andamento");
    });

    expect(cols["tickets"].update).toHaveBeenCalledWith("t1", { status: "em_andamento" });
    expect(result.current.tickets[0].status).toBe("em_andamento");
  });

  it("assignTicket chama update com assignee", async () => {
    cols["tickets"] = makeColl();
    cols["tickets"].getList.mockResolvedValue({ items: [], totalItems: 0, totalPages: 1, page: 1, perPage: 100 });

    const { result } = renderHook(() => useTickets());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.assignTicket("t1", "ti-user-id");
    });

    expect(cols["tickets"].update).toHaveBeenCalledWith("t1", { assignee: "ti-user-id" });
  });
});
