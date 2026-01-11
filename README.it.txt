# Connettore Marstek Venus

Questa app di Homey si connette a un sistema di batterie Marstek Venus tramite rete locale o servizio cloud Marstek e recupera statistiche sulla batteria. Ti permette di monitorare lo stato della batteria, il livello di carica e altre informazioni rilevanti direttamente dal tuo sistema smart home Homey. Usando i flussi puoi inviare comandi alla batteria per cambiare modalità (solo API locale). C'è un algoritmo di rilevamento automatico che cerca di trovare le tue batterie Marstek Venus.

## CARATTERISTICHE

Quando un dispositivo è rilevato e la comunicazione funziona, il dispositivo mostrerà varie statistiche come:
- Livello di carica della batteria
- Stato (carica, scarica, inattivo)
- Energia residua (in kilowatt/ora)
- Energia da rete/senza rete
- Corrente in uscita o ingresso (Watt)
- Temperatura della batteria
- Totali di carica e scarica (kWh)

Puoi anche inviare comandi alla batteria per cambiare la modalità operativa in 'Manuale', 'AI', 'Passivo' o 'Auto'. Questi comandi possono essere trasmessi usando i flussi Homey ('Quindi...').

## REQUISITI

Questa app richiede Homey e un sistema di batterie Marstek Venus.

- Quando si utilizza il **driver API locale** Homey e la batteria devono essere connessi alla stessa rete con l'API locale abilitata (vedi sotto). Il rilevamento automatico delle batterie Marstek Venus è supportato sulla stessa rete locale e quando l'intervallo IP è 192.168.x.y; cercherà nell'ultimo ottetto (y) da 1 a 254.
- Quando si utilizza il **driver cloud** è necessario un account attivo Marstek cloud/app. Durante l'abbinamento, Homey chiederà nome utente e password per autenticarsi con il servizio cloud di Marstek.

### ABBINAMENTO DISPOSITIVO (CLOUD)

Scegli il dispositivo “Marstek Venus (Cloud)” durante l'abbinamento, accedi con le credenziali cloud di Marstek e seleziona il sito/dispositivo che vuoi aggiungere. Le credenziali sono memorizzate in modo sicuro nel negozio di dispositivi e usate solo per aggiornare le statistiche della batteria dagli endpoint cloud di Marstek.

### ABBINAMENTO DISPOSITIVO (API LOCALE)

L'API Locale è disabilitata di default, deve essere abilitata sul sistema di batterie Marstek Venus. Questo può essere fatto in due modi:
- Usa l'app BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) sul tuo smartphone (o portatile) vicino alla batteria. Connetti e usa il pulsante 'Abilita API Locale (30000)' nella scheda 'Sistema'.
- Contatta il supporto Marstek affinché abilitino l'API Locale per te. Questo potrebbe richiedere alcuni giorni.

*L'API locale deve essere abilitata per il numero di porta 30000 (su ogni dispositivo). Al momento non sono supportati altri numeri di porta.*

## ISTRUZIONI PASSO PASSO

1. Installa l'app MarstekHomey dallo Store delle App di Homey.
2. Aggiungi un nuovo dispositivo utilizzando il Connettore Batteria Marstek
3. Seleziona il tipo di connessione da fare:
- Per API: il sistema rileverà automaticamente
- Per Cloud: inserisci le tue credenziali App/Cloud e lascia che rilevi automaticamente
4. Seleziona/verifica tutti i dispositivi da aggiungere e clicca su continua per aggiungerli a Homey.
5. Guarda la magia mentre le statistiche della batteria vengono recuperate e mostrate nella/e scheda/e del dispositivo.

Puoi aggiungere dispositivi sia da API che da Cloud. Vedi le impostazioni di ciascuna batteria per ulteriori dettagli.

## CRONOLOGIA VERSIONI

