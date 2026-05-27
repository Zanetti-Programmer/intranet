import { test, expect } from "@playwright/test";

test.describe("Autenticação", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // sem auth salvo

  test("login com credenciais válidas redireciona para home", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("guilherme@empresa.com");
    await page.locator("#password").fill("Senha@2024");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });

  test("login com senha errada exibe erro", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("guilherme@empresa.com");
    await page.locator("#password").fill("SenhaErrada123");
    await page.locator('button[type="submit"]').click();
    // Toast de erro deve aparecer
    await expect(page.getByText(/incorretos/i)).toBeVisible({ timeout: 5000 });
  });

  test("usuário já logado é redirecionado da tela de login para home", async ({ page }) => {
    // Faz login primeiro
    await page.goto("/login");
    await page.locator("#email").fill("guilherme@empresa.com");
    await page.locator("#password").fill("Senha@2024");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/");

    // Tenta acessar /login novamente
    await page.goto("/login");
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
