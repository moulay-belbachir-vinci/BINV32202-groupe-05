import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { studentUser, stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    studentId: studentUser.id,
    offerTitle: "Développeuse React",
    companyShortName: "Orbis",
    academicYear: "2026-2027",
    period: "P2",
    message: "Je suis intéressée.",
    status: "SUBMITTED",
    appliedAt: "2026-10-02 18:10:00",
  },
  {
    id: 2,
    offerId: 2,
    studentId: studentUser.id,
    offerTitle: "Migration cloud",
    companyShortName: "Datavia",
    academicYear: "2026-2027",
    period: "P2",
    message: null,
    status: "SELECTED",
    appliedAt: "2026-09-22 12:00:00",
  },
  {
    id: 3,
    offerId: 3,
    studentId: studentUser.id,
    offerTitle: "Qualité des données",
    companyShortName: "Lumen Data",
    academicYear: "2026-2027",
    period: "P1",
    message: null,
    status: "REJECTED",
    appliedAt: "2026-09-23 17:25:00",
  },
  {
    id: 4,
    offerId: 4,
    studentId: studentUser.id,
    offerTitle: "API de facturation",
    companyShortName: "Orbis",
    academicYear: "2026-2027",
    period: "OTHER",
    message: null,
    status: "WITHDRAWN",
    appliedAt: "2026-09-30 10:30:00",
  },
  {
    id: 5,
    offerId: 5,
    studentId: studentUser.id,
    offerTitle: "Traitement commencé",
    companyShortName: "Orbis",
    academicYear: "2026-2027",
    period: "OTHER",
    message: null,
    status: "IN_PROGRESS",
    appliedAt: "2026-10-05 11:30:00",
  },
];

describe("ApplicationsPage", () => {
  it("affiche les candidatures, leurs offres et les statuts en français", async () => {
    const fetchMock = stubFetch({ "/api/applications": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Développeuse React")).toBeInTheDocument();
    expect(screen.getByText("Migration cloud")).toBeInTheDocument();
    expect(screen.getByText("Je suis intéressée.")).toBeInTheDocument();
    expect(screen.getAllByText("En cours")).toHaveLength(2);
    expect(screen.getByText("Traitement en cours")).toBeInTheDocument();
    expect(screen.getByText("Retenue")).toBeInTheDocument();
    expect(screen.getByText("Non retenue")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
    expect(screen.getByText("5 candidatures")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/applications",
      expect.objectContaining({ headers: { Authorization: "jeton" } }),
    );
  });

  it("indique quand l'étudiant n'a encore aucune candidature", async () => {
    stubFetch({ "/api/applications": () => Response.json([]) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(
      await screen.findByText("Vous n'avez pas encore candidaté à une offre."),
    ).toBeInTheDocument();
  });

  it("permet de retirer une candidature en cours après confirmation", async () => {
    const fetchMock = stubFetch({
      "/api/applications/1": () => new Response(null, { status: 204 }),
      "/api/applications": () => Response.json(applications),
    });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    await screen.findByText("Développeuse React");
    expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(1);
    expect(screen.getByText("Traitement commencé")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmer le retrait" }));

    await waitFor(() => expect(screen.getAllByText("Retirée")).toHaveLength(2));
    expect(screen.queryByRole("button", { name: "Retirer" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/applications/1",
      expect.objectContaining({ method: "DELETE", headers: { Authorization: "jeton" } }),
    );
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/applications": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<ApplicationsPage token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
