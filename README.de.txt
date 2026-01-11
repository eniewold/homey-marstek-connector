# Marstek Venus Connector

Diese Homey-App verbindet sich mit einem Marstek Venus Batteriesystem entweder über das lokale Netzwerk oder den Marstek-Cloud-Service und ruft Batteriestatistiken ab. Sie ermöglicht es dir, den Batteriestatus, den Ladezustand und andere relevante Informationen direkt von deinem Homey Smart Home System aus zu überwachen. Mit Flows kannst du Befehle an die Batterie senden, um den Modus zu ändern (nur lokale API). Ein Autoerkennungsalgorithmus versucht, deine Marstek Venus Batterien zu finden.

## FUNKTIONEN

Wenn ein Gerät erkannt wird und die Kommunikation funktioniert, zeigt das Gerät verschiedene Statistiken an wie:
- Batterieladezustand
- Status (laden, entladen, Leerlauf)
- Verbleibende Leistung (in Kilowattstunden)
- Netz/Off-Grid-Strom
- Aktuelle Leistungsausgabe oder -aufnahme (Watt)
- Batterietemperatur
- Lade- und Entladegesamtwerte (kWh)

Du kannst auch Befehle an die Batterie senden, um den Betriebsmodus auf 'Manuell', 'KI', 'Passiv' oder 'Auto' zu ändern. Diese Befehle können über Homey-Flows ('Dann...') übertragen werden.

## VORAUSSETZUNGEN

Diese App erfordert Homey und ein Marstek Venus Batteriesystem.

- Bei Verwendung des **local API Treibers** müssen Homey und die Batterie mit demselben Netzwerk verbunden sein, wobei die lokale API aktiviert sein muss (siehe unten). Die automatische Erkennung von Marstek Venus Batterien wird im selben lokalen Netzwerk unterstützt, wenn der IP-Bereich 192.168.x.y ist; es wird innerhalb des letzten Oktetts (y) von 1 bis 254 gesucht.
- Bei Verwendung des **cloud Treibers** benötigst du ein aktives Marstek-Cloud/App-Konto. Während der Kopplung wird Homey nach dem Benutzernamen und Passwort fragen, um sich beim Marstek-Cloud-Dienst zu authentifizieren.

### GERÄTE PAIRING (CLOUD)

Wähle während des Pairings das Gerät „Marstek Venus (Cloud)“, melde dich mit deinen Marstek-Cloud-Zugangsdaten an und wähle die Site/das Gerät aus, das du hinzufügen möchtest. Die Zugangsdaten werden sicher im Gerätespeicher gespeichert und ausschließlich zum Aktualisieren der Batteriestatistiken von den Marstek-Cloud-Endpunkten verwendet.

### GERÄTE PAIRING (LOKALE API)

Die lokale API ist standardmäßig deaktiviert. Diese muss auf dem Marstek Venus Batteriesystem aktiviert werden. Dies kann auf zwei Arten geschehen:
- Verwende das BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) auf deinem Smartphone (oder Laptop) in der Nähe der Batterie. Verbinde dich und verwende die Schaltfläche "Enable Local API (30000)" im „System“-Tab.
- Kontaktiere Marstek Support, um die lokale API für dich zu aktivieren. Dies kann einige Tage dauern.

*Die lokale API muss für Portnummer 30000 (auf jedem Gerät) aktiviert sein. Derzeit werden keine anderen Portnummern unterstützt.*

## SCHRITT FÜR SCHRITT ANLEITUNG

1. Installiere die MarstekHomey-App aus dem Homey App Store.
2. Füge ein neues Gerät mit dem Marstek Battery Connector hinzu
3. Wähle die Art der Verbindung, die hergestellt werden soll:
- Bei API: das System wird automatisch erkannt
- Bei Cloud: Gib deine App/Cloud-Zugangsdaten ein und lasse es sich automatisch erkennen
4. Wähle/prüfe alle Geräte, die hinzugefügt werden sollen, und klicke auf Weiter, um sie zu Homey hinzuzufügen.
5. Sieh zu, wie die Batteriestatistiken abgerufen und in der Gerätekarte(n) angezeigt werden.

Du kannst Geräte sowohl aus der API als auch aus der Cloud verwenden. Siehe die Einstellungen jeder Batterie für weitere Details.

## VERSIONSGESCHICHTE

