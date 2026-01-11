# Marstek Venus Connector

Denne Homey app forbinder til et Marstek Venus batterisystem enten via det lokale netværk eller gennem Marstek cloud tjenesten og henter batteristatistikker. Den giver dig mulighed for at overvåge batteriets status, opladningsniveau og andre relevante oplysninger direkte fra dit Homey smart hjem system. Ved hjælp af flows kan du sende kommandoer til batteriet for at ændre tilstand (kun lokal API). Der er en auto-detekteringsalgoritme, der forsøger at finde dine Marstek Venus batterier.

## FUNKTIONER

Når en enhed er detekteret og kommunikationen fungerer, vil enheden vise forskellige statistikker som:
- Batteriets opladningsniveau
- Status (oplader, aflader, inaktiv)
- Strøm tilbage (i kilowatt/timer)
- Net/Off-grid strøm
- Aktuel strømforbrug eller tilførsel (Watt)
- Batteriets temperatur
- Opladnings- og afladningstotaler (kWh)

Du kan også sende kommandoer til batteriet for at ændre driftsmodus til 'Manuel', 'AI', 'Passiv' eller 'Auto'. Disse kommandoer kan sendes via Homey flows ('Så...').

## KRAV

Denne app kræver Homey og et Marstek Venus batterisystem.

- Når du bruger **lokal API driver**, skal Homey og batteri være tilsluttet det samme netværk med den lokale API aktiveret (se nedenfor). Auto-detektion af Marstek Venus batterier er understøttet på samme lokale netværk og når IP området er 192.168.x.y; det vil søge inden for den sidste oktet (y) fra 1 til 254.
- Når du bruger **cloud driver** skal du have en aktiv Marstek cloud/app konto. Under parring vil Homey bede om brugernavn og kodeord for at autentificere med Marstek cloud tjenesten.

### ENHEDSPARING (CLOUD)

Vælg enheden “Marstek Venus (Cloud)” under parring, log ind med dine Marstek cloud legitimationsoplysninger og vælg det sted/enhed, du vil tilføje. Legitimationsoplysninger gemmes sikkert i enhedsbutikken og bruges udelukkende til at opdatere batteristatistikker fra Marstek cloud slutpunkter.

### ENHEDSPARING (LOKAL API)

