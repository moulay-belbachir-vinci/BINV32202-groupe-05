-- Une candidature nouvellement envoyée attend d'être prise en charge (SUBMITTED).
-- IN_PROGRESS signifie que son traitement a commencé et interdit le retrait.
-- Les candidatures retirées restent dans l'historique et autorisent une nouvelle candidature.
DROP INDEX IF EXISTS applications_student_offer_unique;

CREATE TABLE applications_new (
  id INTEGER PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offers (id),
  student_id INTEGER NOT NULL REFERENCES students (id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'IN_PROGRESS', 'SELECTED', 'REJECTED', 'WITHDRAWN')),
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

INSERT INTO applications_new (id, offer_id, student_id, message, status, applied_at)
SELECT id, offer_id, student_id, message, status, applied_at
FROM applications;

DROP TABLE applications;
ALTER TABLE applications_new RENAME TO applications;

CREATE INDEX applications_offer ON applications (offer_id);
CREATE INDEX applications_student ON applications (student_id);
CREATE UNIQUE INDEX applications_student_offer_unique
  ON applications (student_id, offer_id)
  WHERE status <> 'WITHDRAWN';
