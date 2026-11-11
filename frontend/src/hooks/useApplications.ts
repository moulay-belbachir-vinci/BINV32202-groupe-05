import { useCallback, useEffect, useState } from "react";
import type { StudentApplication } from "../models/application.ts";
import { getApplications, withdrawApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setApplications(data);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setError(reason instanceof Error ? reason.message : "Erreur inconnue");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [token, onUnauthorized]);

  const withdraw = useCallback(async (applicationId: number): Promise<boolean> => {
    setWithdrawingId(applicationId);
    setWithdrawError(null);

    try {
      await withdrawApplication(token, applicationId);
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, status: "WITHDRAWN" } : application,
        ),
      );
      return true;
    } catch (reason) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setWithdrawError(reason instanceof Error ? reason.message : "Retrait impossible.");
      }
      return false;
    } finally {
      setWithdrawingId(null);
    }
  }, [token, onUnauthorized]);

  return { applications, isLoading, error, withdraw, withdrawError, withdrawingId };
};