- 0.8.10 - Applicate correzioni ai fattori di default per combinazioni hardware/firmware, basate su feedback della comunità. L'impostazione di trasmissione ora è di default vera durante la scoperta del dispositivo. I fattori mancanti sono ora impostati su default quando si aggiorna l'app.
- 0.8.9 - Resi configurabili tutti i fattori applicati alla ricezione dei dati API. Incluso anche i fattori di default per diverse versioni hardware e firmware.
- 0.8.8 - La trasmissione UDP o l'invio di pacchetti UDP singoli alle singole batterie è ora configurabile (di default trasmette).
- 0.8.7 - I messaggi 'ES.GetStatus' non utilizzano più la trasmissione UDP ma ora mirano direttamente l'indirizzo IP del dispositivo, inviando una richiesta per dispositivo.
- 0.8.6 - Aggiunto debug quando la sorgente dei dettagli del messaggio non corrisponde alla/e sorgente/i configurata/e.
- 0.8.5 - Aggiunti log addizionali per migliorare la compatibilità di Marstek Venus, solo per la versione TEST di questa app.
- 0.8.4 - L'intervallo di polling non poteva essere sempre determinato quando si aggiornava l'app Homey dalle versioni precedenti, aggiunto un valore di intervallo di fallback.
- 0.8.3 - Rimosso un bug che causava l'assenza di elaborazione di dati dall'API locale. Ora il flag di debug è sempre impostato per le versioni TEST dell'app.
- 0.8.2 - Le impostazioni di default possono essere fornite durante l'abbinamento dei dispositivi API locali. Aggiunta l'escape delle stringhe durante il login al cloud. Id unico per i messaggi limitato a intero a 16 bit.
- 0.8.1 - **[attuale versione LIVE]** Aggiunta impostazione per disabilitare il polling per i dati dell'API locale, ma i flussi che inviano comandi alla batteria sono ancora possibili, per alleviare i problemi di comunicazione quando utilizzati insieme a CT002/CT003.
- 0.8.0 - Modifiche alla struttura del codice e ripulitura su github. Convertito il sorgente a solo TypeScript.
- 0.7.6 - I dati cloud smettevano di aggiornarsi quando la risposta iniziale del servizio Cloud Marstek era lenta, causando un problema di concorrenza.
- 0.7.5 - Password errata per il Cloud Marstek non poteva essere corretta senza rimuovere prima l'app. Errori tecnici sul servizio Cloud di Marstek non sono correttamente catturati.
- 0.7.4 - La temperatura riportata dallo stesso firmware ha un moltiplicatore diverso; aggiunto calcolo di sanità mentale. I problemi di login su Cloud Marstek non sono stati gestiti correttamente.
- 0.7.3 - Il login su Cloud poteva fallire per utenti con più dispositivi. Aggiunte alcune traduzioni.
- 0.7.2 - La temperatura per firmware 154 era riportata in modo errato. Aggiunto meccanismo di ritentativo alle schede flusso che impostano la modalità batteria. Migliorata la leggibilità di alcune classi di libreria.
- 0.7.1 - Aggiunta scheda flusso per cambiare la modalità di carica della batteria tramite API locale.
- 0.7.0 - Aggiunto supporto per un driver cloud Marstek che recupera statistiche della batteria usando le credenziali del tuo account cloud Marstek.
- 0.6.3 - Aggiunta una proprietà che monitora il numero di secondi dell'ultimo messaggio ricevuto dalla batteria. Aggiunte icone per capacità personalizzate.
- 0.6.2 - L'impostazione del firmware era memorizzata come tipo di impostazione errata.
- 0.6.1 - Il firmware 154 sembra comunicare valori con moltiplicatori diversi. L'app ora rileva il firmware e corregge questo.
- 0.6.0 - Riconnessione automatica implementata; ritenta l'associazione della porta a ogni trasmissione quando il listener non è più disponibile. Corretti errori su più dispositivi che tentano di iniziare a connettersi contemporaneamente. Sistemati alcuni altri piccoli bug in diversi punti.
- 0.5.7 - Corretta implementazione delle impostazioni di Homey come chiamate asincrone.
- 0.5.6 - Sembra che l'ambito non sia più disponibile durante la gestione dell'evento di chiusura, quindi la registrazione dell'evento di chiusura è ora codificata nel console.
- 0.5.5 - Il socket UDP dgram non ha una funzione di distruzione, richiamarlo causava un crash durante la disinstallazione dell'App.
- 0.5.4 - Modificata la struttura del log per cercare di catturare problemi di connettività. Risolto il problema nella funzione di pulizia.
- 0.5.3 - Applicata correzione del bug alla scoperta dell'indirizzo IP di trasmissione (causava problemi quando non veniva trovato nessun indirizzo).
- 0.5.2 - Aggiunto un id univoco incrementale a tutti i messaggi alla batteria. Ristrutturato il modo in cui i dettagli sono recuperati dai messaggi nei valori di capacità di Homey. Gestione addizionale di onUninit per la rimozione del listener UDP. Aggiunte più capacità ricevute dalla batteria (non verificate).
- 0.5.1 - Gestione degli errori durante l'associazione dei socket e le impostazioni del flag di trasmissione per un miglior debug di futuri errori di binding porta. Rimosse alcune impostazioni obbligatorie che causavano problemi durante la scoperta.
- 0.5.0 - Aggiunte ulteriori letture dall'API della batteria e dal sistema energetico che ora sono visualizzate in Homey secondo le loro linee guida per le batterie. 
(i dettagli della cronologia più antichi sono omessi)

