import type { Offer } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import ApplyButton from "./ApplyButton.tsx";
import StatusBadge from "./StatusBadge.tsx";

interface OfferTableProps {
  offers: Offer[];
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const OfferTable = ({ offers, user, token, onUnauthorized }: OfferTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Titre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {user.kind === "STUDENT" && <th scope="col">Action</th>}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.title}</td>
            <td>{offer.companyShortName}</td>
            <td>{offer.academicYear}</td>
            <td>{PERIOD_LABELS[offer.period]}</td>
            <td>
              <StatusBadge
                label={OFFER_STATUS_LABELS[offer.status]}
                tone={OFFER_STATUS_TONES[offer.status]}
              />
            </td>
            {user.kind === "STUDENT" && (
              <td>
                <ApplyButton
                  offerId={offer.id}
                  token={token}
                  onUnauthorized={onUnauthorized}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OfferTable;
