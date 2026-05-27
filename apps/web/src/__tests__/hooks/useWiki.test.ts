import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mock setup ────────────────────────────────────────────────────────────────
const makeColl = () => ({
  getFullList: vi.fn().mockResolvedValue([]),
  getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 1, page: 1, perPage: 20 }),
  create: vi.fn().mockResolvedValue({ id: "new-id" }),
  update: vi.fn().mockResolvedValue({ id: "updated-id" }),
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

// ── Import after mock ─────────────────────────────────────────────────────────
import { useWiki } from "@/lib/hooks/useWiki";

const ARTICLE = {
  id: "a1", title: "Onboarding", content: "<p>Bem-vindo</p>",
  category: "Tutorial", tags: "rh,acesso", author: "u1",
  created: "2024-01-01", updated: "2024-01-01",
};

describe("useWiki", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(cols)) delete cols[k];
    mockPb.collection.mockImplementation((name: string) => {
      if (!cols[name]) cols[name] = makeColl();
      return cols[name];
    });
  });

  it("busca artigos ao montar e expõe loading=false", async () => {
    cols["wiki_articles"] = makeColl();
    cols["wiki_articles"].getFullList.mockResolvedValueOnce([ARTICLE]);

    const { result } = renderHook(() => useWiki());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.articles).toEqual([ARTICLE]);
    expect(cols["wiki_articles"].getFullList).toHaveBeenCalledWith({
      sort: "category,title",
      expand: "author",
    });
  });

  it("retorna array vazio quando a busca falha", async () => {
    cols["wiki_articles"] = makeColl();
    cols["wiki_articles"].getFullList.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useWiki());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.articles).toEqual([]);
  });

  it("createArticle envia dados com author do usuário logado", async () => {
    const { result } = renderHook(() => useWiki());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createArticle({
        title: "Novo", content: "<p>conteúdo</p>", category: "FAQ", tags: "ti",
      });
    });

    expect(cols["wiki_articles"].create).toHaveBeenCalledWith({
      title: "Novo",
      content: "<p>conteúdo</p>",
      category: "FAQ",
      tags: "ti",
      author: "u1",
    });
  });

  it("updateArticle chama pb.update e recarrega a lista", async () => {
    const updated = { ...ARTICLE, title: "Onboarding v2" };
    cols["wiki_articles"] = makeColl();
    cols["wiki_articles"].getFullList
      .mockResolvedValueOnce([ARTICLE])
      .mockResolvedValueOnce([updated]);

    const { result } = renderHook(() => useWiki());
    await waitFor(() => expect(result.current.articles[0]?.title).toBe("Onboarding"));

    await act(async () => {
      await result.current.updateArticle("a1", {
        title: "Onboarding v2", content: "<p>v2</p>", category: "Tutorial", tags: "",
      });
    });

    expect(cols["wiki_articles"].update).toHaveBeenCalledWith("a1", {
      title: "Onboarding v2", content: "<p>v2</p>", category: "Tutorial", tags: "",
    });
  });

  it("deleteArticle chama pb.delete e remove localmente", async () => {
    cols["wiki_articles"] = makeColl();
    cols["wiki_articles"].getFullList.mockResolvedValueOnce([ARTICLE]);

    const { result } = renderHook(() => useWiki());
    await waitFor(() => expect(result.current.articles).toHaveLength(1));

    await act(async () => {
      await result.current.deleteArticle("a1");
    });

    expect(cols["wiki_articles"].delete).toHaveBeenCalledWith("a1");
    expect(result.current.articles).toHaveLength(0);
  });

  it("assina realtime de wiki_articles ao montar", async () => {
    const { result } = renderHook(() => useWiki());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cols["wiki_articles"].subscribe).toHaveBeenCalledWith("*", expect.any(Function));
  });

  it("cancela subscription ao desmontar", async () => {
    const { result, unmount } = renderHook(() => useWiki());
    await waitFor(() => expect(result.current.loading).toBe(false));
    unmount();
    expect(cols["wiki_articles"].unsubscribe).toHaveBeenCalledWith("*");
  });
});