Den lokale API er deaktiveret som standard, dette skal aktiveres på Marstek Venus batterisystemet. Dette kan gøres på to måder:
- Brug BLE Testværktøjet (https://rweijnen.github.io/marstek-venus-monitor/latest/) på din smartphone (eller laptop) nær batteriet. Tilslut og brug knappen 'Enable Local API (30000)' i 'System' fanen.
- Kontakt Marstek support for at få dem til at aktivere den lokale API for dig. Dette kan tage et par dage.

*Den lokale API skal aktiveres for portnummer 30000 (på hver enhed). I øjeblikket understøttes ingen andre portnumre.*

## TRIN-FOR-TRIN INSTRUKTIONER

1. Installer MarstekHomey appen fra Homey App Store.
2. Tilføj ny enhed ved hjælp af Marstek Battery Connector.
3. Vælg type af forbindelse der skal laves:
- For API: systemet vil auto-detektere
- For Cloud: Indtast dine App/Cloud legitimationsoplysninger og lad det auto-detektere
4. Vælg/kontroller alle enheder til at tilføje og klik fortsæt for at tilføje dem til Homey.
5. Se magien ske, når batteristatistikker hentes og vises i enhedskortet/kortene.

Du kan enheder fra både API og Cloud. Se indstillingerne for hvert batteri for yderligere detaljer.

## VERSIONSHISTORIK

- 0.8.10 - Anvendte korrektioner til standardfaktorer for hardware/firmware kombinationer, baseret på feedback fra fællesskabet. Broadcast indstilling nu standard sand under enhedsopdagelse. Manglende faktorer sættes nu til standard ved opdatering af appen.
- 0.8.9 - Gjorde alle faktorer, der anvendes ved modtagelse af API data konfigurerbare. Inkluderede også standardfaktorer for forskellige hardware- og firmwareversioner.
- 0.8.8 - UDP broadcast eller afsendelse af individuelle UDP pakker til individuelle batterier er nu konfigurerbare (standard til broadcast).
- 0.8.7 - 'ES.GetStatus' meddelelser bruger ikke længere UDP broadcast, men henvender sig nu direkte til enhedens IP adresse og sender en anmodning pr. enhed.
- 0.8.6 - Debugging tilføjet, når kildedetaljer for meddelelser ikke matcher konfigureret kilde(r).
- 0.8.5 - Yderligere debugging logs tilføjet for at forbedre Marstek Venus kompatibilitet, kun for TEST versionen af denne app.
- 0.8.4 - Polling interval kunne ikke altid bestemmes ved opgradering af Homey app fra tidligere versioner, tilføjede en fallback intervalværdi.
- 0.8.3 - Fejl fjernet, der gjorde, at ingen data blev behandlet fra lokal API. Debug flag er nu altid indstillet for TEST versioner af appen.
- 0.8.2 - Standardindstillinger kan gives under parring af lokale API enheder. Tilføjede escape af strenge under cloud login. Unikt id for meddelelser begrænset til 16-bits heltal.
- 0.8.1 - **[nuværende LIVE udgivelse]** Tilføjet indstillinger for at deaktivere polling for data fra lokal API, men flows, der sender batterikommandoer, er stadig mulige, for at afhjælpe kommunikationsproblemer, når det bruges sammen med CT002/CT003.
- 0.8.0 - Kodestruktur ændringer og github oprydning. Konverteret kilde til kun TypeScript.
- 0.7.6 - Cloud data stoppede med at opdatere når det indledende svar fra Marstek Cloud service var langsomt, forårsagede et samtidighedsproblem.
- 0.7.5 - Forkert kodeord til Marstek Cloud kunne ikke rettes uden at fjerne appen først. Tekniske fejl på Marstek Cloud service bliver ikke korrekt fanget.
- 0.7.4 - Temperatur rapporteret af samme firmware har forskellige multiplikatorer; fornuftig beregning tilføjet. Marstek Cloud login problemer blev ikke håndteret korrekt.
- 0.7.3 - Cloud login kunne fejle for brugere med flere enheder. Tilføjet nogle oversættelser.
- 0.7.2 - Temperatur for firmware 154 blev rapporteret forkert. Tilføjet retry mekanisme til flowkort, der indstiller batteritilstand. Forbedret læsbarhed af nogle biblioteks klasser.
- 0.7.1 - Tilføjet flowkort for at ændre batteriopladningsmodus via lokal API.
- 0.7.0 - Tilføjet understøttelse for en Marstek Cloud driver, der henter batteristatistikker ved hjælp af dine Marstek cloud kontos legitimationsoplysninger.
- 0.6.3 - Tilføjet en egenskab, der overvåger antallet af sekunder, siden den sidste besked blev modtaget fra batteriet. Tilføjet ikoner for brugerdefinerede kapaciteter.
- 0.6.2 - Firmware indstilling blev gemt som forkert indstillingstype.
- 0.6.1 - Firmware 154 ser ud til at kommunikere værdier med forskellige multiplikatorer. Appen registrerer nu firmwaren og korrigerer dette.
- 0.6.0 - Auto-reconnect implementeret; forsøg på portbinding ved hver broadcast når lytteren ikke længere er tilgængelig. Rettede fejl på flere enheder, der forsøgte at starte tilslutning på samme tid. Flere andre mindre fejl på flere steder rettet.
- 0.5.7 - Korrekt implementeret indstilling af Homey kapaciteter som asynkrone kald.
- 0.5.6 - Scope ser ikke længere ud til at være tilgængelig under afslutningshåndtering, så logning af afslutningshændelse er nu hardcoded til konsollen.
- 0.5.5 - Socket UDP dgram har ikke en destroy funktion, at kalde dette forårsagede et crash under afinstallation af Appen.
- 0.5.4 - Logstruktur ændret for at forsøge at fange forbindelsesproblemer. Løste problem i oprydningsfunktion.
- 0.5.3 - Anvendt fejlrettelse til broadcast IP adresse opdagelse (forårsagede problemer når der ikke blev fundet nogen adresse).
- 0.5.2 - Tilføjet et inkrement unikt id til alle meddelelser til batteriet. Restruktureret den måde detaljer hentes fra meddelelser til Homey kapacitetsværdier. Yderligere onUninit håndtering for fjernelse af UDP lytter. Tilføjet flere kapaciteter modtaget fra batteriet (uverificeret).
- 0.5.1 - Håndtering af fejl på socket binding og broadcast flag indstillinger for bedre debugging af fremtidige port binding fejl. Fjernet nogle obligatoriske indstillinger, der gav problemer under opdagelse.
- 0.5.0 - Tilføjet yderligere aflæsninger fra batteri API og energisystem, der nu visualiseres i Homey som deres retningslinjer for batterier.
(ældre historik detaljer er udeladt)

## NOTER

- Denne app bruger 'API over UDP' funktionerne som nævnt i API dokumentationen.
- Appen er udviklet og testet med et Venus E v2.0 batterisystem (firmware v153, kommunikationsmodul 202409090159). Lad mig vide om andre modeller også virker!
- Når enheden ikke kan auto-detekteres, så check om Marstek Venus batteriet er tændt og tilsluttet samme netværk som Homey.
- Support for flere Marstek Venus batterier er implementeret, men da jeg kun har ét batteri at teste med, er noget ukendt.
- Kun UDP port 30000 understøttes i øjeblikket på lokal API.
- Når appen opgraderes, kan det være nødvendigt at fjerne allerede tilføjede batterieenheder først og derefter tilføje dem igen.
- Marstek Cloud API er udokumenteret, så ting kan ændre sig uden varsel.
- Ændringer i batterimodus har en automatisk retry for maksimalt 5 forsøg med en timeout på 15 sekunder.

## KENDTE PROBLEMER

- Nogle gange stopper UDP-kommunikation efter et stykke tid (uden nogen undtagelse, advarsel).
- Ikke alle sendte UDP-pakker bliver besvaret af batteriet (det ignorerer dem lydløst).
- Synes ikke at fungere godt sammen med CT002 eller CT003, batteriet ser ud til at stoppe kommunikationen.
- Cloud data tager ikke højde for back-up strømport korrekt (viser 1 Watt).
- Brug af Cloud enhed ser ud til at logge appen ud (kun enkelt login token tilladt af Marstek).

# FEJLFINDING

Den lokale API af batteriet har nogle kommunikationsproblemer. Ikke alle UDP-meddelelser bliver besvaret og der ser ud til at være nogle konflikter, når der bruges andre metoder til at kommunikere med batteriet på samme tid. Kommunikationen ser ud til at forringes over tid indtil den stopper fuldstændigt. Brugere med firmware 154 rapporterer færre problemer. Kommunikation kan genstartes ved brug af BLE Test værktøjet (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 under 'Advances' taben ved brug af 'System Reset' funktionen. Bemærk at strømforsyningen vil blive afbrudt et kort øjeblik, og efter det vil kommunikationsstakken svare igen på alle beskeder.