import { useState, type FormEvent } from "react";
import { createApplication } from "../services/applications.service.ts";
import { ApiError } from "../utils/api.ts";

interface ApplyButtonProps {
  offerId: number;
  token: string;
  onUnauthorized: () => void;
}

const ApplyButton = ({ offerId, token, onUnauthorized }: ApplyButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createApplication(token, offerId, message.trim() || undefined);
      setSubmitted(true);
      setIsOpen(false);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) {
        onUnauthorized();
      } else if (reason instanceof ApiError && reason.status === 409) {
        setError("Vous avez déjà candidaté à cette offre.");
      } else {
        setError(reason instanceof Error ? reason.message : "Envoi de la candidature impossible.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) return <span role="status">Candidature envoyée</span>;

  return (
    <div className="apply-action">
      {isOpen ? (
        <form onSubmit={submit}>
          <label className="application-message" htmlFor={`application-message-${offerId}`}>
            Message (facultatif)
            <textarea
              id={`application-message-${offerId}`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />
          </label>
          {error && <p className="application-error" role="alert">{error}</p>}
          <div className="application-actions">
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : "Envoyer ma candidature"}
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setError(null);
                setIsOpen(false);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            className="button button-primary"
            type="button"
            onClick={() => setIsOpen(true)}
          >
            Candidater
          </button>
          {error && <p className="application-error" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
};

export default ApplyButton;
