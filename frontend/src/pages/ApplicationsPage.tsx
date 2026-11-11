import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import StatusBadge from "../components/StatusBadge.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import { useState } from "react";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  PERIOD_LABELS,
} from "../utils/labels.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const formatAppliedAt = (value: string): string => {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr-BE", { dateStyle: "medium" }).format(date);
};

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, withdraw, withdrawError, withdrawingId } =
    useApplications(token, onUnauthorized);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (error) return <ErrorState message={error} />;
  if (isLoading) return <LoadingState />;
  if (applications.length === 0) {
    return (
      <section>
        <h1>Mes candidatures</h1>
        <EmptyState message="Vous n'avez pas encore candidaté à une offre." />
      </section>
    );
  }

  return (
    <section>
      <h1>Mes candidatures</h1>
      <p>Suivez l'état de vos candidatures aux offres de stage.</p>
      <p className="result-count">
        {applications.length} candidature{applications.length > 1 ? "s" : ""}
      </p>
      {withdrawError && <ErrorState message={withdrawError} />}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Offre</th>
              <th scope="col">Entreprise</th>
              <th scope="col">Année</th>
              <th scope="col">Période</th>
              <th scope="col">Message</th>
              <th scope="col">Statut</th>
              <th scope="col">Date de candidature</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.offerTitle}</td>
                <td>{application.companyShortName}</td>
                <td>{application.academicYear}</td>
                <td>{PERIOD_LABELS[application.period]}</td>
                <td>{application.message ?? "—"}</td>
                <td>
                  <StatusBadge
                    label={APPLICATION_STATUS_LABELS[application.status]}
                    tone={APPLICATION_STATUS_TONES[application.status]}
                  />
                </td>
                <td>
                  <time dateTime={application.appliedAt.replace(" ", "T")}>
                    {formatAppliedAt(application.appliedAt)}
                  </time>
                </td>
                <td>
                  {application.status === "SUBMITTED" && (
                    confirmingId === application.id ? (
                      <div className="application-actions">
                        <span>Retirer cette candidature ?</span>
                        <button
                          className="button button-primary"
                          type="button"
                          disabled={withdrawingId === application.id}
                          onClick={async () => {
                            const withdrawn = await withdraw(application.id);
                            if (withdrawn) setConfirmingId(null);
                          }}
                        >
                          {withdrawingId === application.id ? "Retrait…" : "Confirmer le retrait"}
                        </button>
                        <button
                          className="button button-secondary"
                          type="button"
                          disabled={withdrawingId === application.id}
                          onClick={() => setConfirmingId(null)}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => setConfirmingId(application.id)}
                      >
                        Retirer
                      </button>
                    )
                  )}
                  {application.status === "IN_PROGRESS" && (
                    <span className="application-processing">Traitement en cours</span>
                  )}
                  {application.status !== "SUBMITTED" && application.status !== "IN_PROGRESS" && (
                    <span aria-label="Aucune action">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ApplicationsPage;
