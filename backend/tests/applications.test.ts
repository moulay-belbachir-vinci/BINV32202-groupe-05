import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, APPLICATION, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const applyAs = (kind: "STUDENT" | "ADMIN" | "CONTACT", id: number, body: object) =>
  request(app)
    .post("/applications")
    .set("Authorization", tokenFor(kind, id))
    .send(body);

const listApplicationsAs = (kind: "STUDENT" | "ADMIN" | "CONTACT", id: number) =>
  request(app).get("/applications").set("Authorization", tokenFor(kind, id));

const withdrawAs = (kind: "STUDENT" | "ADMIN" | "CONTACT", id: number, applicationId: string | number) =>
  request(app)
    .delete(`/applications/${applicationId}`)
    .set("Authorization", tokenFor(kind, id));

describe("GET /applications", () => {
  it("retourne les candidatures du seul étudiant connecté, avec les informations de l'offre", async () => {
    const response = await listApplicationsAs("STUDENT", STUDENT.MATEUSZ_KOWALSKI);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        offerId: OFFER.CLOUD_MIGRATION,
        studentId: STUDENT.MATEUSZ_KOWALSKI,
        offerTitle: "Migration d'une application vers le cloud",
        companyShortName: "Datavia",
        academicYear: "2026-2027",
        period: "P2",
        message: "J'ai déjà travaillé avec Docker dans un projet personnel.",
        status: "SELECTED",
      }),
    ]);
  });

  it("retourne une liste vide si l'étudiant n'a encore aucune candidature", async () => {
    const response = await listApplicationsAs("STUDENT", STUDENT.AMINATA_DIALLO);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("refuse une requête sans session", async () => {
    const response = await request(app).get("/applications");

    expect(response.status).toBe(401);
  });

  it.each([
    ["administrateur", "ADMIN" as const, ADMINISTRATOR.ANNE_LECLERCQ],
    ["contact", "CONTACT" as const, CONTACT.MARC_LEJEUNE],
  ])("refuse à un %s l'accès aux candidatures", async (_label, kind, id) => {
    const response = await listApplicationsAs(kind, id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

describe("POST /applications", () => {
  it("crée la candidature d'un étudiant à une offre publiée avec un message facultatif", async () => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.INTERNAL_CHATBOT,
      message: "  Le sujet m'intéresse beaucoup.  ",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.INTERNAL_CHATBOT,
      studentId: STUDENT.LUCAS_DUPONT,
      message: "Le sujet m'intéresse beaucoup.",
      status: "SUBMITTED",
    });
    expect(response.body.id).toEqual(expect.any(Number));
    expect(response.body.appliedAt).toEqual(expect.any(String));
  });

  it("accepte une candidature sans message", async () => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.INTERNAL_CHATBOT,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBeNull();
  });

  it("refuse une requête sans session", async () => {
    const response = await request(app).post("/applications").send({ offerId: OFFER.INTERNAL_CHATBOT });

    expect(response.status).toBe(401);
  });

  it.each([
    ["administrateur", "ADMIN" as const, ADMINISTRATOR.ANNE_LECLERCQ],
    ["contact", "CONTACT" as const, CONTACT.MARC_LEJEUNE],
  ])("refuse à un %s le droit de candidater", async (_label, kind, id) => {
    const response = await applyAs(kind, id, { offerId: OFFER.INTERNAL_CHATBOT });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuse une offre non publiée ou inexistante", async () => {
    const unpublished = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.CLOUD_MIGRATION,
    });
    const missing = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, { offerId: 999 });

    expect(unpublished.status).toBe(404);
    expect(unpublished.body.error.code).toBe("OFFER_NOT_AVAILABLE");
    expect(missing.status).toBe(404);
  });

  it("refuse une candidature en double", async () => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.FLEET_APP,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_EXISTS");
  });

  it("autorise une nouvelle candidature après le retrait de la précédente", async () => {
    const response = await applyAs("STUDENT", STUDENT.INES_HADDAD, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("SUBMITTED");
  });

  it.each([
    ["identifiant absent", {}],
    ["identifiant non entier", { offerId: "7" }],
    ["identifiant non positif", { offerId: 0 }],
    ["message non textuel", { offerId: OFFER.INTERNAL_CHATBOT, message: 42 }],
  ])("rejette un corps invalide (%s)", async (_label, body) => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });
});

describe("DELETE /applications/:applicationId", () => {
  it("retire une candidature en cours appartenant à l'étudiant", async () => {
    const created = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.INTERNAL_CHATBOT,
    });
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, created.body.id);

    expect(created.status).toBe(201);
    expect(created.body.status).toBe("SUBMITTED");
    expect(response.status).toBe(204);
    const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(list.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: created.body.id,
        status: "WITHDRAWN",
      }),
    ]));
  });

  it.each([
    ["en cours de traitement", STUDENT.LUCAS_DUPONT, APPLICATION.LUCAS_FLEET_APP],
    ["retenue", STUDENT.MATEUSZ_KOWALSKI, APPLICATION.MATEUSZ_CLOUD_MIGRATION],
    ["non retenue", STUDENT.LEA_MERTENS, APPLICATION.LEA_CLOUD_MIGRATION],
    ["déjà retirée", STUDENT.INES_HADDAD, APPLICATION.INES_BILLING_API],
  ])("refuse le retrait d'une candidature %s", async (_label, studentId, applicationId) => {
    const response = await withdrawAs("STUDENT", studentId, applicationId);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");
  });

  it("ne révèle pas et ne retire pas la candidature d'un autre étudiant", async () => {
    const response = await withdrawAs(
      "STUDENT",
      STUDENT.INES_HADDAD,
      APPLICATION.LUCAS_FLEET_APP,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("APPLICATION_NOT_FOUND");
  });

  it("réserve le retrait aux étudiants", async () => {
    const response = await withdrawAs(
      "ADMIN",
      ADMINISTRATOR.ANNE_LECLERCQ,
      APPLICATION.LUCAS_FLEET_APP,
    );

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuse une session absente et un identifiant invalide", async () => {
    const unauthenticated = await request(app).delete(
      `/applications/${APPLICATION.LUCAS_FLEET_APP}`,
    );
    const invalidId = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, "1abc");

    expect(unauthenticated.status).toBe(401);
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error.code).toBe("INVALID_PARAM");
  });
});
