import { test, expect, type Page } from "@playwright/test";

const TITLE = `Chamado E2E ${Date.now()}`;
let ticketUrl = "";

// Navega para a página de detalhe do chamado e aguarda os dados carregarem
async function gotoTicketDetail(page: Page, url: string) {
  await page.goto(url);
  // Aguarda spinner de loading sumir (useTickets carregado)
  try {
    await page.locator(".animate-spin").first().waitFor({ state: "hidden", timeout: 8000 });
  } catch {
    // Spinner persistiu — provável bug de auth timing, recarrega
    await page.reload();
    await page.locator(".animate-spin").first().waitFor({ state: "hidden", timeout: 8000 });
  }
}

test.describe.serial("Chamados — CRUD completo", () => {
  test("cria novo chamado e aparece na lista", async ({ page }) => {
    await page.goto("/chamados");
    await page.getByRole("button", { name: /novo chamado/i }).click();

    const modal = page.locator(".shadow-2xl").first();
    await modal.waitFor({ state: "visible" });

    await page.getByPlaceholder("Descreva o problema resumidamente").fill(TITLE);
    await page.getByPlaceholder("Explique o problema com detalhes...").fill("Problema criado pelo teste automatizado");

    await page.getByRole("button", { name: /abrir chamado/i }).click();

    await expect(page.getByText(TITLE)).toBeVisible({ timeout: 8000 });
  });

  test("status inicial é Aberto e guarda URL do chamado", async ({ page }) => {
    await page.goto("/chamados");
    const link = page.locator("a").filter({ hasText: TITLE }).first();
    await expect(link).toBeVisible({ timeout: 8000 });
    await expect(link.getByText("Aberto")).toBeVisible();
    // Navega para detalhe e salva URL
    await link.click();
    await page.waitForURL(/\/chamados\/.+/);
    ticketUrl = page.url();
  });

  test("muda status para Em andamento na página de detalhe", async ({ page }) => {
    if (!ticketUrl) test.skip();
    await gotoTicketDetail(page, ticketUrl);

    await page.getByText("Atualizar status").waitFor({ timeout: 5000 });
    await page.getByRole("button", { name: "Em andamento" }).click();
    await expect(page.getByText("Em andamento").first()).toBeVisible({ timeout: 6000 });
  });

  test("muda status para Resolvido", async ({ page }) => {
    if (!ticketUrl) test.skip();
    await gotoTicketDetail(page, ticketUrl);

    await page.getByText("Atualizar status").waitFor({ timeout: 5000 });
    await page.getByRole("button", { name: "Resolvido" }).click();
    await expect(page.getByText("Resolvido").first()).toBeVisible({ timeout: 6000 });
  });

  test("chamado resolvido aparece no filtro Resolvidos", async ({ page }) => {
    await page.goto("/chamados");
    await page.getByRole("button", { name: "Resolvidos" }).click();
    await expect(page.getByText(TITLE)).toBeVisible({ timeout: 5000 });
  });
});
