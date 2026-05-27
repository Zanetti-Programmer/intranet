import { test, expect, type Page } from "@playwright/test";

const POST_TEXT = `Post E2E ${Date.now()} — teste automatizado`;

// Navega para o feed e aguarda os posts carregarem (com reload se necessário)
async function waitForFeed(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("O que está acontecendo?").waitFor({ timeout: 10000 });
  // Aguarda estado final do feed (posts ou estado vazio)
  await page.waitForFunction(
    () =>
      document.querySelector("article.bg-card") !== null ||
      document.body.innerText.includes("Nenhuma publicação"),
    { timeout: 10000 }
  ).catch(() => {});
  // Se chegou no estado vazio (possível timing de auth), recarrega uma vez
  const isEmpty = await page.getByText("Nenhuma publicação ainda").isVisible().catch(() => false);
  if (isEmpty) {
    await page.reload();
    await page.getByPlaceholder("O que está acontecendo?").waitFor({ timeout: 8000 });
    await page.waitForFunction(
      () => document.querySelector("article.bg-card") !== null ||
            document.body.innerText.includes("Nenhuma publicação"),
      { timeout: 8000 }
    ).catch(() => {});
  }
}

// Obtém o card do post com retry (reload se não encontrar)
async function getPostCard(page: Page) {
  const card = page.locator("article.bg-card").filter({ hasText: POST_TEXT }).first();
  try {
    await expect(card).toBeVisible({ timeout: 5000 });
  } catch {
    await page.reload();
    await page.getByPlaceholder("O que está acontecendo?").waitFor({ timeout: 8000 });
    await page.waitForFunction(
      () => document.querySelector(".bg-card") !== null,
      { timeout: 8000 }
    ).catch(() => {});
    await expect(card).toBeVisible({ timeout: 8000 });
  }
  return card;
}

test.describe.serial("Feed — criar e excluir posts", () => {
  test("cria post e aparece no feed", async ({ page }) => {
    await waitForFeed(page);
    await page.getByPlaceholder("O que está acontecendo?").fill(POST_TEXT);
    await page.getByRole("button", { name: "Publicar" }).click();
    // Aguarda o post aparecer como card no feed (não apenas no input do composer)
    await expect(page.locator("article.bg-card").filter({ hasText: POST_TEXT }).first()).toBeVisible({ timeout: 10000 });
  });

  test("post tem botão de Curtir", async ({ page }) => {
    await waitForFeed(page);
    const card = await getPostCard(page);
    await expect(card.getByText("Curtir")).toBeVisible();
  });

  test("clicar em Curtir registra reação", async ({ page }) => {
    await waitForFeed(page);
    const card = await getPostCard(page);
    await card.getByText("Curtir").click();
    // Após curtir o botão muda de cor (text-red-500) — usa first() pois SVG e button têm a classe
    await expect(card.locator(".text-red-500").first()).toBeVisible({ timeout: 5000 });
  });

  test("admin pode excluir o próprio post via menu", async ({ page }) => {
    await waitForFeed(page);
    const card = await getPostCard(page);

    // Abrir menu de 3 pontos
    await card.getByRole("button", { name: "Abrir menu" }).click();

    // Clicar em Excluir no dropdown
    await page.getByRole("button", { name: "Excluir" }).click();

    await expect(page.locator("article.bg-card").filter({ hasText: POST_TEXT })).not.toBeVisible({ timeout: 6000 });
  });
});
