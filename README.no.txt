# Marstek Venus Connector

Denne Homey-appen kobles til et Marstek Venus-batterisystem enten via det lokale nettverket eller via Marstek cloud-tjeneste og henter ut batteristatistikk. Den lar deg overvåke batteristatus, ladingsnivå og annen relevant informasjon direkte fra ditt Homey smarthussystem. Ved hjelp av flyter kan du sende kommandoer til batteriet for å endre modus (kun lokal API). Det er en autodeteksjonsalgoritme som prøver å finne dine Marstek Venus-batterier.

## FUNKSJONER

Når en enhet er oppdaget og kommunikasjonen fungerer, vil enheten vise ulike statistikker som:
- Batteriladingsnivå
- Status (lading, utladning, inaktiv)
- Strøm igjen (i kilowatt/timer)
- Nett/Off-nett kraft
- Nåværende strømutgang eller inngang (watt)
- Batteritemperatur
- Totalt for lading og utladning (kWh)

Du kan også sende kommandoer til batteriet for å endre driftsmodusen til 'Manual', 'AI', 'Passive' eller 'Auto'. Disse kommandoene kan sendes ved bruk av Homey-flyter ('Da...').

## KRAV

Denne appen krever Homey og et Marstek Venus-batterisystem.

- Når du bruker **lokal API-driveren** må Homey og batteriet være koblet til det samme nettverket med lokal API aktivert (se nedenfor). Automatisk deteksjon av Marstek Venus-batterier er støttet på det samme lokale nettverket og når IP-rekkevidde er 192.168.x.y; den vil søke innenfor den siste oktetten (y) fra 1 til 254.
- Når du bruker **cloud driveren** trenger du en aktiv Marstek cloud/app-konto. Under paring vil Homey be om brukernavn og passord for å autentisere med Marstek cloud-tjenesten.

### ENHETSPARING (CLOUD)

Velg “Marstek Venus (Cloud)” enheten under paring, logg inn med dine Marstek cloud-opplysninger og velg stedet/enheten du vil legge til. Opplysningene lagres sikkert i enhetslageret og brukes kun for å oppdatere batteristatistikkene fra Marstek cloud-endepunkter.

### ENHETSPARING (LOKAL API)

Den lokale API er deaktivert som standard, dette må aktiveres på Marstek Venus-batterisystemet. Dette kan gjøres på to måter:
- Bruk BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) på din smarttelefon (eller laptop) i nærheten av batteriet. Koble til og bruke 'Enable Local API (30000)' knappen i 'System' fanen.
- Kontakt Marstek-support for å få dem til å aktivere lokal API for deg. Dette kan ta noen dager.

*Den lokale API må være aktivert for port nummer 30000 (på hver enhet). Foreløpig støttes ingen andre portnumre.*

## TRINN FOR TRINN INSTRUKSJONER

1. Installer MarstekHomey-appen fra Homey App Store.
2. Legg til ny enhet ved å bruke Marstek Battery Connector.
3. Velg type tilkobling du vil opprette:
- For API: systemet vil autodetektere
- For Cloud: Skriv inn dine App/Cloud opplysninger og la den autodetektere
4. Velg/sjekk alle enheter du vil legge til og klikk fortsette for å legge dem til Homey.
5. Se magien skje når batteristatistikkene hentes og vises i enhetskortene.

Du kan enheter fra både API og Cloud. Se innstillingene for hvert batteri for mer informasjon.

## VERSJONSHISTORIKK

