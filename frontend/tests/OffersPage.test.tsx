import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OffersPage from "../src/pages/OffersPage.tsx";
import { adminUser, contactUser, stubFetch, studentUser } from "./helpers/fetchMock.ts";

const offers = [
  {
    id: 2,
    title: "Refonte du portail client",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    status: "SUBMITTED",
  },
  {
    id: 5,
    title: "Tableau de bord de qualité des données",
    companyShortName: "Lumen Data",
    academicYear: "2026-2027",
    period: "OTHER",
    status: "ASSIGNED",
  },
];

describe("OffersPage", () => {
  it("affiche les offres avec leurs libellés français", async () => {
    stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Refonte du portail client")).toBeInTheDocument();
    expect(screen.getByText("Soumise")).toBeInTheDocument();
    expect(screen.getByText("Attribuée")).toBeInTheDocument();
    expect(screen.getAllByText("Autre")).toHaveLength(2);
    expect(screen.getByText("2 offres")).toBeInTheDocument();
    expect(screen.getByText("Les offres que vous avez déposées.")).toBeInTheDocument();
  });

  it("adapte la description au profil", async () => {
    stubFetch({ "/api/offers": () => Response.json([]) });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    expect(screen.getByText("Les offres publiées.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    unmount();

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(screen.getByText("Toutes les offres, tous statuts confondus.")).toBeInTheDocument();
  });

  it("permet à un étudiant d'envoyer sa candidature avec un message facultatif", async () => {
    const application = {
      id: 8,
      offerId: 2,
      studentId: studentUser.id,
      message: "Ce sujet m'intéresse.",
      status: "SUBMITTED",
      appliedAt: "2026-11-10 10:00:00",
    };
    const fetchMock = stubFetch({
      "/api/offers": () => Response.json([offers[0]]),
      "/api/applications": () => Response.json(application, { status: 201 }),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Candidater" }));
    fireEvent.change(screen.getByLabelText("Message (facultatif)"), {
      target: { value: "  Ce sujet m'intéresse.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Candidature envoyée");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/applications",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "jeton", "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: 2, message: "Ce sujet m'intéresse." }),
      }),
    );
  });

  it("ne propose pas l'action de candidature aux autres profils", async () => {
    stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    await screen.findByText("Refonte du portail client");
    expect(screen.queryByRole("button", { name: "Candidater" })).not.toBeInTheDocument();
  });

  it("transmet la période sélectionnée à l'API", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");

    fireEvent.change(screen.getByLabelText("Période"), { target: { value: "P1" } });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/offers?period=P1",
        expect.objectContaining({ headers: { Authorization: "jeton" } }),
      ),
    );
  });

  it("recharge toutes les périodes sans paramètre period", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");

    fireEvent.change(screen.getByLabelText("Période"), { target: { value: "P1" } });
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/offers?period=P1",
      expect.anything(),
    ));

    fireEvent.change(screen.getByLabelText("Période"), { target: { value: "ALL" } });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/offers",
        expect.objectContaining({ headers: { Authorization: "jeton" } }),
      ),
    );
  });

  it("affiche un refus d'accès renvoyé par le backend", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 403 }) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 403");
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});
