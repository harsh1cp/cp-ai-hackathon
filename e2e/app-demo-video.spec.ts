import { test, expect } from "@playwright/test";

const MASTER_EMAIL =
  process.env.PLAYWRIGHT_DEMO_EMAIL ?? "master@demo.local";
const MASTER_PASSWORD =
  process.env.PLAYWRIGHT_DEMO_PASSWORD ?? "demo-master-123";
const CHILD_EMAIL = process.env.PLAYWRIGHT_CHILD_EMAIL ?? "child@demo.local";
const CHILD_PASSWORD =
  process.env.PLAYWRIGHT_CHILD_PASSWORD ?? "demo-child-123";

async function pause(page: import("@playwright/test").Page, ms: number) {
  await page.waitForTimeout(ms);
}

test.describe.configure({ mode: "serial" });

test("automated app walkthrough (saves video under test-results)", async ({
  page,
}) => {
  await test.step("Home — product entry", async () => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /AI Sales Call Analyzer/i }),
    ).toBeVisible();
    await pause(page, 1500);
    await page.mouse.wheel(0, 320);
    await pause(page, 800);
  });

  await test.step("Login — master account", async () => {
    await page.getByRole("link", { name: /Sign in/i }).click();
    await expect(
      page.getByRole("heading", { name: /Sales Call Analyzer/i }),
    ).toBeVisible();
    await page.getByLabel("Email", { exact: true }).fill(MASTER_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(MASTER_PASSWORD);
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await expect(
      page.getByRole("heading", { name: /Main dashboard/i }),
    ).toBeVisible();
    await expect(page.getByText(/Master — all team calls/i)).toBeVisible();
    await pause(page, 1200);
  });

  await test.step("Dashboard — scroll metrics, workflow, upload card", async () => {
    await page.mouse.wheel(0, 450);
    await pause(page, 700);
    await page.mouse.wheel(0, 500);
    await pause(page, 700);
    await page.mouse.wheel(0, 400);
    await pause(page, 700);
  });

  await test.step("Call detail (if any calls exist)", async () => {
    const callLink = page.locator('a[href^="/call/"]').first();
    const count = await callLink.count();
    if (count > 0) {
      await callLink.click();
      await expect(page).toHaveURL(/\/call\/[^/]+$/);
      await pause(page, 1500);
      await page.mouse.wheel(0, 700);
      await pause(page, 900);
      await page.mouse.wheel(0, 700);
      await pause(page, 900);
      await page.getByRole("link", { name: /Back to dashboard/i }).click();
      await expect(
        page.getByRole("heading", { name: /Main dashboard/i }),
      ).toBeVisible();
    }
  });

  await test.step("Management brief", async () => {
    await page.getByRole("link", { name: /^Brief$/i }).click();
    await expect(page).toHaveURL(/\/docs\/management-brief/);
    await pause(page, 1200);
    await page.mouse.wheel(0, 600);
    await pause(page, 800);
    await page.getByRole("link", { name: /Dashboard/i }).first().click();
    await expect(
      page.getByRole("heading", { name: /Main dashboard/i }),
    ).toBeVisible();
  });

  await test.step("Sales chat — playbook + quote tools", async () => {
    await page.getByRole("link", { name: /Sales chat/i }).first().click();
    await expect(
      page.getByRole("heading", { name: /AI sales assistant/i }),
    ).toBeVisible();
    await pause(page, 1200);
    await page.mouse.wheel(0, 500);
    await pause(page, 900);
    await page.mouse.wheel(0, 600);
    await pause(page, 1200);
  });

  await test.step("Rep account — own calls only", async () => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /Main dashboard/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Log out/i }).click();
    await expect(
      page.getByRole("heading", { name: /Sales Call Analyzer/i }),
    ).toBeVisible({ timeout: 15_000 });
    await pause(page, 500);
    await page.getByLabel("Email", { exact: true }).fill(CHILD_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(CHILD_PASSWORD);
    await page.getByRole("button", { name: /^Sign in$/i }).click();
    await expect(
      page.getByRole("heading", { name: /Main dashboard/i }),
    ).toBeVisible();
    await expect(page.getByText(/Rep — own calls only/i)).toBeVisible();
    await pause(page, 1500);
    await page.mouse.wheel(0, 400);
    await pause(page, 1000);
  });
});
