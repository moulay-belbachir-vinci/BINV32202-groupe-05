# Bilan — audit des tests des candidatures (EF-32 / EF-33)

L’audit porte sur ce que les assertions existantes prouvent réellement. Aucun défaut applicatif n’est conclu à partir des seuls manques de tests.

| Cas à vérifier | Test existant et assertion utile | Manque confirmé ou constat écarté |
|---|---|---|
| Candidater à une offre non publiée ou inexistante (EF-32) | [`backend/tests/applications.test.ts:164`](../../backend/tests/applications.test.ts#L164), test « refuse une offre non publiée ou inexistante » : vérifie `404`, `OFFER_NOT_AVAILABLE`, puis que la liste de l’étudiant ne contient aucune candidature pour ces offres. | **Écarté** : le refus et l’absence de création sont vérifiés. |
| Retirer une candidature déjà traitée (EF-32) | [`backend/tests/applications.test.ts:293`](../../backend/tests/applications.test.ts#L293), test paramétré « refuse le retrait d'une candidature… » : couvre `IN_PROGRESS`, `SELECTED`, `REJECTED` et `WITHDRAWN`; vérifie `409`, `APPLICATION_NOT_WITHDRAWABLE`, puis relit la candidature pour confirmer que son statut n’a pas changé. | **Écarté** : les statuts traités et l’absence de mutation sont assertionnés. |
| Consulter uniquement ses propres candidatures / tenter de retirer celle d’un autre étudiant (EF-33 / EF-32) | [`backend/tests/applications.test.ts:72`](../../backend/tests/applications.test.ts#L72) vérifie que chaque résultat de la liste a le `studentId` du demandeur. Le test [`applications.test.ts:307`](../../backend/tests/applications.test.ts#L307) vérifie `404 APPLICATION_NOT_FOUND`, puis relit la candidature chez son propriétaire et confirme `IN_PROGRESS`. | **Écarté** : l’isolation de la liste et la non-divulgation au retrait sont vérifiées. |
| Retrait refusé par le serveur alors que l’interface affiche encore le bouton (EF-32) | [`frontend/tests/ApplicationsPage.test.tsx:100`](../../frontend/tests/ApplicationsPage.test.tsx#L100) vérifiait le retrait réussi (`204`), mais aucun test UI ne vérifiait un `409` de retrait. La page affiche l’erreur ([`ApplicationsPage.tsx:48`](../../frontend/src/pages/ApplicationsPage.tsx#L48)) et le hook ne met à jour le statut qu’après succès ([`useApplications.ts:41`](../../frontend/src/hooks/useApplications.ts#L41)). | **Manque confirmé** : test ajouté ci-dessous ; résultat d’exécution indisponible (dépendances manquantes et version Node sous le minimum requis). |
| Ordre des candidatures de la plus récente à la plus ancienne (contrat `GET /applications`) | [`backend/API.md:183`](../../backend/API.md#L183) documente l’ordre; [`applications.repository.ts:52`](../../backend/src/repositories/applications.repository.ts#L52) le réalise. Le test de liste [`applications.test.ts:69`](../../backend/tests/applications.test.ts#L69) vérifie la présence avec `arrayContaining`, pas l’ordre d’une liste à plusieurs entrées. | **Manque confirmé**, de priorité moindre : ajouter une assertion d’ordre sur plusieurs dates et sur l’égalité de date, si ce contrat doit rester garanti. |

## Test ajouté

Dans [`frontend/tests/ApplicationsPage.test.tsx:122`](../../frontend/tests/ApplicationsPage.test.tsx#L122), le test « conserve la candidature et affiche une erreur lorsque le retrait est refusé » simule une réponse `409`, puis vérifie le message d’erreur, l’absence de fausse transition vers « Retirée » et le maintien de la confirmation de retrait. Il cible le manque UI confirmé sans affaiblir les assertions existantes.

## Vérification

- `npm run test -w frontend -- tests/ApplicationsPage.test.tsx` : non exécuté — `vitest: command not found`.
- Diagnostics VS Code sur `frontend/tests/ApplicationsPage.test.tsx` et ce bilan : aucune erreur signalée.
- `npm ci` : échec avec `Exit handler never called!`; l’environnement fournit Node `v22.11.0`, alors que le dépôt requiert `>=22.14.0`.
- Nouvelle tentative de `npm run test -w frontend -- tests/ApplicationsPage.test.tsx` : même échec, `vitest: command not found`.

Le résultat du test ajouté reste donc à examiner après restauration des dépendances sous une version de Node conforme. Aucun défaut applicatif n’a été observé dans cette tentative, car le test n’a pas pu démarrer.
