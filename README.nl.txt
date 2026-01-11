# Marstek Venus Connector

Deze Homey-app maakt verbinding met een Marstek Venus-batterijsysteem via het lokale netwerk of de Marstek-cloudservice en haalt batterijstatistieken op. Hiermee kun je de batterijstatus, het oplaadniveau en andere relevante informatie direct vanuit je Homey smart home-systeem monitoren. Met flows kun je opdrachten naar de batterij sturen om de modus te veranderen (alleen via lokale API). Er is een automatisch detectie-algoritme dat probeert jouw Marstek Venus-batterijen te vinden.

## FUNCTIES

Wanneer een apparaat is gedetecteerd en de communicatie werkt, zal het apparaat verschillende statistieken weergeven zoals:
- Oplaadniveau van de batterij
- Status (opladen, ontladen, inactief)
- Overgebleven vermogen (in kilowatt/uren)
- Netstroom/off-grid stroom
- Huidige vermogensuitvoer of -invoer (Watt)
- Batterijtemperatuur
- Totaal opgeladen en ontladen (kWh)

Je kunt ook opdrachten naar de batterij sturen om de bedrijfsmodus te wijzigen naar 'Handmatig', 'AI', 'Passief' of 'Auto'. Deze opdrachten kunnen worden verzonden via Homey-flows ('Dan...').

## VEREISTEN

Deze app vereist Homey en een Marstek Venus-batterijsysteem.

- Bij gebruik van de **lokale API-driver** moeten Homey en de batterij verbonden zijn met hetzelfde netwerk met de lokale API ingeschakeld (zie hieronder). Automatische detectie van Marstek Venus-batterijen wordt ondersteund op hetzelfde lokale netwerk en wanneer het IP-bereik 192.168.x.y is; het zal in de laatste octet (y) zoeken van 1 tot 254.
- Bij gebruik van de **cloud driver** heb je een actief Marstek cloud/app-account nodig. Tijdens het koppelen zal Homey vragen om de gebruikersnaam en het wachtwoord om te authenticeren met de Marstek-cloudservice.

### APPARAAT KOPPELEN (CLOUD)

Kies het apparaat “Marstek Venus (Cloud)” tijdens het koppelen, log in met je Marstek cloud-inloggegevens en selecteer de site/apparaat die je wilt toevoegen. Inloggegevens worden veilig opgeslagen in de apparaatwinkel en uitsluitend gebruikt om de batterijstatistieken van de Marstek-cloudeindpunten te vernieuwen.

### APPARAAT KOPPELEN (LOKALE API)

De lokale API is standaard uitgeschakeld en moet op het Marstek Venus-batterijsysteem worden ingeschakeld. Dit kan op twee manieren:
- Gebruik de BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) op je smartphone (of laptop) in de buurt van de batterij. Verbind en gebruik de knop 'Enable Local API (30000)' in het tabblad 'System'.
- Neem contact op met de Marstek-support om de Local API voor jou te laten inschakelen. Dit kan een paar dagen duren.

*De lokale API moet zijn ingeschakeld voor poortnummer 30000 (op elk apparaat). Momenteel worden geen andere poortnummers ondersteund.*

## STAP VOOR STAP INSTRUCTIES

1. Installeer de MarstekHomey-app vanuit de Homey App Store.
2. Voeg een nieuw apparaat toe met de Marstek Battery Connector
3. Selecteer het type verbinding dat je wilt maken:
- Voor API: systeem zal automatisch detecteren
- Voor Cloud: Voer je App/Cloud-inloggegevens in en laat het automatisch detecteren
4. Selecteer/controleren welke apparaten je wilt toevoegen en klik op doorgaan om ze toe te voegen aan Homey.
5. Zie de magie gebeuren terwijl de batterijstatistieken worden opgehaald en weergegeven in de apparaatkaart(en).

Je kunt apparaten vanuit zowel API als Cloud aanleggen. Zie de instellingen van elke batterij voor meer details.

## VERSIEGESCHIEDENIS

