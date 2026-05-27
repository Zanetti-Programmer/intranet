import { test as setup } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/admin.json");

setup("autenticar como admin", async ({ page }) => {
  await page.goto("/login");
  await page.waitForTimeout(800);
  await page.locator("#email").fill("guilherme@empresa.com");
  await page.locator("#password").fill("Senha@2024");
  // Framer-motion pode re-montar o formulário — aguarda animação terminar
  await page.waitForTimeout(600);
  await page.locator('button[type="submit"]').click({ force: true });
  await page.waitForURL("/", { timeout: 15000 });
  await page.context().storageState({ path: AUTH_FILE });
});