## NOTE

- Questa app utilizza le funzionalità 'API over UDP' come menzionato nella documentazione API. 
- L'app è sviluppata e testata con un sistema di batterie Venus E v2.0 (firmware v153, modulo di comunicazione 202409090159). Fammi sapere se altri modelli funzionano anche!
- Quando il dispositivo non può essere rilevato automaticamente, si prega di controllare se la batteria Marstek Venus è accesa e connessa alla stessa rete di Homey.
- Il supporto per più batterie Marstek Venus è implementato, ma dato che possiedo solo una batteria per i test, qualcosa non è ancora esplorato.
- Attualmente solo la porta UDP 30000 è supportata sull'API locale.
- Quando si aggiorna l'app, potrebbe essere necessario rimuovere prima i dispositivi a batteria già aggiunti e poi aggiungerli di nuovo.
- L'API Cloud di Marstek è non documentata, quindi le cose potrebbero cambiare senza preavviso.
- I cambiamenti di modalità della batteria hanno un tentativo automatico massimo di 5 tentativi con un timeout di 15 secondi.

## PROBLEMI CONOSCIUTI

- A volte la comunicazione UDP si interrompe dopo un po' (senza alcuna eccezione, avvertimento).
- Non tutti i pacchetti UDP trasmessi ricevono risposta dalla batteria (viene ignorata silenziosamente).
- Non sembra funzionare bene in congiunzione con CT002 o CT003, la batteria sembra smettere di comunicare.
- I dati Cloud non tengono correttamente conto del porto di alimentazione di backup (mostra 1 Watt)
- Utilizzando il dispositivo Cloud sembra effettuare il logout dall'app (solo token di login singolo consentito da Marstek)

# RISOLUZIONE DEI PROBLEMI

L'API locale della batteria ha alcuni problemi di comunicazione. Non tutti i messaggi UDP ricevono risposta e sembra ci siano alcuni conflitti quando si utilizzano altri metodi per comunicare con la batteria contemporaneamente. La comunicazione sembra deteriorarsi nel tempo fino a fermarsi completamente. Gli utenti con firmware 154 riportano meno problemi. La comunicazione può essere riattivata usando il BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 nella scheda 'Avanzate' utilizzando la funzione 'System Reset'. Nota che la fornitura di energia sarà brevemente interrotta e, successivamente, lo stack di comunicazione risponderà di nuovo a tutti i messaggi.