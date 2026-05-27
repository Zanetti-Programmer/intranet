import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mock setup ────────────────────────────────────────────────────────────────
const makeColl = () => ({
  getFullList: vi.fn().mockResolvedValue([]),
  getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 1, page: 1, perPage: 20 }),
  getOne: vi.fn().mockResolvedValue({}),
  create: vi.fn().mockResolvedValue({ id: "post-1" }),
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

import { usePosts } from "@/lib/hooks/usePosts";

const POST = {
  id: "p1", content: "Bom dia equipe!", author: "u1",
  space: "", pinned: false, created: "2024-01-01", updated: "2024-01-01",
};

describe("usePosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(cols)) delete cols[k];
    mockPb.collection.mockImplementation((name: string) => {
      if (!cols[name]) cols[name] = makeColl();
      return cols[name];
    });
  });

  it("carrega a página 1 ao montar", async () => {
    cols["posts"] = makeColl();
    cols["posts"].getList.mockResolvedValueOnce({
      items: [POST], totalItems: 1, totalPages: 1, page: 1, perPage: 20,
    });

    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(cols["posts"].getList).toHaveBeenCalledWith(1, 20, expect.any(Object));
    expect(result.current.posts).toHaveLength(1);
  });

  it("hasMore=true quando há mais páginas", async () => {
    cols["posts"] = makeColl();
    cols["posts"].getList.mockResolvedValueOnce({
      items: Array(20).fill(POST).map((p, i) => ({ ...p, id: `p${i}` })),
      totalItems: 40, totalPages: 2, page: 1, perPage: 20,
    });

    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasMore).toBe(true);
  });

  it("loadMore busca a página 2 e acumula posts", async () => {
    const page1 = Array(20).fill(null).map((_, i) => ({ ...POST, id: `p1-${i}` }));
    const page2 = Array(5).fill(null).map((_, i) => ({ ...POST, id: `p2-${i}` }));

    cols["posts"] = makeColl();
    cols["posts"].getList
      .mockResolvedValueOnce({ items: page1, totalItems: 25, totalPages: 2, page: 1, perPage: 20 })
      .mockResolvedValueOnce({ items: page2, totalItems: 25, totalPages: 2, page: 2, perPage: 20 });

    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.posts).toHaveLength(20));

    await act(async () => { result.current.loadMore(); });
    await waitFor(() => expect(result.current.posts).toHaveLength(25));

    expect(cols["posts"].getList).toHaveBeenNthCalledWith(2, 2, 20, expect.any(Object));
  });

  it("createPost monta FormData com content e author", async () => {
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createPost("Hoje tem happy hour!");
    });

    const [formData] = cols["posts"].create.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("content")).toBe("Hoje tem happy hour!");
    expect(formData.get("author")).toBe("u1");
  });

  it("createPost inclui spaceId no FormData quando fornecido", async () => {
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createPost("Post do grupo", "space-abc");
    });

    const [formData] = cols["posts"].create.mock.calls[0];
    expect(formData.get("space")).toBe("space-abc");
  });

  it("deletePost chama pb.delete com o id correto", async () => {
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deletePost("p1");
    });

    expect(cols["posts"].delete).toHaveBeenCalledWith("p1");
  });

  it("updatePost chama pb.update com content", async () => {
    const { result } = renderHook(() => usePosts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePost("p1", "Conteúdo editado");
    });

    expect(cols["posts"].update).toHaveBeenCalledWith("p1", { content: "Conteúdo editado" });
  });

  it("aplica filtro de space quando fornecido", async () => {
    cols["posts"] = makeColl();
    cols["posts"].getList.mockResolvedValueOnce({ items: [], totalItems: 0, totalPages: 1, page: 1, perPage: 20 });

    const { result } = renderHook(() => usePosts("space-xyz"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const call = cols["posts"].getList.mock.calls[0];
    expect(call[2].filter).toBe(`space = "space-xyz"`);
  });
});
