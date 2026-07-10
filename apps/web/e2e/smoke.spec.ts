import { expect, test } from "@playwright/test";

const ROUTES = [
  { path: "/", title: /workforces/i },
  { path: "/design-preview", title: /Electric Violet/i },
  { path: "/dashboard", title: /command center/i },
  { path: "/workflows", title: /workflow/i },
  { path: "/runs", title: /agent run/i },
  { path: "/agents", title: /agents/i },
  { path: "/research", title: /Search, extract/i },
  { path: "/mcp", title: /Marketplace-style tools/i },
  { path: "/traces", title: /trace/i },
  { path: "/builder", title: /Configure agents/i },
  { path: "/cloud", title: /Kubernetes/i }
];

test.describe("AgentOps Studio smoke", () => {
  for (const route of ROUTES) {
    test(`${route.path} loads`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveTitle(/AgentOps Studio/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.title);
    });
  }

  test("homepage has Electric Violet theme markers", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Open operations console/i })).toBeVisible();
    await expect(page.getByText(/6 agents online/i)).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "futuristic");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Dashboard" }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/command center/i);
  });

  test("runs page shows run switcher", async ({ page }) => {
    await page.goto("/runs");
    await expect(page.getByRole("navigation", { name: "Run list" })).toBeVisible();
  });
});
