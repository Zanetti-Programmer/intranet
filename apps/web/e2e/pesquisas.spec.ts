import { test, expect } from "@playwright/test";

const QUESTION = `Pesquisa E2E ${Date.now()}`;

test.describe.serial("Pesquisas — criar e votar", () => {
  test("admin cria nova enquete", async ({ page }) => {
    await page.goto("/pesquisas");
    await page.getByRole("button", { name: /nova enquete/i }).click();

    const modal = page.locator(".shadow-2xl").first();
    await modal.waitFor({ state: "visible" });

    await page.getByPlaceholder("O que você quer perguntar?").fill(QUESTION);
    await page.getByPlaceholder("Opção 1").fill("Opção A");
    await page.getByPlaceholder("Opção 2").fill("Opção B");

    // Aguarda botão habilitar (validOptions.length >= 2)
    const createBtn = page.getByRole("button", { name: /criar enquete/i });
    await expect(createBtn).not.toBeDisabled({ timeout: 5000 });
    await createBtn.click();

    // Aguarda modal fechar
    await modal.waitFor({ state: "hidden", timeout: 8000 });

    // Enquete deve aparecer na lista "Ativas" ou em "Todas"
    const pollLocator = page.getByText(QUESTION).first();
    try {
      await expect(pollLocator).toBeVisible({ timeout: 6000 });
    } catch {
      // Tenta na aba "Todas" e depois recarrega
      await page.getByText("Todas").click();
      try {
        await expect(pollLocator).toBeVisible({ timeout: 4000 });
      } catch {
        await page.reload();
        await page.getByText("Todas").click();
        await expect(pollLocator).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test("voto na primeira opção (idx=0) é registrado", async ({ page }) => {
    await page.goto("/pesquisas");
    // Garante que a enquete está visível (pode estar em "Ativas")
    const card = page.locator(".bg-card").filter({ hasText: QUESTION }).first();
    await expect(card).toBeVisible({ timeout: 8000 });

    // Clicar no botão da primeira opção
    await card.getByRole("button", { name: "Opção A" }).click();

    // Após votar aparece "já votou"
    await expect(card.getByText(/já votou/i)).toBeVisible({ timeout: 5000 });
  });

  test("botões de opção desaparecem após votar", async ({ page }) => {
    await page.goto("/pesquisas");
    const card = page.locator(".bg-card").filter({ hasText: QUESTION }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
    await expect(card.getByRole("button", { name: "Opção A" })).not.toBeVisible();
    await expect(card.getByRole("button", { name: "Opção B" })).not.toBeVisible();
  });

  test("encerrar enquete muda status para Encerrada", async ({ page }) => {
    await page.goto("/pesquisas");
    const card = page.locator(".bg-card").filter({ hasText: QUESTION }).first();
    await expect(card).toBeVisible({ timeout: 8000 });

    // Botão de cadeado (encerrar enquete)
    await card.getByTitle("Encerrar enquete").click();

    // Aguarda o card sumir da aba "Ativas" (fetchAll retornou status=encerrada)
    await expect(card).not.toBeVisible({ timeout: 8000 });

    // Clica em "Todas" para encontrar a enquete encerrada
    await page.getByText("Todas").click();
    const closedCard = page.locator(".bg-card").filter({ hasText: QUESTION }).first();
    await expect(closedCard.getByText("Encerrada")).toBeVisible({ timeout: 6000 });
  });
});
