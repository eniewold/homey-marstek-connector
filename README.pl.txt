# Marstek Venus Connector

Ta aplikacja Homey łączy się z systemem akumulatorów Marstek Venus przez lokalną sieć lub za pośrednictwem usługi chmurowej Marstek i pobiera statystyki akumulatora. Pozwala ona monitorować stan akumulatora, poziom naładowania i inne istotne informacje bezpośrednio z systemu inteligentnego domu Homey. Używając przepływów, możesz wysyłać polecenia do akumulatora, aby zmienić tryb (tylko API lokalne). Istnieje algorytm automatycznego wykrywania, który próbuje znaleźć Twoje akumulatory Marstek Venus.

## FUNKCJE

Gdy urządzenie jest wykryte i komunikacja działa, urządzenie wyświetli różne statystyki, takie jak:
- Poziom naładowania akumulatora
- Status (ładowanie, rozładowywanie, bezczynny)
- Pozostała moc (w kilowatach/godzinach)
- Zasilanie sieciowe/poza siecią
- Obecna moc wyjściowa lub pobierana (Watt)
- Temperatura akumulatora
- Suma ładowania i rozładowywania (kWh)

Możesz także wysyłać polecenia do akumulatora, aby zmienić tryb pracy na 'Ręczny', 'AI', 'Pasywny' lub 'Auto'. Te polecenia mogą być przesyłane za pomocą przepływów Homey ('Then…').

## WYMAGANIA

Ta aplikacja wymaga systemu Homey i akumulatora Marstek Venus.

- Podczas korzystania z **sterownika API lokalnego** Homey i akumulator muszą być podłączone do tej samej sieci z włączonym lokalnym API (patrz poniżej). Automatyczne wykrywanie akumulatorów Marstek Venus jest obsługiwane w tej samej lokalnej sieci, gdy zakres IP to 192.168.x.y; przeszukuje ostatni oktet (y) od 1 do 254.
- Podczas korzystania z **sterownika chmurowego** potrzebujesz aktywnego konta w chmurze/aplikacji Marstek. Podczas parowania Homey poprosi o nazwę użytkownika i hasło w celu autoryzacji z usługą chmurową Marstek.

### PAROWANIE URZĄDZENIA (CHMURA)

Wybierz urządzenie „Marstek Venus (Chmura)” podczas parowania, zaloguj się za pomocą swoich danych chmury Marstek i wybierz witrynę/urządzenie, które chcesz dodać. Dane logowania są bezpiecznie przechowywane w sklepie urządzeń i używane wyłącznie do odświeżania statystyk akumulatora z punktów końcowych chmury Marstek.

### PAROWANIE URZĄDZENIA (API LOKALNE)

API lokalne jest domyślnie wyłączone, należy je włączyć w systemie akumulatorów Marstek Venus. Można to zrobić na dwa sposoby:
- Użyj narzędzia BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) na swoim smartfonie (lub laptopie) w pobliżu akumulatora. Połącz się i użyj przycisku 'Enable Local API (30000)' w zakładce 'System'.
- Skontaktuj się z pomocą techniczną Marstek, aby włączyli dla Ciebie API lokalne. Może to zająć kilka dni.

*API lokalne musi być włączone dla numeru portu 30000 (na każdym urządzeniu). Aktualnie nie są obsługiwane inne numery portów.*

## INSTRUKCJA KROK PO KROKU

1. Zainstaluj aplikację MarstekHomey ze sklepu Homey App Store.
2. Dodaj nowe urządzenie używając Marstek Battery Connector
3. Wybierz typ połączenia do nawiązania:
- Dla API: system wykryje automatycznie
- Dla chmury: Wprowadź swoje dane aplikacji/chmury i pozwól na wykrycie automatyczne
4. Wybierz/sprawdź wszystkie urządzenia do dodania i kliknij dalej, aby dodać je do Homey.
5. Obserwuj, jak magia działa, gdy statystyki akumulatora są pobierane i wyświetlane w karcie urządzenia.

Możesz dodawać urządzenia zarówno z API, jak i chmury. Zobacz ustawienia każdego akumulatora dla dodatkowych szczegółów.

## HISTORIA WERSJI

