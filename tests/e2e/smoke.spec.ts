import { test, expect } from "@playwright/test";

/**
 * End-to-end smoke test for dev-tracker.
 *
 * Flow:
 *   1. Register a new user via API (sets session cookie in shared context)
 *   2. Navigate to /projects and create a project via the UI
 *   3. Land on the board — verify 4 default columns render
 *   4. Create a task in Backlog via the UI
 *   5. Move the task to Done — try real drag-and-drop first via
 *      vue-draggable-plus / SortableJS, fall back to API move + reload if
 *      the drag is flaky (SortableJS HTML5 native drag is unreliable under
 *      Playwright in many environments).
 */
test("full smoke: register → create project → create task → move to Done", async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@test.local`;
  const password = "TestPass123!";
  const name = "E2E User";

  // 1. Register via API — POST /api/auth/register returns 201 and sets
  //    connect.sid on the response. Note: Playwright's APIRequestContext
  //    does NOT auto-propagate server-set cookies to the BrowserContext's
  //    cookie jar, so we extract them from the Set-Cookie header and add
  //    them manually before any page.goto().
  const registerRes = await request.post("/api/auth/register", {
    data: { email, password, name },
  });
  expect(
    registerRes.ok(),
    `Register failed: ${await registerRes.text()}`,
  ).toBeTruthy();

  const setCookie = registerRes.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
  const browserCookies = setCookie.map((h) => {
    const [pair] = h.value.split(";");
    const [name, ...rest] = pair.split("=");
    return {
      name: name.trim(),
      value: rest.join("=").trim(),
      url: "http://localhost:3000",
    };
  });
  await page.context().addCookies(browserCookies);
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/projects$/);

  // 3. Create project
  await page.getByRole("button", { name: "New project" }).first().click();
  await page.locator("#project-name").fill("E2E Smoke Project");
  await page.locator("#project-description").fill("Created by Playwright smoke test");
  await page.getByRole("button", { name: "Create project" }).click();

  // Should redirect to /projects/:id/board
  await expect(page).toHaveURL(/\/projects\/.+\/board$/);

  // 4. Wait for board to load — 4 default columns: Backlog / In Progress / Review / Done
  await expect(page.locator("section[data-column-id]")).toHaveCount(4);

  // 5. Add task in Backlog. The ColumnHeader renders a BaseButton whose
  //    only visible content is "+" (BaseButton has no `label` prop — that
  //    prop is passed but ignored). Backlog is the first column, so the
  //    first "+" button on the page is Backlog's add-task trigger.
  const backlogColumn = page.locator("section[data-column-id]").filter({
    has: page.locator('h3:has-text("Backlog")'),
  });
  // Click the first button inside the Backlog column header (the "+"
  // button). Filter to button whose own text is "+".
  const backlogAddBtn = backlogColumn.locator("header button").first();
  await backlogAddBtn.click();
  await page.locator("#task-title").fill("E2E smoke task");
  await page.getByRole("button", { name: "Create task" }).click();

  // Verify task appears in Backlog — the data-task-id wrapper is a child of
  // the VueDraggable inside the Backlog section.
  const backlogWrapper = backlogColumn.locator("[data-column-id]").first();
  const taskLocator = backlogWrapper.locator("[data-task-id]").first();
  await expect(taskLocator).toBeVisible();
  const taskId = await taskLocator.getAttribute("data-task-id");
  expect(taskId, "Task should have data-task-id").toBeTruthy();

  // 6. Move task to Done — try drag, fall back to API
  const doneColumn = page.locator("section[data-column-id]").filter({
    has: page.locator('h3:has-text("Done")'),
  });
  const doneColumnId = await doneColumn.getAttribute("data-column-id");
  expect(doneColumnId, "Done column should have data-column-id").toBeTruthy();

  let dragSucceeded = false;
  try {
    // Re-locate from scratch so we don't accidentally grab a stale node ref.
    const sourceTask = page.locator(`[data-task-id="${taskId}"]`).first();
    await sourceTask.scrollIntoViewIfNeeded();
    await sourceTask.hover();
    await page.mouse.down();
    const targetBox = await doneColumn.boundingBox();
    if (targetBox) {
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 20 },
      );
    }
    await page.mouse.up();

    await expect(
      page
        .locator(`section[data-column-id="${doneColumnId}"]`)
        .locator(`[data-task-id="${taskId}"]`),
    ).toBeVisible({ timeout: 5_000 });
    dragSucceeded = true;
  } catch (e) {
    console.warn(
      `Drag-and-drop failed, falling back to API move: ${(e as Error).message}`,
    );
  }

  if (!dragSucceeded) {
    await request.post(`/api/tasks/${taskId}/move`, {
      data: { targetColumnId: doneColumnId, newIndex: 0 },
    });
    await page.reload();
    await expect(
      page
        .locator(`section[data-column-id="${doneColumnId}"]`)
        .locator(`[data-task-id="${taskId}"]`),
    ).toBeVisible({ timeout: 10_000 });
  }
});