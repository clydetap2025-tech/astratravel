// End-to-end scenarios for accounts, sync, the Astra AI limit and the admin panel.
// Run against a TEST Supabase project (never production):
//   npm i -D @playwright/test && npx playwright install chromium
//   E2E_BASE_URL=http://localhost:3000 SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx playwright test -c e2e
// Users are created confirmed through the Auth admin API, so no e-mail is needed, and deleted afterwards.
import { expect, test } from "@playwright/test";

const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const url = process.env.SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
test.skip(!url || !service, "Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY of a test project");

const headers = () => ({ apikey: service, Authorization: "Bearer " + service, "Content-Type": "application/json" });
const created = [];

async function makeUser(role = "user") {
  const email = `e2e-${role}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;
  const password = "E2e-" + Math.random().toString(36).slice(2) + "!9";
  const response = await fetch(url + "/auth/v1/admin/users", {
    method: "POST", headers: headers(), body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { language: "ru" } }),
  });
  const user = await response.json();
  created.push(user.id);
  if (role !== "user") await profile(user.id, { role });
  return { id: user.id, email, password };
}

const profile = (id, changes) => fetch(url + "/rest/v1/profiles?id=eq." + id, { method: "PATCH", headers: headers(), body: JSON.stringify(changes) });

async function signIn(page, user) {
  await page.goto(base + "/#places");
  await page.getByRole("button", { name: /Войти|Аккаунт/ }).first().click();
  await page.getByRole("radio", { name: "Пароль" }).click();
  await page.getByLabel("Почта").fill(user.email);
  await page.getByLabel("Пароль", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Войти" }).last().click();
  await expect(page.getByText("Вы вошли").or(page.getByRole("button", { name: "Аккаунт" }))).toBeVisible();
}

test.afterAll(async () => {
  for (const id of created) await fetch(url + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: headers() });
});

test("sign-up form leads to “check your e-mail”", async ({ page }) => {
  await page.goto(base + "/#places");
  await page.getByRole("button", { name: "Войти" }).first().click();
  await page.getByRole("radio", { name: "Пароль" }).click();
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await page.getByLabel("Почта").fill(`e2e-signup-${Date.now()}@example.com`);
  await page.getByLabel("Пароль", { exact: true }).fill("Signup-Pass-2026");
  await page.getByRole("button", { name: "Создать аккаунт" }).last().click();
  await expect(page.getByRole("heading", { name: "Проверьте почту" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Отправить ещё раз через \d+ с/ })).toBeDisabled();
});

test("favourites follow the account to another browser", async ({ browser }) => {
  const user = await makeUser();
  const first = await browser.newPage();
  await signIn(first, user);
  await first.goto(base + "/#places");
  await first.getByRole("button", { name: /В избранное|Сохранить/ }).first().click();
  const second = await (await browser.newContext()).newPage();
  await signIn(second, user);
  await second.goto(base + "/#saved");
  await expect(second.locator(".place-card").first()).toBeVisible();
});

test("the daily limit: the last allowed message goes through, the next one is refused", async ({ page }) => {
  const user = await makeUser();
  await profile(user.id, { ai_daily_limit: 1 });
  await signIn(page, user);
  await page.goto(base + "/#assistant");
  await expect(page.getByText("Осталось 1 из 1 сообщений сегодня")).toBeVisible();
  await page.getByLabel("Ваш вопрос…").fill("Что посмотреть в Алматы за день?");
  await page.getByRole("button", { name: "Отправить" }).click();
  await expect(page.locator(".bubble-assistant").last()).not.toBeEmpty({ timeout: 30000 });
  await expect(page.getByText(/Лимит на сегодня исчерпан/)).toBeVisible();
  // The server refuses too, whatever the page shows.
  const refused = await page.evaluate(async () => {
    const token = JSON.parse(localStorage.getItem("astratravel.auth") ?? "{}").access_token;
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ message: "Ещё одно" }) });
    return [response.status, (await response.json()).error];
  });
  expect(refused).toEqual([429, "ai_daily_limit"]);
});

test("a regular user cannot open the admin panel", async ({ page }) => {
  const user = await makeUser();
  await signIn(page, user);
  await page.goto(base + "/#admin");
  await expect(page.getByText("Нет доступа")).toBeVisible();
  // The database refuses too: a hidden button is not the protection.
  const overview = await page.evaluate(async ([supabaseUrl, anonKey]) => {
    const session = JSON.parse(localStorage.getItem("astratravel.auth") ?? "{}");
    const response = await fetch(supabaseUrl + "/rest/v1/rpc/admin_overview", {
      method: "POST", headers: { apikey: anonKey, Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" }, body: "{}",
    });
    return [response.status, (await response.json()).message];
  }, [url, process.env.SUPABASE_ANON_KEY ?? ""]);
  expect(overview).toEqual([403, "forbidden"]);
});

test("an admin changes a user's limit and the user sees it", async ({ browser }) => {
  const admin = await makeUser("admin");
  const user = await makeUser();
  const adminPage = await browser.newPage();
  await signIn(adminPage, admin);
  await adminPage.goto(base + "/#admin/users");
  await adminPage.getByPlaceholder("Поиск по почте или имени").fill(user.email);
  adminPage.once("dialog", (dialog) => dialog.accept("7"));
  await adminPage.getByRole("button", { name: "Свой дневной лимит" }).first().click();
  await expect(adminPage.getByText("Лимит изменён: 1")).toBeVisible();
  const userPage = await (await browser.newContext()).newPage();
  await signIn(userPage, user);
  await userPage.goto(base + "/#account");
  await expect(userPage.getByText("ИИ сегодня: осталось 7 из 7")).toBeVisible();
});
