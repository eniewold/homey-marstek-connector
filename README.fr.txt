# Connecteur Marstek Venus

Cette application Homey se connecte à un système de batterie Marstek Venus soit via le réseau local, soit via le service cloud de Marstek et récupère les statistiques de la batterie. Elle vous permet de surveiller l'état de la batterie, le niveau de charge et d'autres informations pertinentes directement depuis votre système domotique Homey. En utilisant les flux, vous pouvez envoyer des commandes à la batterie pour changer de mode (API locale uniquement). Un algorithme de détection automatique essaie de trouver vos batteries Marstek Venus.

## CARACTÉRISTIQUES

Lorsqu'un appareil est détecté et que la communication fonctionne, l'appareil affichera diverses statistiques telles que :
- Niveau de charge de la batterie
- Statut (en charge, décharge, inactif)
- Puissance restante (en kilowatts/heure)
- Puissance réseau/hors réseau
- Courant de sortie ou d'entrée (Watt)
- Température de la batterie
- Totaux de charge et de décharge (kWh)

Vous pouvez également envoyer des commandes à la batterie pour changer le mode de fonctionnement en 'Manuel', 'IA', 'Passif' ou 'Automatique'. Ces commandes peuvent être transmises via des flux Homey ('Alors...').

## EXIGENCES

Cette application nécessite Homey et un système de batterie Marstek Venus.

- Lors de l'utilisation du **pilote API local**, le Homey et la batterie doivent être connectés au même réseau avec l'API locale activée (voir ci-dessous). La détection automatique des batteries Marstek Venus est prise en charge sur le même réseau local lorsque la plage IP est 192.168.x.y ; elle recherchera dans le dernier octet (y) de 1 à 254.
- Lors de l'utilisation du **pilote cloud**, vous avez besoin d'un compte Marstek cloud/app actif. Lors de l'appairage, Homey demandera le nom d'utilisateur et le mot de passe pour s'authentifier avec le service cloud de Marstek.

### APPARIEMENT DE L'APPAREIL (CLOUD)

Choisissez l'appareil “Marstek Venus (Cloud)” lors de l'appairage, connectez-vous avec vos identifiants cloud Marstek et sélectionnez le site/appareil que vous souhaitez ajouter. Les identifiants sont stockés en toute sécurité dans le magasin de l'appareil et utilisés uniquement pour actualiser les statistiques de la batterie depuis les points d'extrémité cloud de Marstek.

### APPARIEMENT DE L'APPAREIL (API LOCALE)

L'API locale est désactivée par défaut, elle doit être activée sur le système de batterie Marstek Venus. Cela peut être fait de deux manières :
- Utilisez l'Outil de Test BLE (https://rweijnen.github.io/marstek-venus-monitor/latest/) sur votre smartphone (ou ordinateur portable) près de la batterie. Connectez-vous et utilisez le bouton 'Activer l'API locale (30000)' dans l'onglet 'Système'.
- Contactez le support Marstek pour qu'ils activent l'API locale pour vous. Cela peut prendre quelques jours.

*L'API locale doit être activée pour le numéro de port 30000 (sur chaque appareil). Actuellement, aucun autre numéro de port n'est pris en charge.*

## INSTRUCTIONS PAS À PAS

1. Installez l'application MarstekHomey depuis le Homey App Store.
2. Ajoutez un nouvel appareil en utilisant le Connecteur de Batterie Marstek
3. Sélectionnez le type de connexion à établir :
- Pour l'API : le système détectera automatiquement
- Pour le Cloud : entrez vos identifiants App/Cloud et laissez la détection automatique
4. Sélectionnez/vérifiez tous les appareils à ajouter et cliquez sur continuer pour les ajouter à Homey.
5. Observez la magie opérer alors que les statistiques de la batterie sont récupérées et affichées dans les cartes des appareils.

Vous pouvez avoir des appareils à la fois de l'API et du Cloud. Consultez les paramètres de chaque batterie pour plus de détails.

## HISTORIQUE DES VERSIONS

