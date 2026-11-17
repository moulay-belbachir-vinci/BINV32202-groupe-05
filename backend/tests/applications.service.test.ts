import { describe, expect, it, vi } from "vitest";
import type { ApplicationsRepository } from "../src/repositories/applications.repository.ts";
import { createApplicationsService } from "../src/services/applications.service.ts";
import type { User } from "../src/models/user.ts";

const student: User = {
  kind: "STUDENT",
  id: 1,
  firstName: "Lucas",
  lastName: "Dupont",
  email: "lucas.dupont@etu.gesta.test",
  roles: [],
  companies: [],
};

describe("createApplicationsService.apply", () => {
  it("traduit une collision SQLite sur insertion en conflit métier 409", () => {
    const uniqueError = Object.assign(new Error("unique constraint"), {
      code: "SQLITE_CONSTRAINT_UNIQUE",
    });
    const repository = {
      isOfferPublished: vi.fn().mockReturnValue(true),
      findByStudentAndOffer: vi.fn().mockReturnValue(undefined),
      create: vi.fn(() => {
        throw uniqueError;
      }),
    } as unknown as ApplicationsRepository;
    const service = createApplicationsService(repository);

    let thrown: unknown;
    try {
      service.apply(student, 7, null);
    } catch (error) {
      thrown = error;
    }

    expect(repository.findByStudentAndOffer).toHaveBeenCalledWith({ offerId: 7, studentId: 1 });
    expect(repository.create).toHaveBeenCalledWith({ offerId: 7, studentId: 1, message: null });
    expect(thrown).toMatchObject({ status: 409, code: "APPLICATION_EXISTS" });
  });
});