- 0.8.10 - Zastosowano poprawki do domyślnych czynników dla kombinacji sprzęt/oprogramowanie, opierając się na opiniach społeczności. Ustawienia transmisji teraz domyślnie włączone podczas wykrywania urządzeń. Brakujące czynniki są teraz ustawiane na domyślne podczas aktualizacji aplikacji.
- 0.8.9 - Wprowadzono możliwość konfigurowania wszystkich czynników stosowanych podczas otrzymywania danych API. Włączono także domyślne czynniki dla różnych wersji sprzętu i oprogramowania.
- 0.8.8 - Wysłanie UDP do indywidualnych akumulatorów jest teraz konfigurowalne (domyślnie transmisja).
- 0.8.7 - Wiadomości 'ES.GetStatus' nie używają już transmisji UDP, teraz bezpośrednio kierują się na adres IP urządzenia, wysyłając jedno żądanie na urządzenie.
- 0.8.6 - Dodano debugowanie, gdy szczegóły wiadomości źródłowej nie pasują do skonfigurowanego źródła(ów).
- 0.8.5 - Dodano dodatkowe dzienniki debugowania w celu poprawy zgodności z Marstek Venus, tylko dla wersji TEST tej aplikacji.
- 0.8.4 - Interwał sondowania nie zawsze był określony przy aktualizacji aplikacji Homey z poprzednich wersji, dodano wartość zapasową interwału.
- 0.8.3 - Usunięto błąd, który powodował, że dane z lokalnego API nie były przetwarzane. Flaga debugowania jest teraz zawsze ustawiona dla wersji TEST aplikacji.
- 0.8.2 - Domyślne ustawienia mogą być podane podczas parowania urządzeń z lokalnym API. Dodano ucieczkę znaków podczas logowania do chmury. Unikalny identyfikator dla wiadomości ograniczony do 16-bitowej liczby całkowitej.
- 0.8.1 - **[aktualna wersja LIVE]** Dodano ustawienia do wyłączania sondowania danych z lokalnego API, ale nadal można przesyłać polecenia baterii przez przepływy, aby złagodzić problemy komunikacyjne podczas użytkowania z CT002/CT003.
- 0.8.0 - Zmiany struktury kodu i czyszczenie github. Przekształcono źródło na TypeScript.
- 0.7.6 - Dane chmury przestały się aktualizować, gdy początkowa odpowiedź usługi Marstek Cloud była wolna, powodując problem z równoczesnością.
- 0.7.5 - Nie można było poprawić niepoprawnego hasła do chmury Marstek bez usunięcia aplikacji jako pierwszego. Błędy techniczne w usłudze chmurowej Marstek nie są poprawnie przechwytywane.
- 0.7.4 - Temperatura raportowana przez to samo oprogramowanie ma inny mnożnik; dodano sanity calculation. Problemy z logowaniem do chmury Marstek nie były prawidłowo obsługiwane.
- 0.7.3 - Logowanie w chmurze mogło się nie powieść dla użytkowników z wieloma urządzeniami. Dodano kilka tłumaczeń.
- 0.7.2 - Temperatura dla oprogramowania 154 była raportowana niepoprawnie. Dodano mechanizm ponawiania do kart przepływu, które ustawiają tryb baterii. Poprawiona czytelność niektórych klas bibliotecznych.
- 0.7.1 - Dodano kartę przepływu do zmiany trybu ładowania baterii przez lokalne API.
- 0.7.0 - Dodano wsparcie dla sterownika chmurowego Marstek, który pobiera statystyki baterii przy użyciu danych logowania do chmury Marstek.
- 0.6.3 - Dodano właściwość monitorującą liczbę sekund od ostatniej wiadomości otrzymanej z baterii. Dodano ikonki dla niestandardowych funkcji.
- 0.6.2 - Ustawienie oprogramowania było przechowywane jako niepoprawny typ ustawień.
- 0.6.1 - Oprogramowanie 154 wydaje się komunikować wartości z innymi mnożnikami. Aplikacja teraz wykrywa oprogramowanie i koryguje to.
- 0.6.0 - Wdrożenie automatycznego ponownego łączenia; ponawianie wiązania portu przy każdym nadawaniu, gdy słuchacz nie jest już dostępny. Naprawiono błędy, gdy wiele urządzeń próbowało się połączyć w tym samym czasie. Naprawiono kilka innych drobnych błędów w kilku miejscach.
- 0.5.7 - Poprawnie zaimplementowano ustawienie możliwości Homey jako asynchronicznych wywołań.
- 0.5.6 - Zasięg wydaje się nie być już dostępny podczas obsługi zdarzenia zamykania, więc logowanie zdarzenia zamknięcia jest teraz zakodowane na konsolę.
- 0.5.5 - Gniazdo UDP dgram nie ma funkcji niszczenia, wywołanie tego spowodowało awarię podczas deinstalacji aplikacji.
- 0.5.4 - Zmieniono strukturę dzienników, aby spróbować wykryć problemy z łącznością. Rozwiązano problem w funkcji czyszczenia.
- 0.5.3 - Zastosowano poprawkę błędu do odkrywania adresów IP w nadawaniu (powodowało problemy, gdy nie znaleziono adresu).
- 0.5.2 - Dodano unikalny identyfikator przyrostowy do wszystkich wiadomości do baterii. Przebudowano sposób, w jaki szczegóły są pobierane z wiadomości do wartości zdolności Homey. Dodatkowe zarządzanie usuwaniem dla usunięcia słuchacza UDP. Dodano więcej zdolności odbieranych z baterii (niezweryfikowane).
- 0.5.1 - Obsługa błędów podczas wiązania gniazda i ustawień flagi przekazu dla lepszego debugowania przyszłych błędów wiązania portu. Usunięto niektóre obowiązkowe ustawienia, które powodowały problemy podczas wykrywania.
- 0.5.0 - Dodano dodatkowe odczyty z API baterii i systemu energetycznego, które są teraz wizualizowane w Homey zgodnie z ich wytycznymi dla baterii.
(starsze szczegóły historii są pominięte)

