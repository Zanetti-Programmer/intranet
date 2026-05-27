import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mock setup ────────────────────────────────────────────────────────────────
const makeColl = () => ({
  getFullList: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: "vote-1", option_idx: 0 }),
  update: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue(true),
  subscribe: vi.fn().mockResolvedValue(undefined),
  unsubscribe: vi.fn().mockResolvedValue(undefined),
});
type MockColl = ReturnType<typeof makeColl>;
const cols: Record<string, MockColl> = {};

const mockPb = {
  authStore: {
    isValid: true,
    record: { id: "u1", name: "User", role: "user", email: "u@t.com" },
    onChange: vi.fn(),
  },
  collection: vi.fn((name: string) => {
    if (!cols[name]) cols[name] = makeColl();
    return cols[name];
  }),
  autoCancellation: vi.fn(),
};

vi.mock("@/lib/pocketbase", () => ({ default: vi.fn(() => mockPb) }));

import { usePolls } from "@/lib/hooks/usePesquisas";

const POLL = {
  id: "p1", question: "Qual dia da confraternização?",
  options: ["Sexta", "Sábado", "Domingo"], status: "ativa" as const,
  author: "u1", created: "2024-01-01",
};
const VOTE = { id: "v1", poll: "p1", user: "u1", option_idx: 0 };

describe("usePolls — votar em enquetes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(cols)) delete cols[k];
    mockPb.collection.mockImplementation((name: string) => {
      if (!cols[name]) cols[name] = makeColl();
      return cols[name];
    });
  });

  it("busca polls e votos do usuário ao montar", async () => {
    cols["polls"] = makeColl();
    cols["polls"].getFullList.mockResolvedValueOnce([POLL]);
    cols["poll_votes"] = makeColl();
    cols["poll_votes"].getFullList
      .mockResolvedValueOnce([VOTE])   // meus votos
      .mockResolvedValueOnce([VOTE]);  // todos os votos

    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.polls).toHaveLength(1);
    expect(result.current.hasVoted("p1")).toBe(true);
    expect(result.current.getVotedIdx("p1")).toBe(0);
  });

  it("vote: option_idx=0 (primeira opção) é enviado corretamente", async () => {
    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.vote("p1", 0);
    });

    expect(cols["poll_votes"].create).toHaveBeenCalledWith({
      poll: "p1",
      user: "u1",
      option_idx: 0,
    });
  });

  it("vote: option_idx=1 (segunda opção) é enviado corretamente", async () => {
    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.vote("p1", 1);
    });

    expect(cols["poll_votes"].create).toHaveBeenCalledWith({
      poll: "p1",
      user: "u1",
      option_idx: 1,
    });
  });

  it("vote: option_idx=2 (terceira opção) é enviado corretamente", async () => {
    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.vote("p1", 2);
    });

    expect(cols["poll_votes"].create).toHaveBeenCalledWith(
      expect.objectContaining({ option_idx: 2 })
    );
  });

  it("createPoll envia dados corretos com status=ativa", async () => {
    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createPoll({
        question: "Precisa de homeoffice?",
        options: ["Sim", "Não", "Híbrido"],
        deadline: "2024-12-31",
      });
    });

    expect(cols["polls"].create).toHaveBeenCalledWith({
      question: "Precisa de homeoffice?",
      options: ["Sim", "Não", "Híbrido"],
      deadline: "2024-12-31",
      status: "ativa",
      author: "u1",
    });
  });

  it("closePoll atualiza status para encerrada", async () => {
    cols["polls"] = makeColl();
    cols["polls"].getFullList.mockResolvedValue([POLL]);

    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.closePoll("p1");
    });

    expect(cols["polls"].update).toHaveBeenCalledWith("p1", { status: "encerrada" });
  });

  it("totalVotes soma corretamente os votos por opção", async () => {
    cols["polls"] = makeColl();
    cols["polls"].getFullList.mockResolvedValueOnce([POLL]);
    cols["poll_votes"] = makeColl();
    const votes = [
      { id: "v1", poll: "p1", user: "u1", option_idx: 0 },
      { id: "v2", poll: "p1", user: "u2", option_idx: 0 },
      { id: "v3", poll: "p1", user: "u3", option_idx: 1 },
    ];
    cols["poll_votes"].getFullList
      .mockResolvedValueOnce([])    // meus votos
      .mockResolvedValueOnce(votes); // todos os votos

    const { result } = renderHook(() => usePolls());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.totalVotes("p1")).toBe(3);
  });
});
