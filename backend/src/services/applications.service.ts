import { toApplication, toStudentApplication } from "../mappers/application.mapper.ts";
import type { Application, StudentApplication } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "SQLITE_CONSTRAINT_UNIQUE";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  listForStudent: (viewer: User): StudentApplication[] => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut consulter ses candidatures");
    }
    return repository.findAllForStudent({ studentId: viewer.id }).map(toStudentApplication);
  },

  withdraw: (student: User, applicationId: number): void => {
    if (!isStudent(student)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut retirer une candidature");
    }

    const params = { applicationId, studentId: student.id };
    const application = repository.findForStudent(params);
    if (application === undefined) {
      throw new HttpError(404, "APPLICATION_NOT_FOUND", "Candidature introuvable");
    }

    if (application.status !== "SUBMITTED" || !repository.withdrawForStudent(params)) {
      throw new HttpError(
        409,
        "APPLICATION_NOT_WITHDRAWABLE",
        "Cette candidature est en cours de traitement ou a déjà été traitée/retirée",
      );
    }
  },

  apply: (student: User, offerId: number, message: string | null): Application => {
    if (!isStudent(student)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut candidater à une offre");
    }

    if (!repository.isOfferPublished(offerId)) {
      throw new HttpError(404, "OFFER_NOT_AVAILABLE", "Cette offre n'est pas disponible");
    }

    if (repository.findByStudentAndOffer({ offerId, studentId: student.id }) !== undefined) {
      throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
    }

    try {
      return toApplication(repository.create({ offerId, studentId: student.id, message }));
    } catch (error) {
      // L'index UNIQUE reste l'autorité en cas de requêtes concurrentes.
      if (isUniqueConstraintError(error)) {
        throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
      }
      throw error;
    }
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
