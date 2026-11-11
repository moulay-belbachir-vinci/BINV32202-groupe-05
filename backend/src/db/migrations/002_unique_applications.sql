-- Un étudiant ne peut candidater qu'une seule fois à une même offre.
CREATE UNIQUE INDEX applications_student_offer_unique
  ON applications (student_id, offer_id);
