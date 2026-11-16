# Matrice de traçabilité — candidatures (EF-32 / EF-33)

## Référentiel et statut des vérifications

- **EF-32** : l’étudiant candidate à une offre publiée avec un message facultatif et peut retirer sa candidature tant qu’elle n’a pas été traitée.
- **EF-33** : l’étudiant consulte ses candidatures et leur statut : « En cours », « Retenue », « Non retenue » ou « Retirée ».
- La clarification consignée pendant la séance précédente précise que « traitement commencé » bloque le retrait. Le modèle backend distingue donc `SUBMITTED` (en attente, retirable) et `IN_PROGRESS` (traitement commencé, non retirable).

Un cas est marqué **couvert** seulement lorsque les assertions vérifient le résultat métier attendu, pas seulement un code HTTP. **Couvert après renforcement** signifie que le test a été ajouté ou renforcé dans cette séance et que la suite backend a passé.

## EF-32 — candidater, puis retirer

### Cas normaux

| Cas précis | Résultat attendu | Test backend et assertion effective | Couverture |
|---|---|---|---|
| Étudiant connecté candidate à une offre publiée avec un message entouré d’espaces. | `201`; candidature au bon étudiant/offre, message normalisé, statut initial `SUBMITTED`; la candidature apparaît ensuite dans sa liste avec ces mêmes valeurs. | `backend/tests/applications.test.ts` — « crée la candidature… avec un message facultatif » vérifie la réponse **et** relit la liste. | **Couvert après renforcement.** |
| Étudiant omet le message, le donne vide ou ne fournit que des espaces. | `201`; message `null`; statut initial `SUBMITTED`. | `backend/tests/applications.test.ts` — cas paramétrés « message absent/vide/composé d’espaces ». | **Couvert après renforcement.** |
| Étudiant retire sa candidature avant prise en charge (`SUBMITTED`). | `204`; le statut persistant devient `WITHDRAWN` et reste visible dans sa liste. | `backend/tests/applications.test.ts` — retrait puis `GET /applications` avec assertion du statut `WITHDRAWN`. | **Couvert.** |
| L’étudiant candidate de nouveau à la même offre après retrait. | La nouvelle candidature est `201`/`SUBMITTED`; l’ancienne reste `WITHDRAWN`; les deux entrées sont présentes avec des identifiants distincts. | `backend/tests/applications.test.ts` — assertion de la liste après réinscription ; `backend/tests/db/constraints.test.ts` — réinsertion après mise à `WITHDRAWN`. | **Couvert après renforcement** au niveau API et base. |

### Refus et limites

