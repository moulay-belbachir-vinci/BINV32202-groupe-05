# Scénarios E2E — EF-30 (consultation du catalogue)

## Cadre d’exécution

- Le client MCP est GitHub Copilot dans VS Code, en mode Agent.
- Le serveur MCP Playwright est lancé localement et accessible à Copilot en HTTP sur `localhost`.
- Les scénarios sont exécutés par navigation dans l’application, clics, saisie de texte et observation de l’état de la page; ils ne font pas d’appels directs à l’API.
- Dans ce contexte, HTTP est le moyen de communication avec un serveur local : le serveur Playwright n’est pas distant et ne demande pas d’authentification.

## Portée des scénarios

Ces parcours vérifient le résultat du point de vue d’un étudiant dans l’application : les contrôles utilisés, les offres affichées et les états visibles. Ils ne cherchent pas à tester les détails internes du filtrage (casse, espaces ou découpage des mots).

## EF30-E2E-01 — Trouver une offre publiée par mot-clé (cas nominal)

**État initial**

- L’étudiant Lucas Dupont est connecté.
- Le jeu de démonstration contient l’offre publiée « API REST de facturation » d’Orbis pour 2026-2027, en période P2.
- La page « Offres de stage » est ouverte; le champ « Mot-clé du titre » est vide et le filtre indique « Toutes les périodes ».

**Actions dans l’interface**

1. Saisir `API` dans le champ « Mot-clé du titre ».
2. Consulter la liste mise à jour, sans changer de page.

**Résultat observable attendu**

- Le compteur affiche « 1 offre ».
- Le tableau présente la ligne « API REST de facturation » avec l’entreprise Orbis, l’année 2026-2027, la période P2 et le statut « Publiée ».
- Aucun message d’erreur ou d’absence de résultat n’est visible.

## EF30-E2E-02 — Recherche sans résultat puis retour au catalogue (cas limite)

**État initial**

- L’étudiant Lucas Dupont est connecté.
- Le jeu de démonstration contient les offres publiées de l’année 2026-2027, dont « API REST de facturation ».
- La page « Offres de stage » est ouverte; le champ « Mot-clé du titre » est vide et le filtre indique « Toutes les périodes ».

**Actions dans l’interface**

1. Saisir `zzzz-aucune-offre-zzzz` dans le champ « Mot-clé du titre ».
2. Vérifier l’état affiché, puis effacer le texte du champ.

**Résultat observable attendu**

- Pour la recherche sans correspondance, le tableau disparaît et le message « Aucune offre ne correspond à votre recherche. » apparaît.
- Après avoir effacé le mot-clé, le message disparaît et le catalogue étudiant réapparaît avec ses offres publiées, dont « API REST de facturation ».
