# Marstek Venus Connector

Den här Homey-appen ansluter till ett Marstek Venus-batterisystem antingen via det lokala nätverket eller via Marstek-molntjänsten och hämtar batteristatistik. Den gör det möjligt för dig att övervaka batteriets status, laddningsnivå och annan relevant information direkt från ditt Homey smarta hemsystem. Med hjälp av flöden kan du skicka kommandon till batteriet för att byta läge (endast lokal API). Det finns en autodetekteringsalgoritm som försöker hitta dina Marstek Venus-batterier.

## FUNKTIONER

När en enhet har upptäckts och kommunikationen fungerar kommer enheten att visa olika statistik som:
- Batteriladdningsnivå
- Status (laddar, urladdar, viloläge)
- Effekt kvar (i kilowattimmar)
- Nät-/Off-grid-energi
- Aktuell effektuttag eller intag (Watt)
- Batteriets temperatur
- Totala laddningar och urladdningar (kWh)

Du kan också skicka kommandon till batteriet för att ändra driftläge till 'Manual', 'AI', 'Passive' eller 'Auto'. Dessa kommandon kan överföras via Homey-flöden ('Då...').

## KRAV

Den här appen kräver Homey och ett Marstek Venus-batterisystem.

- Vid användning av **lokal API-drivrutin** måste Homey och batteriet vara anslutna till samma nätverk med den lokala API:n aktiverad (se nedan). Autodetektion av Marstek Venus-batterier stöds på samma lokala nätverk och när IP-området är 192.168.x.y; den söker inom den sista oktetten (y) från 1 till 254.
- Vid användning av **molndrivrutin** behöver du ett aktivt Marstek-moln-/appkonto. Under parkopplingen kommer Homey att be om användarnamn och lösenord för att autentisera med Marstek-molntjänsten.

### PARKOPPLING AV ENHETER (MOLN)

Välj “Marstek Venus (Cloud)” enhet under parkopplingen, logga in med dina Marstek molnuppgifter och välj platsen/enheten du vill lägga till. Uppgifterna lagras säkert i enhetslagret och används endast för att uppdatera batteristatistiken från Marsteks molnändpunkter.

### PARKOPPLING AV ENHETER (LOKAL API)

Den lokala API:n är inaktiverad som standard och måste aktiveras på Marstek Venus-batterisystemet. Detta kan göras på två sätt:
- Använd BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) på din smartphone (eller laptop) nära batteriet. Anslut och använd 'Enable Local API (30000)' knappen i 'System' fliken.
- Kontakta Marsteks support för att låta dem aktivera den lokala API:n åt dig. Detta kan ta några dagar.

*Den lokala API:n måste aktiveras för portnummer 30000 (på varje enhet). För närvarande stöds inga andra portnummer.*

## STEG-FÖR-STEG-INSTRUKTIONER

1. Installera MarstekHomey-appen från Homey App Store.
2. Lägg till ny enhet med hjälp av Marstek Battery Connector
3. Välj typ av anslutning att göra:
- För API: systemet kommer att autodetektera
- För Moln: Ange dina App/Moln-uppgifter och låt den autodetektera
4. Välj/kontrollera alla enheter att lägga till och klicka på fortsätt för att lägga till dem i Homey.
5. Se magin hända när batteristatistiken hämtas och visas i enhetskorten.

Du kan hantera enheter från både API och Moln. Se inställningarna för varje batteri för ytterligare detaljer.

## VERSIONSHISTORIK

