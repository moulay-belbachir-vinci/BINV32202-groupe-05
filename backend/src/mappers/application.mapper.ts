import type {
  Application,
  ApplicationDto,
  ApplicationDbo,
  StudentApplication,
  StudentApplicationDbo,
  StudentApplicationDto,
} from "../models/application.ts";

export const toApplication = (row: ApplicationDbo): Application => ({
  id: row.id,
  offerId: row.offer_id,
  studentId: row.student_id,
  message: row.message,
  status: row.status,
  appliedAt: row.applied_at,
});

export const toApplicationDto = (application: Application): ApplicationDto => ({
  id: application.id,
  offerId: application.offerId,
  studentId: application.studentId,
  message: application.message,
  status: application.status,
  appliedAt: application.appliedAt,
});

export const toStudentApplication = (row: StudentApplicationDbo): StudentApplication => ({
  ...toApplication(row),
  offerTitle: row.offer_title,
  companyShortName: row.company_short_name,
  academicYear: row.academic_year_label,
  period: row.period_code,
});

export const toStudentApplicationDto = (
  application: StudentApplication,
): StudentApplicationDto => ({
  ...application,
});
