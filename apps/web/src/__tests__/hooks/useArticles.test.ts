import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ── Mock setup ────────────────────────────────────────────────────────────────
const makeColl = () => ({
  getFullList: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: "new-id" }),
  update: vi.fn().mockResolvedValue({ id: "updated-id" }),
  delete: vi.fn().mockResolvedValue(true),
  subscribe: vi.fn().mockResolvedValue(undefined),
  unsubscribe: vi.fn().mockResolvedValue(undefined),
});
type MockColl = ReturnType<typeof makeColl>;
const cols: Record<string, MockColl> = {};

const mockAuth = {
  isValid: true,
  record: { id: "u1", name: "Admin", role: "admin", email: "a@t.com" },
  onChange: vi.fn(),
};

const mockPb = {
  authStore: mockAuth,
  collection: vi.fn((name: string) => {
    if (!cols[name]) cols[name] = makeColl();
    return cols[name];
  }),
  autoCancellation: vi.fn(),
};

vi.mock("@/lib/pocketbase", () => ({ default: vi.fn(() => mockPb) }));

import { useArticles } from "@/lib/hooks/useArticles";

const NEWS = {
  id: "n1", title: "Nova filial", content: "<p>texto</p>", type: "news" as const,
  status: "published" as const, tags: "", author: "u1", created: "2024-01-01", updated: "2024-01-01",
};

describe("useArticles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(cols)) delete cols[k];
    mockPb.authStore.record = { id: "u1", name: "Admin", role: "admin", email: "a@t.com" };
    mockPb.collection.mockImplementation((name: string) => {
      if (!cols[name]) cols[name] = makeColl();
      return cols[name];
    });
  });

  it("admin: busca sem filtro de status (vê rascunhos)", async () => {
    mockPb.authStore.record = { ...mockPb.authStore.record, role: "admin" };
    cols["articles"] = makeColl();
    cols["articles"].getFullList.mockResolvedValueOnce([NEWS]);

    const { result } = renderHook(() => useArticles("news"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const call = cols["articles"].getFullList.mock.calls[0][0];
    expect(call.filter).toBe(`type = "news"`);
    expect(result.current.articles).toHaveLength(1);
  });

  it("user: busca filtra status = published", async () => {
    mockPb.authStore.record = { id: "u2", name: "User", role: "user", email: "u@t.com" };
    cols["articles"] = makeColl();
    cols["articles"].getFullList.mockResolvedValueOnce([NEWS]);

    const { result } = renderHook(() => useArticles("news"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const call = cols["articles"].getFullList.mock.calls[0][0];
    expect(call.filter).toBe(`type = "news" && status = "published"`);
  });

  it("createArticle monta FormData com todos os campos", async () => {
    const { result } = renderHook(() => useArticles("blog"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createArticle({
        title: "Post", content: "<p>body</p>", tags: "tech", status: "published",
      });
    });

    const [formData] = cols["articles"].create.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("title")).toBe("Post");
    expect(formData.get("type")).toBe("blog");
    expect(formData.get("status")).toBe("published");
    expect(formData.get("author")).toBe("u1");
  });

  it("deleteArticle chama pb.delete e remove do estado", async () => {
    cols["articles"] = makeColl();
    cols["articles"].getFullList.mockResolvedValueOnce([NEWS]);

    const { result } = renderHook(() => useArticles("news"));
    await waitFor(() => expect(result.current.articles).toHaveLength(1));

    await act(async () => {
      await result.current.deleteArticle("n1");
    });

    expect(cols["articles"].delete).toHaveBeenCalledWith("n1");
    expect(result.current.articles).toHaveLength(0);
  });

  it("publishArticle chama update com status published", async () => {
    cols["articles"] = makeColl();
    cols["articles"].getFullList.mockResolvedValue([NEWS]);

    const { result } = renderHook(() => useArticles("news"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.publishArticle("n1");
    });

    expect(cols["articles"].update).toHaveBeenCalledWith("n1", { status: "published" });
  });

  it("updateArticle chama pb.update com os dados corretos", async () => {
    const { result } = renderHook(() => useArticles("news"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateArticle("n1", {
        title: "Editado", content: "<p>novo</p>", tags: "", status: "published",
      });
    });

    expect(cols["articles"].update).toHaveBeenCalledWith("n1", {
      title: "Editado", content: "<p>novo</p>", tags: "", status: "published",
    });
  });
});
