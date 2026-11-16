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

const withdrawAs = (
  kind: "STUDENT" | "ADMIN" | "CONTACT",
  id: number,
  applicationId: string | number,
) =>
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

  it("expose chaque statut interne et ne retourne que les candidatures de l'étudiant", async () => {
    const created = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.INTERNAL_CHATBOT,
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe("SUBMITTED");

    const cases = [
      [STUDENT.LUCAS_DUPONT, "SUBMITTED"],
      [STUDENT.LUCAS_DUPONT, "IN_PROGRESS"],
      [STUDENT.MATEUSZ_KOWALSKI, "SELECTED"],
      [STUDENT.LEA_MERTENS, "REJECTED"],
      [STUDENT.INES_HADDAD, "WITHDRAWN"],
    ] as const;

    for (const [studentId, status] of cases) {
      const response = await listApplicationsAs("STUDENT", studentId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ studentId, status })]),
      );
      expect(
        response.body.every(
          (application: { studentId: number }) => application.studentId === studentId,
        ),
      ).toBe(true);
    }
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

    const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: response.body.id,
          offerId: OFFER.INTERNAL_CHATBOT,
          message: "Le sujet m'intéresse beaucoup.",
          status: "SUBMITTED",
        }),
      ]),
    );
  });

  it.each([
    ["message absent", undefined],
    ["message vide", ""],
    ["message composé d'espaces", "  \t  "],
  ])("accepte une candidature avec un %s", async (_label, message) => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.INTERNAL_CHATBOT,
      message,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBeNull();
    expect(response.body.status).toBe("SUBMITTED");
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
    expect(missing.body.error.code).toBe("OFFER_NOT_AVAILABLE");

    const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(list.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ offerId: OFFER.CLOUD_MIGRATION })]),
    );
    expect(list.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ offerId: 999 })]),
    );
  });

  it("refuse une candidature en double", async () => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, {
      offerId: OFFER.FLEET_APP,
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_EXISTS");

    const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(
      list.body.filter((application: { offerId: number }) => application.offerId === OFFER.FLEET_APP),
    ).toHaveLength(1);
    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: APPLICATION.LUCAS_FLEET_APP,
          offerId: OFFER.FLEET_APP,
          status: "IN_PROGRESS",
        }),
      ]),
    );
  });

  it("autorise une nouvelle candidature après le retrait de la précédente", async () => {
    const response = await applyAs("STUDENT", STUDENT.INES_HADDAD, {
      offerId: OFFER.BILLING_API,
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("SUBMITTED");

    const list = await listApplicationsAs("STUDENT", STUDENT.INES_HADDAD);
    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: APPLICATION.INES_BILLING_API,
          offerId: OFFER.BILLING_API,
          status: "WITHDRAWN",
        }),
        expect.objectContaining({
          id: response.body.id,
          offerId: OFFER.BILLING_API,
          status: "SUBMITTED",
        }),
      ]),
    );
  });

  it.each([
    ["identifiant absent", {}],
    ["identifiant non entier", { offerId: "7" }],
    ["identifiant nul", { offerId: 0 }],
    ["identifiant négatif", { offerId: -1 }],
    ["identifiant décimal", { offerId: 1.5 }],
    ["identifiant hors entier sûr", { offerId: Number.MAX_SAFE_INTEGER + 1 }],
    ["message non textuel", { offerId: OFFER.INTERNAL_CHATBOT, message: 42 }],
  ])("rejette un corps invalide (%s)", async (_label, body) => {
    const response = await applyAs("STUDENT", STUDENT.LUCAS_DUPONT, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");

    const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(list.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ offerId: OFFER.INTERNAL_CHATBOT })]),
    );
  });
});

describe("DELETE /applications/:applicationId", () => {
  it("retire une candidature SUBMITTED appartenant à l'étudiant", async () => {
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

    const repeatedWithdrawal = await withdrawAs(
      "STUDENT",
      STUDENT.LUCAS_DUPONT,
      created.body.id,
    );
    expect(repeatedWithdrawal.status).toBe(409);
    expect(repeatedWithdrawal.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");

    const afterRepeatedWithdrawal = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(afterRepeatedWithdrawal.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, status: "WITHDRAWN" }),
      ]),
    );
  });

  it.each([
    ["en cours de traitement", STUDENT.LUCAS_DUPONT, APPLICATION.LUCAS_FLEET_APP, "IN_PROGRESS"],
    ["retenue", STUDENT.MATEUSZ_KOWALSKI, APPLICATION.MATEUSZ_CLOUD_MIGRATION, "SELECTED"],
    ["non retenue", STUDENT.LEA_MERTENS, APPLICATION.LEA_CLOUD_MIGRATION, "REJECTED"],
    ["déjà retirée", STUDENT.INES_HADDAD, APPLICATION.INES_BILLING_API, "WITHDRAWN"],
  ] as const)(
    "refuse le retrait d'une candidature %s sans changer son statut",
    async (_label, studentId, applicationId, status) => {
      const response = await withdrawAs("STUDENT", studentId, applicationId);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");

      const list = await listApplicationsAs("STUDENT", studentId);
      expect(list.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: applicationId, status })]),
      );
    },
  );

  it("ne révèle pas et ne retire pas la candidature d'un autre étudiant", async () => {
    const response = await withdrawAs(
      "STUDENT",
      STUDENT.INES_HADDAD,
      APPLICATION.LUCAS_FLEET_APP,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("APPLICATION_NOT_FOUND");

    const ownerList = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(ownerList.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: APPLICATION.LUCAS_FLEET_APP, status: "IN_PROGRESS" }),
      ]),
    );
  });

  it.each([
    ["administrateur", "ADMIN" as const, ADMINISTRATOR.ANNE_LECLERCQ],
    ["contact", "CONTACT" as const, CONTACT.MARC_LEJEUNE],
  ])("réserve le retrait aux étudiants et refuse un %s", async (_label, kind, id) => {
    const response = await withdrawAs(kind, id, APPLICATION.LUCAS_FLEET_APP);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("refuse une session absente", async () => {
    const unauthenticated = await request(app).delete(
      `/applications/${APPLICATION.LUCAS_FLEET_APP}`,
    );

    expect(unauthenticated.status).toBe(401);
  });

  it.each(["1abc", "abc", "0", "-1", "1.5", "9007199254740992"])(
    "refuse un identifiant invalide (%s)",
    async (invalidApplicationId) => {
      const invalidId = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, invalidApplicationId);

      expect(invalidId.status).toBe(400);
      expect(invalidId.body.error.code).toBe("INVALID_PARAM");

      const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
      expect(list.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: APPLICATION.LUCAS_FLEET_APP, status: "IN_PROGRESS" }),
        ]),
      );
    },
  );

  it("laisse intacte une candidature lorsque l'identifiant demandé n'existe pas", async () => {
    const response = await withdrawAs("STUDENT", STUDENT.LUCAS_DUPONT, 999999);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("APPLICATION_NOT_FOUND");
    const list = await listApplicationsAs("STUDENT", STUDENT.LUCAS_DUPONT);
    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: APPLICATION.LUCAS_FLEET_APP, status: "IN_PROGRESS" }),
      ]),
    );
  });
});
