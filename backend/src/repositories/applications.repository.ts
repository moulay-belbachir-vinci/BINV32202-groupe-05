import type { Db } from "../db/database.ts";
import type { ApplicationDbo, StudentApplicationDbo } from "../models/application.ts";

interface ApplicationParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

interface StudentOfferParams {
  offerId: number;
  studentId: number;
}

interface StudentParams {
  studentId: number;
}

interface StudentApplicationParams {
  applicationId: number;
  studentId: number;
}

export const createApplicationsRepository = (db: Db) => {
  const findPublishedOffer = db.prepare<{ offerId: number }, { id: number }>(`
    SELECT id FROM offers WHERE id = @offerId AND status = 'PUBLISHED'
  `);

  const findByStudentAndOffer = db.prepare<StudentOfferParams, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE student_id = @studentId AND offer_id = @offerId
      AND status <> 'WITHDRAWN'
  `);

  const insertApplication = db.prepare<ApplicationParams, ApplicationDbo>(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
    RETURNING id, offer_id, student_id, message, status, applied_at
  `);

  const findAllForStudent = db.prepare<StudentParams, StudentApplicationDbo>(`
    SELECT a.id, a.offer_id, a.student_id, a.message, a.status, a.applied_at,
           o.title AS offer_title, c.short_name AS company_short_name,
           ay.label AS academic_year_label, p.code AS period_code
    FROM applications a
    JOIN offers o ON o.id = a.offer_id
    JOIN companies c ON c.id = o.company_id
    JOIN academic_years ay ON ay.id = o.academic_year_id
    JOIN periods p ON p.id = o.period_id
    WHERE a.student_id = @studentId
    ORDER BY a.applied_at DESC, a.id DESC
  `);

  const findForStudent = db.prepare<StudentApplicationParams, ApplicationDbo>(`
    SELECT id, offer_id, student_id, message, status, applied_at
    FROM applications
    WHERE id = @applicationId AND student_id = @studentId
  `);

  const withdrawForStudent = db.prepare<StudentApplicationParams>(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = @applicationId
      AND student_id = @studentId
      AND status = 'SUBMITTED'
  `);

  return {
    isOfferPublished: (offerId: number): boolean =>
      findPublishedOffer.get({ offerId }) !== undefined,

    findByStudentAndOffer: (params: StudentOfferParams): ApplicationDbo | undefined =>
      findByStudentAndOffer.get(params),

    create: (params: ApplicationParams): ApplicationDbo => insertApplication.get(params)!,

    findAllForStudent: (params: StudentParams): StudentApplicationDbo[] =>
      findAllForStudent.all(params),

    findForStudent: (params: StudentApplicationParams): ApplicationDbo | undefined =>
      findForStudent.get(params),

    withdrawForStudent: (params: StudentApplicationParams): boolean =>
      withdrawForStudent.run(params).changes === 1,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