| Cas précis | Résultat attendu | Test backend et assertion effective | Couverture |
|---|---|---|---|
| Candidature active en doublon (même étudiant/offre). | `409 APPLICATION_EXISTS`; aucune deuxième entrée active, l’ancienne conserve son statut. | `backend/tests/applications.test.ts` vérifie le code d’erreur, une seule entrée et le statut antérieur ; `backend/tests/db/constraints.test.ts` vérifie la contrainte UNIQUE. | **Couvert** pour le doublon ordinaire. Le cas concurrent HTTP est signalé plus bas. |
| Candidature sur offre non publiée ou inexistante. | `404 OFFER_NOT_AVAILABLE`; aucune création. | `backend/tests/applications.test.ts` vérifie le statut et le code pour les deux cas. | **Couvert.** |
| Requête sans session, ou candidature demandée par administrateur/contact. | `401` sans session ; `403 FORBIDDEN` pour les autres profils. | `backend/tests/applications.test.ts` vérifie le refus HTTP et le code `FORBIDDEN` pour les profils. | **Couvert** comme contrôle d’accès de l’API, en appui à EF-32. |
| Corps invalide : identifiant absent, texte, nul, négatif, décimal ou hors entier sûr ; message non textuel. | `400 INVALID_BODY`; aucune candidature créée. | `backend/tests/applications.test.ts` — cas paramétrés sur les valeurs invalides, avec vérification du code d’erreur. | **Couvert après renforcement** pour ces limites. |
| Retrait après début de traitement (`IN_PROGRESS`). | `409 APPLICATION_NOT_WITHDRAWABLE`; statut inchangé. | `backend/tests/applications.test.ts` — cas « en cours de traitement », suivi d’une lecture qui confirme `IN_PROGRESS`. | **Couvert.** |
| Retrait après décision (`SELECTED` ou `REJECTED`). | `409 APPLICATION_NOT_WITHDRAWABLE`; le statut retenu/non retenu ne change pas. | `backend/tests/applications.test.ts` — cas paramétrés, puis relecture du statut. | **Couvert.** |
| Retrait d’une candidature déjà `WITHDRAWN`, y compris second retrait après succès. | `409 APPLICATION_NOT_WITHDRAWABLE`; statut reste `WITHDRAWN`. | `backend/tests/applications.test.ts` vérifie ces deux chemins et relit l’état. | **Couvert après renforcement.** |
| Étudiant tente de retirer la candidature d’un autre étudiant. | `404 APPLICATION_NOT_FOUND` sans divulguer la ressource ; l’original reste inchangée. | `backend/tests/applications.test.ts` vérifie la réponse et relit la candidature par son propriétaire. | **Couvert après renforcement** de l’assertion d’absence d’effet. |
| Retrait demandé par un non-étudiant ou sans session. | `403 FORBIDDEN` pour admin/contact ; `401` sans session. | `backend/tests/applications.test.ts` couvre admin, contact et session absente. | **Couvert** comme contrôle d’accès API. |
| Identifiant de retrait mal formé ou hors entier sûr (`1abc`, `abc`, `0`, `-1`, décimal, entier trop grand). | `400 INVALID_PARAM`. | `backend/tests/applications.test.ts` — tests paramétrés et assertion du code. | **Couvert après renforcement.** |
| Identifiant positif valide mais candidature inexistante. | `404 APPLICATION_NOT_FOUND`; aucune autre candidature n’est modifiée. | `backend/tests/applications.test.ts` — vérifie le code et relit une candidature existante non concernée. | **Couvert après renforcement.** |

## EF-33 — consulter les candidatures et leurs statuts

| Cas précis | Résultat attendu | Test backend et assertion effective | Couverture |
|---|---|---|---|
| L’étudiant consulte ses candidatures. | `200`; chaque ligne appartient à l’étudiant connecté et contient les données de l’offre et le statut. | `backend/tests/applications.test.ts` — réponse exacte pour la candidature retenue de Mateusz ; le nouveau test vérifie que chaque ligne retournée appartient au demandeur. | **Couvert.** |
| Chacun des cinq états internes est exposé par l’API. | `SUBMITTED`, `IN_PROGRESS`, `SELECTED`, `REJECTED`, `WITHDRAWN` sont retournés pour les entrées correspondantes. | `backend/tests/applications.test.ts` — test paramétré/agrégé sur les états semés et une candidature créée ; `backend/tests/db/seed.test.ts` vérifie les états semés ; `backend/tests/db/constraints.test.ts` vérifie le statut initial `SUBMITTED`. | **Couvert après renforcement** au niveau API pour les cinq valeurs. |
| Étudiant sans candidature. | `200` avec tableau vide `[]`. | `backend/tests/applications.test.ts` — assertion exacte sur `[]`. | **Couvert.** |
| Non-étudiant ou session absente consulte la liste. | `403 FORBIDDEN` ou `401`. | `backend/tests/applications.test.ts` vérifie le statut et le code `FORBIDDEN` pour admin/contact, et `401` sans session. | **Couvert** comme contrôle d’accès API. |

## Comportements testés hors exigences EF-32/EF-33

Ces cas sont conservés comme contrôles techniques/API ; ils ne sont pas attribués à EF-32 ou EF-33 sans fondement dans leur texte.

