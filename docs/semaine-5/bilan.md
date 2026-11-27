# Bilan — recherche E2E des offres (EF-30)

## Scénarios

Les scénarios sont décrits dans [e2e/recherche-offres/scenarios.md](../../e2e/recherche-offres/scenarios.md).
Les deux cas ont été retenus car ils couvrent des comportements complémentaires du catalogue étudiant :

- **EF30-E2E-01 — cas nominal :** une recherche avec le mot-clé `API` doit ramener une seule offre publiée. Ce cas vérifie le compteur et les informations métier de la ligne (titre, entreprise, année, période et statut).
- **EF30-E2E-02 — cas limite et récupération :** un mot-clé sans correspondance doit afficher l’état vide, puis l’effacement de la recherche doit restaurer le catalogue. Ce cas vérifie à la fois l’absence de résultat et le retour à l’état initial.

Ensemble, ils couvrent une recherche réussie et la transition aller-retour avec zéro résultat, sans se limiter à vérifier une suite d’actions.

## Exécution via Playwright MCP

Le scénario **EF30-E2E-01 (scénario 1)** a été exécuté dans l’application locale par l’interface, sans appel direct à l’API. Le scénario est réussi : après connexion comme Lucas Dupont, ouverture de « Offres » et saisie de `API`, le compteur affichait « 1 offre » et la ligne « API REST de facturation » affichait Orbis, 2026-2027, P2 et le statut publiée. Aucun état d’erreur ou d’absence de résultat n’était visible et la console ne signalait pas d’erreur.

Appels MCP observés et contenu utile renvoyé :

- `browser_navigate` (appel JSON-RPC 3) a ouvert `http://localhost:5173/` ; la navigation a abouti à l’application locale.
- `browser_snapshot` (appel JSON-RPC 4) a renvoyé l’état initial de l’interface, avec l’écran de connexion de démonstration et le choix de Lucas Dupont.
- `browser_fill_form` (appel JSON-RPC 9) a saisi `API` dans « Mot-clé du titre » ; le snapshot suivant (appel 10) a renvoyé le compteur « 1 offre » et la ligne Orbis attendue.

La connexion et la navigation vers « Offres » ont été nécessaires, car l’état initial du scénario supposait déjà Lucas connecté sur cette page. Le texte MCP affichait certains accents avec un encodage altéré (`PubliÃ©e`) ; les autres données observées correspondaient aux attentes.

## Playwright Test

Le fichier [e2e/recherche-offres/recherche-offres.spec.ts](../../e2e/recherche-offres/recherche-offres.spec.ts) a été créé. Il reprend les données fixes du jeu de démonstration, ouvre une session distincte par test et réalise les interactions par l’interface avec des sélecteurs accessibles.

Assertions principales :

- **EF30-E2E-01 :** compteur « 1 offre », présence d’une seule ligne correspondante, vérification séparée des cinq valeurs attendues, et absence de message d’absence de résultat ou d’alerte.
- **EF30-E2E-02 :** apparition du message exact sans correspondance, disparition du tableau, absence d’alerte, puis disparition du message et retour du tableau contenant l’offre API après effacement du champ.

La base de démonstration peut être restaurée avec `npm run db:reset` avant le démarrage de l’application pour retrouver les données de référence. Les tests n’écrivent pas dans les données et ne dépendent pas de leur ordre d’exécution.

Résultats des deux exécutions successives après restauration :

- `npx playwright test e2e/recherche-offres/recherche-offres.spec.ts --project=chromium` (exécution 1) : **2 tests réussis**.
- La même commande (exécution 2) : **2 tests réussis**.
- `npm run check` : **réussi**, code de sortie 0; backend **156 tests** et frontend **59 tests** réussis, puis les builds terminés correctement.

## Vérification du défaut temporaire

Pour vérifier que les tests détectent réellement un défaut, j’ai temporairement remplacé
l’argument `search` par une chaîne vide dans l’appel à `getOffers` de
[`frontend/src/hooks/useOffers.ts`](../../frontend/src/hooks/useOffers.ts). Ce défaut
désactivait le filtrage par mot-clé sans changer la configuration ni la connexion.

- Avec le défaut : **2 échecs** dans Chromium. EF30-E2E-01 n’a pas trouvé le compteur
  `1 offre`, et EF30-E2E-02 n’a pas trouvé le message d’absence de résultat.
- Après restauration exacte de `search` : **2 réussites**; les deux exécutions
  successives ci-dessus sont vertes.

Le défaut n’est pas présent dans le diff final. Les conversations Copilot exportées sont
jointes dans [`conversation-1.md`](conversation-1.md) et [`conversation-2.md`](conversation-2.md).

## Comparaison

1. **Playwright MCP dans la conversation avec l’agent** permet une exploration interactive
   de l’application locale : l’agent navigue, clique, saisit des valeurs et observe l’état
   rendu. Par exemple, `browser_fill_form` a saisi `API` dans « Mot-clé du titre » et a
   renvoyé l’état mis à jour; `browser_snapshot` a renvoyé le compteur et la ligne Orbis.
2. **Playwright Test** conserve des scripts versionnés et rejouables, avec des assertions
   explicites, indépendamment d’une conversation ou de la présence de l’agent. Un compte
   rendu MCP décrit une observation ponctuelle mais ne constitue pas une régression
   exécutable.
3. Je préfère **MCP** pour explorer rapidement un parcours, diagnostiquer un état ou
   vérifier visuellement une hypothèse. Je préfère **Playwright Test** pour une exigence
   stable, répétée en CI et vérifiable après chaque modification. Les deux approches sont
   donc complémentaires.