- 0.8.10 - Correcties toegepast op standaardfactoren voor hardware/firmwarecombinaties, gebaseerd op feedback uit de community. Broadcast-instelling nu standaard waar tijdens apparaatdetectie. Ontbrekende factoren worden nu standaard ingesteld bij het bijwerken van de app.
- 0.8.9 - Alle factoren die worden toegepast bij het ontvangen van API-gegevens zijn nu configureerbaar. Ook standaardfactoren voor verschillende hardware- en firmwareversies toegevoegd.
- 0.8.8 - UDP-broadcast of het verzenden van individuele UDP-pakketten naar individuele batterijen is nu configureerbaar (standaard op broadcast).
- 0.8.7 - De 'ES.GetStatus'-berichten maken niet langer gebruik van UDP-broadcast maar richten zich nu direct op het IP-adres van het apparaat, waarbij één verzoek per apparaat wordt verzonden.
- 0.8.6 - Debugging toegevoegd wanneer de bron van berichtdetails niet overeenkomt met geconfigureerde bron(nen).
- 0.8.5 - Extra debugginglogs toegevoegd voor het verbeteren van de Marstek Venus-compatibiliteit, alleen voor TEST-versie van deze app.
- 0.8.4 - Polling-interval kon niet altijd worden bepaald bij het upgraden van de Homey-app vanaf eerdere versies, er is een fallback-intervalwaarde toegevoegd.
- 0.8.3 - Bug verwijderd waardoor er geen gegevens werden verwerkt vanuit de lokale API. Debugvlag staat nu altijd ingesteld voor TEST-versies van de app.
- 0.8.2 - Standaardinstellingen kunnen worden gegeven tijdens het koppelen van lokale API-apparaten. Escapekarakters toegevoegd tijdens cloudinlog. Uniek id voor berichten beperkt tot 16-bits integer.
- 0.8.1 - **[huidige LIVE-release]** Instellingen toegevoegd om polling voor gegevens van lokale API uit te schakelen, maar flows die batterijopdrachten verzenden zijn nog steeds mogelijk, om communicatieproblemen te verlichten wanneer ze samen met CT002/CT003 worden gebruikt.
- 0.8.0 - Wijzigingen in de code structuur en github-opruiming. Brongecodeerd naar alleen TypeScript.
- 0.7.6 - Cloudgegevens stopten met updaten wanneer de initiële respons van de Marstek Cloud-service traag was, wat een gelijktijdigheidsprobleem veroorzaakte.
- 0.7.5 - Onjuist wachtwoord voor Marstek Cloud kon niet worden gecorrigeerd zonder de app eerst te verwijderen. Technische fouten op de Marstek Cloud-service worden niet correct opgevangen.
- 0.7.4 - Temperatuur gerapporteerd door dezelfde firmware heeft een andere vermenigvuldigingsfactor; health check berekening toegevoegd. Problemen met inloggen op Marstek Cloud werden niet correct afgehandeld.
- 0.7.3 - Cloudinlog kon mislukken voor gebruikers met meerdere apparaten. Enkele vertalingen toegevoegd.
- 0.7.2 - Temperatuur voor firmware 154 werd onjuist gerapporteerd. Retrymechanisme toegevoegd aan de flowkaarten die de batterijweergavemodus instellen. Leesbaarheid van sommige bibliotheekklassen verbeterd.
- 0.7.1 - Flowkaart toegevoegd voor het wijzigen van de batterijopladingsmodus via lokale API.
- 0.7.0 - Ondersteuning toegevoegd voor een Marstek-clouddriver die batterijstatistieken ophaalt met behulp van je Marstek-cloudaccountgegevens.
- 0.6.3 - Een eigenschap toegevoegd die het aantal seconden controleert sinds het laatste bericht van de batterij was ontvangen. Pictogrammen voor aangepaste mogelijkheden toegevoegd.
- 0.6.2 - Firmware-instelling werd opgeslagen als onjuist instellingstype.
- 0.6.1 - Firmware 154 lijkt waarden met een andere vermenigvuldigingsfactor te communiceren. De app detecteert nu de firmware en corrigeert dit.
- 0.6.0 - Automatische herverbinding geïmplementeerd; probeert opnieuw poortbinding bij elke broadcast wanneer de luisteraar niet langer beschikbaar is. Fouten opgelost bij meerdere apparaten die proberen tegelijkertijd verbinding te maken. Enkele andere kleine bugs op verschillende plaatsen gefixed.
- 0.5.7 - Correct geïmplementeerd instellen van Homey-mogelijkheden als asynchrone oproepen.
- 0.5.6 - Omvang lijkt niet langer beschikbaar tijdens verwerking van afsluitingen, dus het loggen van afsluitgebeurtenis is nu hardgecodeerd naar de console.
- 0.5.5 - De socket UDP dgram heeft geen destroy-functie, het aanroepen hiervan veroorzaakte een crash tijdens het verwijderen van de app.
- 0.5.4 - Logstructuur gewijzigd om verbindingsproblemen te proberen op te vangen. Probleem opgelost in schoonmaakfunctie.
- 0.5.3 - Bugfix toegepast op broadcast IP-adres detectie (veroorzaakte problemen wanneer geen adres werd gevonden).
- 0.5.2 - Een incrementeel uniek id toegevoegd aan alle berichten naar de batterij. Herstructurering van de manier waarop details worden opgehaald uit berichten naar Homey-capabiliteitswaarden. Extra onUninit-handling voor verwijdering van UDP-luisteraar. Meer mogelijkheden toegevoegd die van de batterij worden ontvangen (niet geverifieerd).
- 0.5.1 - Afhandeling van fouten bij socketbinding en broadcastvlag-instellingen voor betere debugging van toekomstige poortbinding errors. Enkele verplichte instellingen verwijderd die problemen veroorzaakten tijdens de ontdekking.
- 0.5.0 - Extra uitlezingen toegevoegd van de batterij-API en energie-infrastructuur die nu in Homey wordt weergegeven als hun wijzerlijnen voor batterijen.
(oudere geschiedenisdetails worden weggelaten)