- 0.8.10 - Påførte korreksjoner til standardfaktorer for maskinvare/firmware-kombinasjoner, basert på tilbakemeldinger fra samfunnet. Broadcast-innstilling er nå standard satt til sann under enhetsoppdagelse. Manglende faktorer settes nå til standard ved oppdatering av appen.
- 0.8.9 - Gjorde alle faktorer som anvendes når man mottar API-data konfigurerbare. Inkluderte også standardfaktorer for ulike maskinvare- og firmwareversjoner.
- 0.8.8 - UDP broadcast eller sending av individuelle UDP-pakker til individuelle batterier er nå konfigurerbare (standard til broadcast).
- 0.8.7 - 'ES.GetStatus'-meldingene bruker ikke lenger UDP broadcast, men målretter nå direkte IP-adressen til enheten ved å sende ut en forespørsel per enhet.
- 0.8.6 - Tilføring av feilsøking når kilde til meldingsdetaljer ikke samsvarer med konfigurerte kilder.
- 0.8.5 - Ytterligere feilloggings oppført for forbedring av Marstek Venus kompatibilitet, kun for TEST-versjon av denne appen.
- 0.8.4 - Avspørringsintervall kunne ikke alltid bestemmes ved oppgradering av Homey-appen fra tidligere versjoner, lagt til en fallback-intervalverdi.
- 0.8.3 - Fjernet feil som forårsaket at ingen data ble behandlet fra lokal API. Feilflagsætning nå alltid satt for TEST-versjoner av appen.
- 0.8.2 - Standardinnstillinger kan gis under paring av lokale API-enheter. Lagt til flukt av strenger under cloud-innlogging. Unik id for meldinger begrenset til 16bits heltall.
- 0.8.1 - **[nåværende LIVE-utgivelse]** Lagt til innstillinger for å deaktivere polling for data fra lokal API, men flyter som sender batterikommandoer er fortsatt mulig, for å lindre kommunikasjonsproblemer når det brukes sammen med CT002/CT003.
- 0.8.0 - Endringer i kodestrukturen og github-opprydding. Konvertert kilde til kun TypeScript.
- 0.7.6 - Cloudd data sluttet å oppdatere når den innledende responsen fra Marstek Cloud-tjenesten var treg, og forårsaket et samtidighetsproblem.
- 0.7.5 - Feil passord for Marstek Cloud kunne ikke rettes uten å fjerne appen først. Tekniske feil på Marstek Cloud-tjenesten blir ikke riktig fanget opp.
- 0.7.4 - Temperatur rapportert av samme firmware har forskjellige multiplikator; sane kalkulasjon lagt til. Marstek Cloud innloggingsproblemer ble ikke håndtert riktig.
- 0.7.3 - Cloud-innlogging kunne feile for brukere med flere enheter. Lagt til noen oversettelser.
- 0.7.2 - Temperatur for firmware 154 ble rapportert feil. Lagt til gjentatt mekanisme til flytkortene som setter batterimodus. Forbedret lesbarhet av noen bibliotekklasser.
- 0.7.1 - Lagt til flytkort for å endre batterilademodus gjennom lokal API.
- 0.7.0 - Lagt til støtte for en Marstek cloud driver som henter batteristatistikk ved hjelp av dine Marstek cloud-kontoopplysninger.
- 0.6.3 - Lagt til en eiendom som overvåker antall sekunder siste melding ble mottatt fra batteriet. Lagt til ikon for tilpassede kapasiteter.
- 0.6.2 - Firmware-innstilling ble lagret som feil innstillingstype.
- 0.6.1 - Firmware 154 synes å kommunisere verdier med forskjellige multiplikatorer. Appen oppdager nå firmwaren og korrigerer dette.
- 0.6.0 - Auto-gjenkobling implementert; prøv portbinding på nytt ved hver kringkasting når lytteren ikke lenger er tilgjengelig. Fikset feil på flere enheter som prøvde å starte tilkobling samtidig. Et par andre mindre feil flere steder rettet opp.
- 0.5.7 - Korrekt implementert innstilling av Homey-kapasiteter som asynkron samtaler.
- 0.5.6 - Omfang ser ikke ut til å være tilgjengelig lenger under håndtering av lukkebegivenheter, så loggføring av lukkebegivenhet er nå hardkodet til konsollen.
- 0.5.5 - Socket UDP dgram har ikke en destroy-funksjon, og å kalle denne medførte kræsj under avinstallasjon av Appen.
- 0.5.4 - Loggstrukturen endret for å prøve å fange opp tilkoblingsproblemer. Løst problem i ryddefunksjon.
- 0.5.3 - Anvendt feilretting til kringkastings IP-adresseoppdagelse (forårsaket problemer når ingen adresse blir funnet).
- 0.5.2 - Lagt til et inkrement unikt id på alle meldinger til batteriet. Omstrukturert måten detaljer hentes fra meldinger til Homey kapasitetsverdier. Ytterligere onUninit-håndtering for fjerning av UDP-lytter. Lagt til flere kapasiteter mottatt fra batteriet (uverifisert).
- 0.5.1 - Håndtering av feil på socket binding og kringkastingsflagginnstillinger for bedre feilsøking av fremtidige portbinding feil. Fjernet noen obligatoriske innstillinger som ga problemer under oppdagelse.
- 0.5.0 - Lagt til ytterligere avlesninger fra batteri API og energisystem som nå visualiseres i Homey som deres retningslinjer for batterier.
(eldre historiedetaljer er utelatt)

## NOTATER

- Denne appen bruker 'API over UDP' funksjoner som nevnt i API-dokumentasjonen.
- Appen er utviklet og testet med en Venus E v2.0-batterisystem (firmware v153, kommunikasjon modul 202409090159). Gi meg beskjed om andre modeller fungerer også!
- Når enheten ikke kan autodetekteres, vennligst sjekk at Marstek Venus-batteriet er slått på og tilkoblet til det samme nettverket som Homey.
- Støtte for flere Marstek Venus-batterier er implementert, men siden jeg kun har ett batteri å teste med, er noe upløyd.
- Kun UDP port 30000 er for tiden støttet på lokal API.
- Ved oppgradering av appen kan det være nødvendig å fjerne allerede la til batterienheter først og deretter legge dem til igjen.
- Marstek Cloud API er utdatert, så ting kan endres uten varsel.
- Endringer i batterimodus har automatisk oppfølging for maksimalt 5 forsøk med 15 sekunders tidsavbrudd.

## KJENTE PROBLEMER

- Noen ganger stopper UDP-kommunikasjon etter en stund (uten noen unntak, advarsel).
- Ikke alle overførte UDP-pakker blir besvart av batteriet (det ignorerer dem stille).
- Ser ikke ut til å fungere godt sammen med CT002 eller CT003, batteriet slutter å kommunisere.
- Cloud data tar ikke hensyn til backup-strømporten korrekt (viser 1 Watt)
- Bruk av Cloud enhet synes å logge ut app (enkel innlogging kun tillatt av Marstek)

# FEILSØKING

Den lokale API-en til batteriet har noen kommunikasjonsproblemer. Ikke alle UDP-meldinger blir besvart, og det synes å være noen konflikter når du bruker andre metoder for å kommunisere med batteriet samtidig. Kommunikasjonen synes å bli dårligere over tid til den stopper helt. Brukere med firmware 154 rapporterer færre problemer. Kommunikasjon kan kickstartes ved å bruke BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 under 'Avanserte'-fanen ved bruk av 'System Reset'-funksjonen. Merk at strømforsyningen vil bli avbrutt for et kort øyeblikk, og etter det vil kommunikasjonsstakken svare igjen på alle meldinger.