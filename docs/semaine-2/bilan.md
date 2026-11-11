— choix : on a choisi de faire en sorte que les candidature en double ne puisse pas arriver et que ce n'est pas possible de retirer sa candidature quand elle est en train de se faire traiter mais on peut la retirer avant que ce soit le cas
— Résultat : au lieu d'avoir "en cours" comme statut d'un candidature, c'est maintenant divisé en 2 etat "en cours" et "en cours de traitement"
— Modifications : ajout des applications(candidatures) (mapper, repository, service..) pour ajouter les fonctionnalités sur le statut d'une candidature et verification de tout les cas possible
au debut il a mal interpreté dans le code le statut 'IN_PROGRESS' mais il l'a modifié ensuite
— Validation fonctionnelle : pour tester le cas du traitement en cours copilot à rajouter un cas pour bien tester qu'on ne puisse pas la retirer. mais on peut candidater partout (pas deux fois sur la meme offre) et on peut ensuite la retirer. cette liste apparait dans un nouvelle onglets "mes candidatures".
— Qualité : il ajoute les nouvelles route et les verifications comme il le faut mais il n'isole pas 
— Tests et commandes : nouveau test de contrainte et ajout des test fonctionnelle pour les candidatures, il run souvent npm run check pour tout verifier au niveau du typage et pour voir si les test tourne correctement
par exemple il test le cas ou quand un etudiant se fait refuser qu'il puisse repostuler.
