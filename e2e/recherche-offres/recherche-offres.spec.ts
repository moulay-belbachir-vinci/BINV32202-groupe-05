import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const fixture = {
  studentName: "Lucas Dupont",
  keyword: "API",
  offer: {
    title: "API REST de facturation",
    company: "Orbis",
    academicYear: "2026-2027",
    period: "P2",
    status: "Publiée",
  },
} as const;

/**
 * Les tests utilisent le jeu de démonstration fixe du projet, réinitialisable
 * avec `npm run db:reset` avant le démarrage de l'application.
 * Chaque test ouvre son propre contexte et se connecte à nouveau : ils ne
 * partagent ni session ni état de recherche.
 */
const signInAsLucasAndOpenOffers = async (page: Page): Promise<void> => {
  await page.goto(baseUrl);
  await page
    .getByRole("button", { name: fixture.studentName, exact: true })
    .click();
  await page.getByRole("link", { name: "Offres", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Offres de stage", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Mot-clé du titre")).toBeVisible();
  await expect(page.getByLabel("Période")).toHaveValue("ALL");
};

test("EF30-E2E-01 — trouve une offre publiée par mot-clé", async ({ page }) => {
  await signInAsLucasAndOpenOffers(page);

  await page.getByRole("searchbox", { name: "Mot-clé du titre" }).fill(fixture.keyword);

  await expect(page.getByText("1 offre", { exact: true })).toBeVisible();
  const resultRow = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: fixture.offer.title, exact: true }) });
  await expect(resultRow).toHaveCount(1);
  await expect(resultRow.getByRole("cell").nth(0)).toHaveText(fixture.offer.title);
  await expect(resultRow.getByRole("cell").nth(1)).toHaveText(fixture.offer.company);
  await expect(resultRow.getByRole("cell").nth(2)).toHaveText(fixture.offer.academicYear);
  await expect(resultRow.getByRole("cell").nth(3)).toHaveText(fixture.offer.period);
  await expect(resultRow.getByRole("cell").nth(4)).toHaveText(fixture.offer.status);
  await expect(
    page.getByText("Aucune offre ne correspond à votre recherche.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("EF30-E2E-02 — affiche l’absence de résultat puis restaure le catalogue", async ({
  page,
}) => {
  await signInAsLucasAndOpenOffers(page);

  const search = page.getByRole("searchbox", { name: "Mot-clé du titre" });
  await search.fill("zzzz-aucune-offre-zzzz");

  await expect(
    page.getByText("Aucune offre ne correspond à votre recherche.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);

  await search.fill("");

  await expect(
    page.getByText("Aucune offre ne correspond à votre recherche.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("row").filter({
      has: page.getByRole("cell", { name: fixture.offer.title, exact: true }),
    }),
  ).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
