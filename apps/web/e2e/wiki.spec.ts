import { test, expect } from "@playwright/test";

const TITLE = `Wiki E2E ${Date.now()}`;
const TITLE_EDITED = `${TITLE} — editado`;
const CONTENT = "Conteúdo criado pelo teste automatizado.";

test.describe.serial("Wiki — CRUD completo", () => {
  test("cria artigo e aparece na lista", async ({ page }) => {
    await page.goto("/wiki");
    await page.getByRole("button", { name: /novo artigo/i }).click();

    const modal = page.locator(".shadow-2xl").first();
    await modal.waitFor({ state: "visible" });
    await modal.locator("input").first().fill(TITLE);

    // Tiptap editor — pressSequentially dispara teclado; aguarda botão habilitar
    const editor = modal.locator(".ProseMirror");
    await editor.click();
    await editor.pressSequentially(CONTENT, { delay: 30 });
    await expect(editor).toContainText(CONTENT, { timeout: 5000 });

    // Aguarda React processar o onUpdate do Tiptap (botão fica enabled)
    const submitBtn = page.getByRole("button", { name: /publicar artigo/i });
    await expect(submitBtn).not.toBeDisabled({ timeout: 5000 });
    await submitBtn.click();

    // Aguarda modal fechar e artigo aparecer na lista
    await modal.waitFor({ state: "hidden", timeout: 10000 });
    await expect(page.getByRole("link", { name: TITLE })).toBeVisible({ timeout: 10000 });
  });

  test("título é um link que navega para /wiki/:id", async ({ page }) => {
    await page.goto("/wiki");
    const link = page.getByRole("link", { name: TITLE });
    await expect(link).toBeVisible({ timeout: 8000 });
    await link.click();
    await expect(page).toHaveURL(/\/wiki\/.+/);
    await expect(page.getByText(TITLE)).toBeVisible();
  });

  test("edita título do artigo", async ({ page }) => {
    await page.goto("/wiki");
    const card = page.locator(".bg-card").filter({ hasText: TITLE }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.hover();

    // Primeiro botão nos controles de gerenciamento (Pencil = editar)
    await card.locator(".shrink-0 button").first().click();

    const modal = page.locator(".shadow-2xl").first();
    await modal.waitFor({ state: "visible" });
    const titleInput = modal.locator("input").first();
    await titleInput.clear();
    await titleInput.fill(TITLE_EDITED);

    const saveBtn = page.getByRole("button", { name: /salvar/i });
    await expect(saveBtn).not.toBeDisabled({ timeout: 3000 });
    await saveBtn.click();
    await modal.waitFor({ state: "hidden", timeout: 8000 });

    await expect(page.getByRole("link", { name: TITLE_EDITED })).toBeVisible({ timeout: 8000 });
  });

  test("exclui artigo e some da lista", async ({ page }) => {
    await page.goto("/wiki");
    const card = page.locator(".bg-card").filter({ hasText: TITLE_EDITED }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.hover();

    // Segundo botão nos controles (Trash2 = excluir)
    await card.locator(".shrink-0 button").last().click();

    await expect(page.getByRole("link", { name: TITLE_EDITED })).not.toBeVisible({ timeout: 8000 });
  });
});