| Comportement distinct | Où et ce qui est effectivement vérifié |
|---|---|
| Contraintes de stockage des candidatures | `backend/tests/db/constraints.test.ts` vérifie le statut par défaut, l’unicité active et la réinscription après retrait. Ces tests prouvent les contraintes SQLite, pas tous les parcours HTTP. |
| Cohérence d’une sélection et du stage associé | `backend/tests/db/seed.test.ts` vérifie les données semées de candidature retenue/non retenue et la cohérence offre attribuée-stage ; cela relève de l’invariant de sélection (RG-04), pas du parcours EF-32/EF-33. |
| Validation de corps/paramètres, `401`/`403`, erreurs `404`/`409` | Ces assertions vérifient le contrat et les barrières backend autour des routes. Elles sont listées dans les cas de refus quand elles conditionnent directement le scénario, mais ne sont pas des exigences métier supplémentaires. |
| Libellés français et affordance de retrait dans l’interface | `frontend/tests/ApplicationsPage.test.tsx` vérifie les quatre libellés, les deux états affichés « En cours » et la présence du bouton de retrait uniquement pour l’état retirable. C’est un test frontend mocké, pas une assertion backend ni un test d’intégration. Il n’a pas été exécuté dans cette séance. |

## Anomalies, écarts et limites résiduels — par importance

1. **Important — aucune transition API de `SUBMITTED` vers `IN_PROGRESS` repérée.** Le backend crée une nouvelle candidature en `SUBMITTED`; la seule mise à jour dans `applications.repository.ts` est le retrait vers `WITHDRAWN`. Les cas de refus sur `IN_PROGRESS` sont testés à partir des données de seed, mais aucun endpoint/service actuel ne permet de marquer une candidature réelle comme « traitement commencé ». Le refus de retrait est donc vérifié pour un état préexistant, mais le déclenchement métier de cet état ne l’est pas et paraît absent du backend actuel.
2. **Important — test concurrent HTTP non réalisé.** `backend/tests/applications.service.test.ts` vérifie que l’erreur SQLite `SQLITE_CONSTRAINT_UNIQUE` est transformée en `409 APPLICATION_EXISTS`, et `backend/tests/db/constraints.test.ts` vérifie la contrainte. Aucun test n’envoie simultanément deux requêtes HTTP concurrentes ; le chemin de course complet reste donc partiellement couvert.
3. **À confirmer — formulation EF-32 encore générale.** Le cahier des charges dit « tant qu’elle n’a pas été traitée » sans définir les états. La conversation de la séance précédente précise que `SUBMITTED` est retirable et `IN_PROGRESS` ne l’est pas ; la migration et l’API documentent cette interprétation, mais la phrase de l’exigence n’a pas été précisée dans le cahier des charges.
4. **Hors périmètre immédiat — EF-72 et filtre d’année.** EF-72 exige que la liste des candidatures soit filtrée par défaut sur l’année courante. `GET /applications` et son repository retournent les candidatures de l’étudiant sans filtre d’année ; aucun test backend ne vérifie ce comportement. C’est un écart distinct à traiter, pas à rattacher à EF-33.
5. **Limite de couche — traduction EF-33.** Le backend vérifie les cinq statuts internes, mais ne peut pas prouver les libellés visibles français. Un test frontend dédié existe, mais il utilise des réponses mockées et n’a pas été lancé ici ; aucun test de bout en bout ne relie la réponse réelle de l’API aux libellés affichés.
6. **Mineur — ordre de la liste.** La documentation API promet un tri du plus récent au plus ancien ; les tests backend actuels ne vérifient pas l’ordre sur une liste à plusieurs éléments. Ce comportement est un contrat API documenté, mais n’est pas formulé dans EF-32/EF-33.

## Modifications et exécution de cette séance

- Renforcement de `backend/tests/applications.test.ts` : vérification de la persistance via `GET`, de tous les états internes, de l’absence d’effet après refus, des cas message vide/espaces, des limites numériques, des erreurs exactes et de la réinscription en conservant l’historique.
- Ajout de `backend/tests/applications.service.test.ts` : simulation d’une collision SQLite au moment de l’insertion et vérification de sa conversion en conflit métier `409 APPLICATION_EXISTS`.
- **Exécuté :** `npm run test -w backend` — 11 fichiers, 152 tests réussis ; `npm run lint -w backend` — 0 avertissement/erreur ; `npm run typecheck -w backend` — terminé avec succès.
- **Non exécuté :** frontend tests, build et `npm run check` global. Les libellés frontend et le build global restent donc non revalidés pendant cette séance.
- Aucun code applicatif n’a été modifié ; les changements de code concernent les tests backend uniquement.