- 0.8.10 - Tillämpade korrigeringar på standardfaktorer för hårdvaru-/firmvarukombinationer, baserat på feedback från användargruppen. Sändningsinställningen är nu som standard aktiverad under enhetsupptäckt. Saknade faktorer laddas nu in som standard när appen uppdateras.
- 0.8.9 - Gjorde alla faktorer som tillämpas vid mottagning av API-data konfigurerbara. Inkluderas även standardfaktorer för olika hårdvaru- och firmwareversioner.
- 0.8.8 - UDP-sändning eller sändning av individuella UDP-paket till enskilda batterier är nu konfigurerbart (som standard sändning).
- 0.8.7 - 'ES.GetStatus'-meddelandena använder inte längre UDP-sändning utan riktar sig nu direkt mot enhetens IP-adress, skickar ett förfrågningsmeddelande per enhet.
- 0.8.6 - Felsökning tillagd när meddelandedetaljernas källa inte matchar konfigurerade källor.
- 0.8.5 - Ytterligare felsökningsloggar lagda för att förbättra kompatibiliteten med Marstek Venus, endast för TEST-versionen av denna app.
- 0.8.4 - Avfrågningsintervallet kunde ibland inte fastställas vid uppgradering av Homey-appen från tidigare versioner, lade till en reservintervalvärde.
- 0.8.3 - En bugg borttagen som förhindrade data att bearbetas från den lokala API:n. Debuggflaggan är nu alltid satt för TEST-versioner av appen.
- 0.8.2 - Standardinställningar kan ges under parkoppling av lokala API-enheter. Lade till undvikande av strängar vid molninloggning. Unikt ID för meddelanden begränsat till 16-bits heltal.
- 0.8.1 - **[aktuella LIVESLÄPPT]** Lade till inställningar för att inaktivera avfrågning av data från lokal API, men flöden som skickar batterikommandon är fortfarande möjliga, för att minska kommunikationsproblem när de används tillsammans med CT002/CT003.
- 0.8.0 - Kodstrukturändringar och Github-rensning. Konverterade källan till endast TypeScript.
- 0.7.6 - Molndata upphörde att uppdateras när det initiala svaret från Marsteks molntjänst var långsamt, vilket orsakar ett samtidighetsproblem.
- 0.7.5 - Felaktigt lösenord för Marstek Cloud kunde inte korrigeras utan att först ta bort appen. Tekniska fel på Marstek Cloud-tjänsten fångas inte korrekt.
- 0.7.4 - Temperaturen rapporterad av samma firmware har olika multiplikatorer; Räkning för sund förnuft har lagts till. Marsteks molninloggningsproblem hanterades inte korrekt.
- 0.7.3 - Molninloggning kunde misslyckas för användare med flera enheter. Lade till några översättningar.
- 0.7.2 - Temperaturen för firmware 154 rapporterades felaktigt. Lade till omprövningsmekanism till flödeskorten som ställer in batteriläge. Förbättrad läsbarhet för vissa biblioteks klasser.
- 0.7.1 - Lade till flödeskort för att ändra batteriladdningsläge genom lokal API.
- 0.7.0 - Lade till stöd för en Marstek-molndrivrutin som hämtar batteristatistik med dina Marstek-molnkonto-uppgifter.
- 0.6.3 - Lade till en egenskap som övervakar antalet sekunder sedan sista meddelandet mottogs från batteri. Lade till ikoner för anpassade funktioner.
- 0.6.2 - Firmware-inställningen lagrades som felaktig inställningstyp.
- 0.6.1 - Firmware 154 verkar kommunicera värden med olika multiplikatorer. Appen upptäcker nu firmware och korrigerar detta.
- 0.6.0 - Automatisk återanslutning implementerad; Omprövar portbindning vid varje sändning när lyssnaren inte längre är tillgänglig. Fixade fel på flera enheter som försökte ansluta samtidigt. Några andra smärre buggar på flera ställen åtgärdade.
- 0.5.7 - Korrekt implementerade inställningen av Homey-funktioner som asynkrona anrop.
- 0.5.6 - Scopen verkar inte längre tillgänglig under avslutningshändelsehantering, så loggning av avslutningshändelse är nu hårdkodad till konsolen.
- 0.5.5 - Socket UDP-dgram har inte en förstöringsfunktion, som att kalla på detta orsakade en krasch under avinstallation av App.
- 0.5.4 - Loggstrukturen ändrad för att försöka fånga anslutningsproblem. Löste problem i rensningsfunktion.
- 0.5.3 - Tillämpad buggfix till sändnings-IP-adressupptäckt (orsakade problem när inget adress finns).
- 0.5.2 - Lagt till ett unikt id-inkrement för alla meddelanden till batteri. Omstrukturerat sättet detaljer hämtas från meddelanden till Homey-kapabilitetsvärden. Ytterligare onUninit-hantering för avlägsnande av UDP-lyssnare. Lagt till flera kapabiliteter mottagna från batteri (overifierade).
- 0.5.1 - Hantering av fel vid socketbindning och sändningsflagginställningar för bättre felsökning av framtida portbindningsfel. Tog bort vissa obligatoriska inställningar som gav problem vid upptäckt.
- 0.5.0 - Lagt till ytterligare avläsningar från batteri-API och energisystemet som nu visualiseras i Homey enligt deras riktlinjer för batterier.
(äldre detaljer om historik är utelämnade)

## ANMÄRKNINGAR

- Den här appen använder funktionerna 'API över UDP' som nämns i API-dokumentationen.
- Appen är utvecklad och testad med ett Venus E v2.0-batterisystem (firmware v153, kommunikationsmodul 202409090159). Meddela mig om några andra modeller också fungerar!
- Om enheten inte kan autodetekteras, kontrollera om Marstek Venus-batteriet är påslaget och anslutet till samma nätverk som Homey.
- Stöd för flera Marstek Venus-batterier är implementerat, men eftersom jag bara har ett batteri att testa med är vissa delar outforskade.
- Endast UDP-port 30000 stöds för närvarande på den lokala API:n.
- När du uppgraderar appen kan det vara nödvändigt att först ta bort redan tillagda batterienheter och sedan lägga till dem igen.
- Marsteks moln-API är inte dokumenterat, så saker kan ändras utan förvarning.
- Batterilägeändringar har en automatisk omprövning för maximalt 5 försök med en tidsgräns på 15 sekunder.

## KÄNDA PROBLEM

- Ibland upphör UDP-kommunikationen efter ett tag (utan något undantag, varning).
- Inte alla överförda UDP-paket besvaras av batteriet (det ignorerar dem tyst).
- Verkar inte fungera bra tillsammans med CT002 eller CT003, batteriet verkar sluta kommunicera.
- Molndata tar inte korrekt hänsyn till reservkraftsutinyteport (visar 1 Watt)
- Att använda molnenheter verkar logga ut appen (endast en inloggningstoken tillåts av Marstek)

# FELSÖKNING

Den lokala API:n av batteriet har vissa kommunikationsproblem. Inte alla UDP-meddelanden besvaras och det verkar finnas vissa konflikter när man använder andra metoder för att kommunicera med batteriet samtidigt. Kommunikationen verkar försämras över tid tills den helt upphör. Användare med firmware 154 rapporterar färre problem. Kommunikationen kan kickstartas genom att använda BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 under fliken 'Advances' med hjälp av 'System Reset' funktionen. Observera att strömtillförseln tillfälligt kommer att störas, och efter det kommer kommunikationsstycket att svara igen på alla meddelanden.