## OPMERKINGEN

- Deze app maakt gebruik van de 'API over UDP'-functies zoals vermeld in de API-documentatie. 
- De app is ontwikkeld en getest met een Venus E v2.0-batterijsysteem (firmware v153, communicatie module 202409090159). Laat me weten of andere modellen ook werken!
- Wanneer het apparaat niet automatisch kan worden gedetecteerd, controleer dan of de Marstek Venus-batterij is ingeschakeld en verbonden met hetzelfde netwerk als Homey.
- Ondersteuning voor meerdere Marstek Venus-batterijen is geïmplementeerd, maar aangezien ik slechts één batterij heb om mee te testen, is dit deels onbekend terrein.
- Alleen UDP-poort 30000 wordt momenteel ondersteund op de lokale API.
- Bij het upgraden van de app kan het nodig zijn om reeds toegevoegde batterijapparaten eerst te verwijderen en ze vervolgens opnieuw toe te voegen. 
- De Marstek Cloud API is ongedocumenteerd, dus dingen kunnen zonder kennisgeving veranderen.
- Wijzigingen in de batterijweergavemodus hebben een automatische herhalingspoging voor maximaal 5 pogingen met een timeout van 15 seconden.

## BEKENDE PROBLEMEN

- Soms stopt de UDP-communicatie na een tijdje (zonder enige uitzondering of waarschuwing).
- Niet alle verzonden UDP-pakketten worden beantwoord door de batterij (ze worden stilletjes genegeerd).
- Werkt niet goed in combinatie met CT002 of CT003, batterij lijkt te stoppen met communiceren. 
- Cloudgegevens houden geen rekening met back-upstroompoort (geeft 1 Watt weer).
- Gebruik van Cloud-apparaat lijkt de app uit te loggen (enkel inlogtoken toegestaan door Marstek).

# PROBLEEMOPLOSSING

De lokale API van de batterij heeft enkele communicatieproblemen. Niet alle UDP-berichten worden beantwoord en er lijken enkele conflicten te zijn bij gebruik van andere methodes om tegelijk met de batterij te communiceren. De communicatie lijkt in de loop van de tijd te verslechteren totdat het volledig stopt. Gebruikers met firmware 154 melden minder problemen. Communicatie kan opnieuw worden gestart met behulp van de BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 onder het tabblad 'Advanced' met de functie 'System Reset'. Let op dat de stroomvoorziening voor een kort moment wordt onderbroken en daarna de communicatiestack weer zal reageren op alle berichten.