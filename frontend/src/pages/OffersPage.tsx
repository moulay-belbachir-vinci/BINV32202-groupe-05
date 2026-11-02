import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useState } from "react";
import { ALL_PERIODS, PERIOD_CODES, type PeriodFilter } from "../models/offer.ts";
import { PERIOD_LABELS } from "../utils/labels.ts";
import { useOffers } from "../hooks/useOffers.ts";
import type { User } from "../models/user.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  // « Toutes les périodes » est le choix initial et ne restreint pas la liste.
  const [period, setPeriod] = useState<PeriodFilter>(ALL_PERIODS);
  const { offers, isLoading, error } = useOffers(token, onUnauthorized, period);

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable offers={offers} />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <label className="period-filter">
        <span>Période</span>
        <select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as PeriodFilter);
          }}
        >
          <option value={ALL_PERIODS}>Toutes les périodes</option>
          {PERIOD_CODES.map((code) => (
            <option key={code} value={code}>
              {PERIOD_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
      {renderContent()}
    </section>
  );
};

export default OffersPage;