- 0.8.10 - Korrekturen für Standardfaktoren für Hardware-/Firmware-Kombinationen basierend auf Community-Feedback angewendet. Broadcast-Einstellung jetzt standardmäßig wahr bei Gerätesuche. Fehlende Faktoren werden jetzt beim Aktualisieren der App auf Standard gesetzt.
- 0.8.9 - Alle Faktoren, die beim Empfang von API-Daten angewendet werden, sind nun konfigurierbar. Auch Standardfaktoren für verschiedene Hardware- und Firmware-Versionen hinzugefügt.
- 0.8.8 - UDP-Broadcast oder das Senden einzelner UDP-Pakete an einzelne Batterien ist nun konfigurierbar (standardmäßig auf Broadcast).
- 0.8.7 - Die 'ES.GetStatus'-Nachrichten verwenden keinen UDP-Broadcast mehr, sondern zielen jetzt direkt auf die IP-Adresse des Geräts ab und senden eine Anfrage pro Gerät.
- 0.8.6 - Debugging hinzugefügt, wenn die Quellendetails der Nachricht nicht mit der konfigurierten Quelle(n) übereinstimmen.
- 0.8.5 - Zusätzliche Debugging-Protokolle für die Verbesserung der Marstek Venus-Kompatibilität hinzugefügt, nur für die TEST-Version dieser App.
- 0.8.4 - Das Abfrageintervall konnte nicht immer bestimmt werden, wenn die Homey-App von früheren Versionen aktualisiert wurde, es wurde ein Fallback-Intervallwert hinzugefügt.
- 0.8.3 - Ein Fehler entfernt, der verursachte, dass keine Daten von der lokalen API verarbeitet wurden. Debug-Flag ist nun immer für TEST-Versionen der App gesetzt.
- 0.8.2 - Standard-Einstellungen können während des Pairings von lokalen API-Geräten angegeben werden. Escaping von Strings während des Cloud-Logins hinzugefügt. Eindeutige ID für Nachrichten auf 16-Bit-Integer beschränkt.
- 0.8.1 - **[jetzige LIVE-Version]** Einstellungen hinzugefügt, um das Abfragen von Daten aus der lokalen API zu deaktivieren, aber Flows, die Batteriebefehle senden, sind weiterhin möglich, um Kommunikationsprobleme zu mildern, wenn sie zusammen mit CT002/CT003 verwendet werden.
- 0.8.0 - Code-Strukturänderungen und GitHub-Aufräumarbeiten. Quelle nur in TypeScript umgewandelt.
- 0.7.6 - Cloud-Daten stoppten die Aktualisierung, wenn die anfängliche Antwort des Marstek-Cloud-Dienstes langsam war, was ein Parallelitätsproblem verursachte.
- 0.7.5 - Falsches Passwort für Marstek Cloud konnte nicht korrigiert werden, ohne die App zuerst zu entfernen. Technische Fehler beim Marstek-Cloud-Dienst werden nicht korrekt erfasst.
- 0.7.4 - Temperatur gemeldet von derselben Firmware hat anderen Multiplikator; Berechnung der Kohärenz hinzugefügt. Marstek Cloud-Login-Probleme wurden nicht korrekt behandelt.
- 0.7.3 - Cloud-Login konnte bei Benutzern mit mehreren Geräten fehlschlagen. Einige Übersetzungen hinzugefügt.
- 0.7.2 - Temperatur für Firmware 154 wurde falsch gemeldet. Wiederholungsmechanismus zu den Flow-Karten hinzugefügt, die den Batteriemodus festlegen. Lesbarkeit einiger Bibliotheksklassen verbessert.
- 0.7.1 - Flow-Karte hinzugefügt, um den Batterielademodus über die lokale API zu ändern.
- 0.7.0 - Unterstützung für einen Marstek-Cloud-Treiber hinzugefügt, der Batteriestatistiken mit deinen Marstek-Cloud-Kontoanmeldeinformationen abruft.
- 0.6.3 - Eine Eigenschaft hinzugefügt, die die Anzahl der Sekunden überwacht, seit die letzte Nachricht von der Batterie empfangen wurde. Symbole für benutzerdefinierte Fähigkeiten hinzugefügt.
- 0.6.2 - Firmware-Einstellung wurde als falscher Einstellungstyp gespeichert.
- 0.6.1 - Firmware 154 scheint Werte mit einem anderen Multiplikator zu kommunizieren. Die App erkennt nun die Firmware und korrigiert dies.
- 0.6.0 - Auto-Wiederverbindung implementiert; Portbindung bei jedem Broadcast erneut versuchen, wenn der Listener nicht mehr verfügbar ist. Fehler bei mehreren Geräten behoben, die gleichzeitig versuchen, die Verbindung zu starten. Ein paar andere kleinere Fehler an mehreren Stellen behoben.
- 0.5.7 - Korrekte Implementierung der Einstellung von Homey-Fähigkeiten als asynchrone Aufrufe.
- 0.5.6 - Scope scheint beim Schließen der Ereignisbehandlung nicht mehr verfügbar zu sein, daher wird das Schließen des Ereignisses nun fest im Konsolenprotokoll aufgezeichnet.
- 0.5.5 - Der UDP-Dgram-Socket verfügt nicht über eine Zerstörungsfunktion, das Aufrufen dieser Funktion verursachte einen Absturz bei der Deinstallation der App.
- 0.5.4 - Protokollstruktur geändert, um Verbindungsprobleme zu erfassen. Ein Problem in der Aufräumfunktion behoben.
- 0.5.3 - Fehlerkorrektur auf IP-Adresserkennung angewendet (verursachte Probleme, wenn keine Adresse gefunden wurde).
- 0.5.2 - Eine eindeutige ID zu allen Nachrichten an die Batterie hinzugefügt. Die Weise umstrukturiert, wie Details aus Nachrichten in Homey-Fähigkeitswerte abgerufen werden. Zusätzliche aufUninit-Verarbeitung für die Entfernung des UDP-Listeners. Weitere Fähigkeiten von der Batterie empfangen (nicht überprüft) hinzugefügt.
- 0.5.1 - Behandlung von Fehlern bei der Socket-Bindung und Broadcast-Flags für ein besseres Debuggen zukünftiger Port-Bindungsfehler. Einige obligatorische Einstellungen entfernt, die bei der Erkennung Probleme verursachten.
- 0.5.0 - Zusätzliche Ablesungen von der Batterie-API und dem Energiesystem hinzugefügt, die nun gemäß den Richtlinien für Batterien in Homey visualisiert werden.
(ältere historische Details werden ausgelassen)

