import { expect, test } from "@playwright/test";

const NAV_ROUTES = [
  { label: "Dashboard", path: "/dashboard", heading: /command center/i },
  { label: "Workflows", path: "/workflows", heading: /Build and replay/i },
  { label: "Agents", path: "/agents", heading: /Specialized agents/i },
  { label: "Builder", path: "/builder", heading: /Configure agents/i },
  { label: "Deploy", path: "/cloud", heading: /Kubernetes/i }
];

test.describe.configure({ mode: "serial" });

test.describe("Full functional prototype audit", () => {
  test("site nav links and console CTA work", async ({ page }) => {
    await page.goto("/");
    for (const route of NAV_ROUTES) {
      await page.getByRole("link", { name: route.label, exact: true }).first().click();
      await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.heading);
    }
    await page.getByRole("link", { name: "Open console" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("homepage primary CTAs navigate correctly", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero-actions").first().locator("a[href='/dashboard']").click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/");
    await page.locator(".hero-actions").first().locator("a[href='/design-preview']").click();
    await expect(page).toHaveURL(/\/design-preview/);

    await page.goto("/");
    await page.locator(".hero-actions").first().locator("a[href='/workflows']").click();
    await expect(page).toHaveURL(/\/workflows/);
  });

  test("accent picker buttons change theme", async ({ page }) => {
    await page.goto("/design-preview");
    await page.getByRole("button", { name: "Electric Violet" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");
    await page.getByRole("button", { name: "Cyber Cyan" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "cyan");
  });

  test("workflows replay launcher creates a run", async ({ page }) => {
    await page.goto("/workflows");
    const firstCard = page.locator(".replay-card").first();
    await firstCard.getByRole("button", { name: "Start replay" }).click();
    await expect(page.locator(".status-note.success")).toContainText(/Run created|Replay started/i, { timeout: 15000 });
    const openLink = page.locator('.status-note a[href*="runId="]').first();
    await expect(openLink).toBeVisible();
    await Promise.all([page.waitForURL(/\/runs\?runId=/), openLink.click()]);
  });

  test("runs page advances execution", async ({ page }) => {
    await page.goto("/workflows");
    await page.locator(".replay-card").first().getByRole("button", { name: "Start replay" }).click();
    await expect(page.locator(".status-note.success")).toContainText(/Run created|Replay started/i, { timeout: 15000 });
    await page.locator('.status-note a[href*="runId="]').first().click();
    await expect(page).toHaveURL(/\/runs\?runId=/);
    await page.getByRole("button", { name: "Advance run" }).click();
    await expect(page.locator(".inline-status.success").first()).toContainText(/advanced|approval|completed/i, { timeout: 15000 });
  });

  test("runs page queues worker job", async ({ page }) => {
    await page.goto("/workflows");
    await page.locator(".replay-card").nth(1).getByRole("button", { name: "Start replay" }).click();
    await expect(page.locator(".status-note.success")).toContainText(/Run created|Replay started/i, { timeout: 15000 });
    await page.locator('.status-note a[href*="runId="]').first().click();
    await expect(page).toHaveURL(/\/runs\?runId=/);
    await page.getByRole("button", { name: "Queue worker job" }).click();
    await expect(page.locator(".inline-status.success")).toContainText(/queued|Worker|approval/i, { timeout: 20000 });
  });

  test("API-backed pages show live data", async ({ page }) => {
    const pages = [
      { path: "/knowledge", marker: /indexed sources|chunks available/i },
      { path: "/benchmarks", marker: /score|benchmark|workflow success/i },
      { path: "/research", marker: /research runs|Search, extract/i },
      { path: "/mcp", marker: /MCP tools|Marketplace-style/i },
      { path: "/traces", marker: /trace events|Langfuse waterfall/i }
    ];
    for (const item of pages) {
      await page.goto(item.path);
      await expect(page.getByText(item.marker).first()).toBeVisible();
    }
  });

  test("dashboard run cards link to runs board", async ({ page }) => {
    await page.goto("/dashboard");
    const runLink = page.locator('a[href^="/runs?runId="]').first();
    await expect(runLink).toBeVisible();
    await runLink.click();
    await expect(page).toHaveURL(/\/runs\?runId=/);
  });
});
