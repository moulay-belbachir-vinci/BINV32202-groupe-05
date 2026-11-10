import { Router } from "express";
import { toApplicationDto, toStudentApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { HttpError } from "../utils/httpError.ts";

interface CreateApplicationInput {
  offerId: number;
  message: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCreateApplication = (body: unknown): CreateApplicationInput => {
  if (!isRecord(body) || !Number.isSafeInteger(body.offerId) || (body.offerId as number) <= 0) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un entier positif");
  }

  if (body.message !== undefined && body.message !== null && typeof body.message !== "string") {
    throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne de caractères");
  }

  const message = typeof body.message === "string" ? body.message.trim() || null : null;
  return { offerId: body.offerId as number, message };
};

const parseApplicationId = (value: string): number => {
  const applicationId = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(applicationId)) {
    throw new HttpError(400, "INVALID_PARAM", "L'identifiant de candidature est invalide");
  }
  return applicationId;
};

export const createApplicationsRouter = (service: ApplicationsService) => {
  const router = Router();

  router.get("/", (req, res) => {
    const applications = service.listForStudent(getCurrentUser(req));
    res.json(applications.map(toStudentApplicationDto));
  });

  router.post("/", (req, res) => {
    const input = parseCreateApplication(req.body);
    const application = service.apply(getCurrentUser(req), input.offerId, input.message);
    res.status(201).json(toApplicationDto(application));
  });

  router.delete("/:applicationId", (req, res) => {
    const applicationId = parseApplicationId(req.params.applicationId);
    service.withdraw(getCurrentUser(req), applicationId);
    res.status(204).end();
  });

  return router;
};
