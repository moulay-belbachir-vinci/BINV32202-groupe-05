import type { Offer, PeriodFilter } from "../models/offer.ts";
import { API_URL, readJson } from "../utils/api.ts";
import { isOfferList } from "../utils/guards.ts";

export const getOffers = async (
  token: string,
  period: PeriodFilter = "ALL",
  signal?: AbortSignal,
): Promise<Offer[]> => {
  // « Toutes les périodes » conserve le comportement sans paramètre period.
  const query = period === "ALL" ? "" : `?period=${encodeURIComponent(period)}`;
  const response = await fetch(`${API_URL}/offers${query}`, {
    headers: { Authorization: token },
    signal,
  });
  return readJson(response, isOfferList, "Chargement des offres impossible");
};