## HINWEISE

- Diese App verwendet die 'API über UDP'-Funktionen, wie in der API-Dokumentation erwähnt.
- Die App wurde mit einem Venus E v2.0 Batteriesystem (Firmware v153, Kommunikationsmodul 202409090159) entwickelt und getestet. Lass mich wissen, ob auch andere Modelle funktionieren!
- Wenn das Gerät nicht automatisch erkannt werden kann, überprüfe, ob die Marstek Venus Batterie eingeschaltet und mit demselben Netzwerk wie Homey verbunden ist.
- Unterstützung für mehrere Marstek Venus Batterien ist implementiert. Da ich jedoch nur eine Batterie zum Testen habe, ist einiges unbekannt.
- Derzeit wird auf der lokalen API nur der UDP-Port 30000 unterstützt.
- Beim Aktualisieren der App kann es erforderlich sein, bereits hinzugefügte Batteriegeräte zuerst zu entfernen und sie dann erneut hinzuzufügen.
- Die Marstek Cloud-API ist undokumentiert, daher können sich Dinge ohne Vorankündigung ändern.
- Änderungen des Batteriemodus haben einen automatischen Wiederholungsversuch für maximal 5 Versuche mit einem Timeout von 15 Sekunden.

## BEKANNTE PROBLEME

- Manchmal stoppt die UDP-Kommunikation nach einer Weile (ohne jegliche Ausnahme, Warnung).
- Nicht alle gesendeten UDP-Pakete werden von der Batterie beantwortet (sie ignoriert sie stillschweigend).
- Funktioniert scheinbar nicht gut in Verbindung mit CT002 oder CT003, die Batterie scheint die Kommunikation zu stoppen.
- Cloud-Daten berücksichtigen nicht korrekt den Backup-Stromanschluss (zeigen 1 Watt an)
- Bei Verwendung des Cloud-Geräts scheint sich die App abzumelden (es ist nur ein einzelnes Login-Token erlaubt durch Marstek)

# FEHLERBEHEBUNG

Die lokale API der Batterie hat einige Kommunikationsprobleme. Nicht alle UDP-Nachrichten werden beantwortet, und es scheint einige Konflikte zu geben, wenn andere Methoden verwendet werden, um gleichzeitig mit der Batterie zu kommunizieren. Die Kommunikation scheint im Laufe der Zeit zu verschlechtern, bis sie vollständig stoppt. Benutzer mit Firmware 154 berichten von weniger Problemen. Die Kommunikation kann durch das Verwenden des BLE Test Tools (https://rweijnen.github.io/marstek-venus-monitor/latest/) v2.0 unter dem Tab 'Advances' mit der Funktion 'System Reset' neu gestartet werden. Beachte, dass die Stromlieferung für einen kurzen Moment unterbrochen wird, und danach wird der Kommunikationsstack wieder auf alle Nachrichten reagieren.