## UWAGI

- Ta aplikacja wykorzystuje funkcje 'API przez UDP', jak wspomniano w dokumentacji API.
- Aplikacja jest rozwijana i testowana z systemem akumulatorów Venus E v2.0 (oprogramowanie v153, moduł komunikacyjny 202409090159). Daj mi znać, czy działają także inne modele!
- Gdy urządzenie nie może być automatycznie wykryte, sprawdź, czy akumulator Marstek Venus jest włączony i podłączony do tej samej sieci co Homey.
- Obsługa wielu akumulatorów Marstek Venus jest zaimplementowana, ale ponieważ mam tylko jeden akumulator do testów, niektóre aspekty pozostają niewiadome.
- Jedynie port UDP 30000 jest obecnie obsługiwany na lokalnym API.
- Przy aktualizacji aplikacji może być konieczne usunięcie wcześniej dodanych urządzeń akumulatora i ich ponowne dodanie.
- API Marstek Cloud jest nieudokumentowane, więc rzeczy mogą się zmieniać bez ostrzeżenia.
- Zmiany trybu baterii mają automatyczne ponawianie do maksymalnie 5 prób z 15-sekundowym limitem czasu.

## ZNANE PROBLEMY

- Czasami komunikacja UDP przestaje działać po pewnym czasie (bez żadnych wyjątków, ostrzeżeń).
- Nie wszystkie przesyłane pakiety UDP są odpowiadane przez akumulator (są one cicho ignorowane).
- Nie wydaje się dobrze działać w połączeniu z CT002 lub CT003, bateria wydaje się przestawać komunikować.
- Dane chmurowe nie są poprawnie uwzględniane w porcie zasilania awaryjnego (pokazują 1 wat).
- Używanie urządzenia chmurowego wydaje się wylogowywać aplikację (dozwolony jest tylko jeden token logowania przez Marstek).

# ROZWIĄZYWANIE PROBLEMÓW

Lokalne API baterii ma pewne problemy komunikacyjne. Nie na wszystkie wiadomości UDP są odpowiedzi, i wydają się występować konflikty podczas jednoczesnego używania innych metod komunikacji z baterią. Komunikacja wydaje się pogarszać z czasem, aż do całkowitego zatrzymania. Użytkownicy z oprogramowaniem 154 zgłaszają mniej problemów. Komunikację można ponownie uruchomić, używając narzędzia BLE Test Tool (https://rweijnen.github.io/marstek-venus-monitor/latest/) w wersji 2.0, w zakładce 'Advances' używając funkcji 'System Reset'. Uwaga: dostarczanie mocy zostanie na krótko przerwane, a po tym stos komunikacji znów zacznie odpowiadać na wszystkie wiadomości.