- 0.8.10 - Corrections appliquées aux facteurs par défaut pour les combinaisons matériel/firmware, basé sur les commentaires de la communauté. Le paramètre de diffusion est maintenant par défaut vrai lors de la découverte de l'appareil. Les facteurs manquants sont désormais définis par défaut lors de la mise à jour de l'application.
- 0.8.9 - Tous les facteurs appliqués lors de la réception des données API sont désormais configurables. Facteurs par défaut également inclus pour différentes versions de matériel et firmware.
- 0.8.8 - La diffusion UDP ou l'envoi de paquets UDP individuels aux batteries individuelles est maintenant configurable (par défaut en diffusion).
- 0.8.7 - Les messages 'ES.GetStatus' n'utilisent plus la diffusion UDP mais ciblent maintenant directement l'adresse IP de l'appareil, envoyant une demande par appareil.
- 0.8.6 - Débogage ajouté quand la source des détails du message ne correspond pas aux sources configurées.
- 0.8.5 - Journaux de débogage supplémentaires ajoutés pour améliorer la compatibilité avec Marstek Venus, uniquement pour la version TEST de cette application.
- 0.8.4 - L'intervalle de sondage ne pouvait pas toujours être déterminé lors de la mise à niveau de l'application Homey à partir des versions précédentes, ajout d'une valeur d'intervalle de secours.
- 0.8.3 - Suppression d'un bug qui empêchait le traitement des données provenant de l'API locale. Le drapeau de débogage est maintenant toujours activé pour les versions TEST de l'application.
- 0.8.2 - Des paramètres par défaut peuvent être donnés lors de l'appairage des appareils API locaux. Échappement des chaînes ajouté lors de la connexion au cloud. Id unique pour les messages limité à un entier sur 16 bits.
- 0.8.1 - **[version LIVE actuelle]** Paramètres ajoutés pour désactiver le sondage pour les données de l'API locale, mais les flux envoyant des commandes à la batterie sont toujours possibles, pour atténuer les problèmes de communication lorsqu'ils sont utilisés avec CT002/CT003.
- 0.8.0 - Changements dans la structure du code et nettoyage de Github. Conversion de la source en TypeScript uniquement.
- 0.7.6 - Les données cloud cessaient de se mettre à jour lorsque la réponse initiale du service cloud de Marstek était lente, causant un problème de concurrence.
- 0.7.5 - Le mauvais mot de passe pour Marstek Cloud ne pouvait pas être corrigé sans supprimer d'abord l'application. Les erreurs techniques sur le service cloud de Marstek ne sont pas correctement interceptées.
- 0.7.4 - La température signalée par le même firmware avait un multiplicateur différent ; calcul de la vraisemblance ajouté. Les problèmes de connexion au cloud Marstek n'étaient pas correctement traités.
- 0.7.3 - La connexion au cloud pouvait échouer pour les utilisateurs avec plusieurs appareils. Quelques traductions ajoutées.
- 0.7.2 - La température pour le firmware 154 était signalée incorrectement. Mécanisme de réessai ajouté aux cartes de flux qui définissent le mode de la batterie. Lisibilité améliorée de certaines classes de bibliothèque.
- 0.7.1 - Carte de flux ajoutée pour changer le mode de charge de la batterie via l'API locale.
- 0.7.0 - Support ajouté pour un pilote cloud Marstek qui récupère les statistiques de la batterie en utilisant vos identifiants de compte cloud Marstek.
- 0.6.3 - Propriété ajoutée qui surveille le nombre de secondes depuis que le dernier message a été reçu de la batterie. Icônes ajoutées pour des capacités personnalisées.
- 0.6.2 - Le réglage du firmware était stocké en tant que type de paramètres incorrects.
- 0.6.1 - Le firmware 154 semble communiquer des valeurs avec des multiplicateurs différents. L'application détecte maintenant le firmware et corrige cela.
- 0.6.0 - Reconnexion automatique implémentée ; nouvelle tentative de liaison de port à chaque diffusion lorsque l'écouteur n'est plus disponible. Correction des erreurs sur plusieurs appareils essayant de démarrer la connexion en même temps. Quelques autres bugs mineurs corrigés à différents endroits.
- 0.5.7 - Implémentation correcte de l'établissement des capacités Homey en tant qu'appels asynchrones.
- 0.5.6 - La portée semble ne plus être disponible lors de la gestion des événements de fermeture, donc l'événement de fermeture est maintenant enregistré en dur dans la console.
- 0.5.5 - Le socket UDP dgram n'a pas de fonction de destruction, l'appel à cela a causé un crash lors de la désinstallation de l'application.
- 0.5.4 - Structure des journaux modifiée pour essayer de résoudre les problèmes de connectivité. Problème résolu dans la fonction de nettoyage.
- 0.5.3 - Correction de bug appliquée à la découverte d'adresse IP en diffusion (causant des problèmes quand aucune adresse n'est trouvée).
- 0.5.2 - Un identifiant unique incrémenté ajouté à tous les messages vers la batterie. Restructuration du moyen dont les détails sont extraits des messages en valeurs de capacité Homey. Gestion supplémentaire lors de la suppression de l'écouteur UDP pendant l'initialisation. Capacités supplémentaires reçues de la batterie (non vérifié).
- 0.5.1 - Gestion des erreurs sur la liaison des sockets et les paramètres de drapeau de diffusion pour un meilleur débogage des futures erreurs de liaison de port. Suppression de certains paramètres obligatoires qui causaient des problèmes lors de la découverte.
- 0.5.0 - Lectures supplémentaires à partir de l'API batterie et système énergie ajoutées, maintenant visualisées dans Homey conformément à leurs directives pour les batteries.
(détails de l'historique plus anciens omis)

## NOTES

- Cette application utilise les fonctionnalités 'API sur UDP' mentionnées dans la documentation API.
- L'application est développée et testée avec un système de batterie Venus E v2.0 (firmware v153, module de communication 202409090159). Faites-moi savoir si d'autres modèles fonctionnent aussi !
- Lorsque l'appareil ne peut pas être détecté automatiquement, veuillez vérifier si la batterie Marstek Venus est allumée et connectée au même réseau que Homey.
- Le support pour plusieurs batteries Marstek Venus est implémenté, mais comme je n'ai qu'une seule batterie pour les tests, certaines zones restent à explorer.
- Seul le port UDP 30000 est actuellement pris en charge sur l'API locale.
- Lors de la mise à jour de l'application, il peut être nécessaire de supprimer d'abord les appareils de batterie déjà ajoutés, puis de les ajouter à nouveau.
- L'API Cloud de Marstek n'est pas documentée, donc les choses peuvent changer sans préavis.
- Les changements de mode de batterie ont une tentative automatique de réessayage pour un maximum de 5 tentatives avec un délai d'attente de 15 secondes.

## PROBLÈMES CONNUS

- Parfois, la communication UDP s'arrête après un moment (sans aucune exception, avertissement).
- Tous les paquets UDP transmis ne sont pas répondus par la batterie (elle les ignore silencieusement).
- Ne semble pas bien fonctionner en conjonction avec CT002 ou CT003, la batterie semble arrêter de communiquer.
- Les données cloud ne prennent pas correctement en compte le port d'alimentation de secours (affichant 1 watt)
- L'utilisation de l'appareil Cloud semble déconnecter l'application (seul un jeton de connexion est autorisé par Marstek)

# DÉPANNAGE

L'API locale de la batterie a quelques problèmes de communication. Tous les messages UDP ne sont pas répondus et il semble y avoir des conflits lorsque vous utilisez d'autres méthodes pour communiquer avec la batterie en même temps. La communication semble se détériorer au fil du temps jusqu'à ce qu'elle s'arrête complètement. Les utilisateurs possédant le firmware 154 signalent moins de problèmes. La communication peut être relancée en utilisant l'Outil de Test BLE (https://rweijnen.github.io/marstek-venus-monitor/latest/) version 2.0 sous l'onglet 'Avancé' en utilisant la fonction 'Reset Système'. Notez que la livraison d'énergie sera interrompue brièvement, et après cela, la pile de communication répondra de nouveau à tous les messages.