Ein Auftrag läuft immer wie folgt ab:


1. Auftrag erstellt.
2. Mitarbeiter machen sich auf den Weg zum Auftragsort. 
3. Mitarbeiter sind am Auftragsort angekommen.
4. Mitarbeiter beginnen Arbeit. -> Status in Arbeit
5. Mitarbeiter haben Arbeit abgeschlossen.
6. Mitarbeiter füllen Rapport aus.
7. Mitarbeiter verlassen Auftragsort.


Damit wir immer wissen wo sich die Fahrzeuge befinden, sollen die Positionen der Fahrzeuge immer aktuell gehalten werden.


Hierzu beachte den Ablauf eines Auftrages.

Mir fallen gerade folgende Sachen ein:

Ankunft an Auftrags ort: Mitarbeiter bestätigt per Button, bin am Auftragsort.

Dialog Bist du am Auftragsort angekommen: Auch hier dann bei bestätigung den Standort aktualisieren.

Anderer Fall: 

Fahrzeug freigeben:  Es kommt ein Dialog mit der Frage, Addresse eingeben oder aktuellen Standord verwenden oder bestehenden Ort beibehalten.

---

## Bestandsaufnahme (was es dafür schon gibt)

- **Auftrags-Mikro-Status existieren bereits teilweise**, siehe `feature-meldungen.md`: Collection `order_checkins` (`order`, `employee`, `type: 'unterwegs' | 'angekommen'`, `created` als Zeitstempel) – pro Mitarbeiter statt als Feld auf `orders`, weil mehrere zugewiesene Mitarbeiter zu unterschiedlichen Zeiten unterwegs/angekommen sein können.
  - Frontend: `frontend/src/core/api/orderCheckins.ts`, `frontend/src/core/hooks/useOrderCheckins.ts`.
  - UI in `OrderCard.tsx`: Button "Mache mich jetzt auf den Weg zum Kunden" (`handleEnroute`, öffnet danach `MapsAppDialog`) und "Bin jetzt beim Kunden angekommen" (`handleArrived`). Dazu ein wegklickbarer, aber wiederkehrender Fallback-`ConfirmDialog` ("Angekommen?"), der 60 Minuten nach "unterwegs" erscheint, falls "angekommen" vergessen wurde.
  - Backend-Hook `notifications_orders.pb.js` erzeugt daraus schon Meldungen: `order_enroute` (an alle) und `order_arrived` (nur Chef/Büro).
- **"Arbeit beginnen" / Status "in Arbeit" existiert noch nicht.** Es gibt keinen dritten `order_checkins`-Typ und kein abgeleitetes UI-Badge dafür.
- **"Arbeit abgeschlossen" + "Rapport ausfüllen" sind bereits vollständig abgedeckt**, nur anders benannt: Der Button "Als erledigt melden" öffnet `CompleteOrderDialog.tsx`, der zwingend Fotos **und** mindestens einen Rapportzettel (`rapports`-Collection, `RapportForm`) verlangt, bevor `orders.status` von `offen` auf `erledigt` wechselt. Das deckt Schritt 5+6 aus deiner Liste schon ab – hier ist vermutlich nichts mehr zu bauen, außer du meinst etwas anderes damit.
- **"Auftragsort verlassen" existiert noch nicht.**
- **Fahrzeuge haben bereits vollständige Standort-Felder**: `vehicles.address/lat/lng/locationUpdatedAt` (`frontend/src/features/vehicles/types/vehicle.ts`, Migration `1783167075_fundament_schema.js`). API-Funktion `updateVehicleLocation()` (`frontend/src/features/vehicles/api/vehicles.ts`) setzt alle drei Felder + Zeitstempel in einem Rutsch.
- **Standort-Erfassung gibt es schon als manuelles UI-Muster** in `VehicleCard.tsx`: ein Adressfeld mit zwei Buttons "Adresse geocodieren" (`geocodeAddress()` gegen Nominatim/OSM, `frontend/src/core/api/geocoding.ts`) und "Meinen Standort verwenden" (`navigator.geolocation.getCurrentPosition`). Das ist genau die Bausteine, die der neue "Fahrzeug freigeben"-Dialog wiederverwenden sollte, statt etwas Neues zu erfinden.
- **"Fahrzeug freigeben" ist aktuell ein einzelner Klick ohne Dialog**: Der Button in `VehicleCard.tsx` (Zeile ~122-130) ruft direkt `assignVehicle(id, null)` auf, es gibt keine Standortabfrage. Serverseitig löst das Freigeben schon eine `vehicle_returned`-Meldung aus (`notifications_events_vehicles.pb.js`) – daran muss nichts geändert werden.
- **Es gibt noch keine Kopplung zwischen Auftrags-Checkins und Fahrzeugposition.** "Angekommen"-Checkin und Fahrzeugstandort sind heute zwei komplett getrennte Vorgänge.

## Konzept

### 1. Auftragsablauf um zwei weitere Mikro-Status ergänzen

**Entscheidung (Frage 1 + Konflikt-Auflösung, siehe unten): `arbeit_begonnen`/`verlassen` sind ein gemeinsamer (nicht pro-Mitarbeiter-individueller) Vorgang pro Auftrag, aber als `order_checkins`-Einträge (Option A) statt als einmalige Felder auf `orders`** – weil ein Auftrag über mehrere Tage laufen kann und es dann pro Tag ein eigenes "Arbeit begonnen"/"verlassen"-Paar braucht. Das heißt:

- Datenmodell: `order_checkins.type` um `'arbeit_begonnen'` und `'verlassen'` erweitern (gleiche Collection wie `unterwegs`/`angekommen`: `order`, `employee`, `type`, `created`).
- Sonderregel, *wer* den Tap auslösen darf: **jeder zugewiesene Mitarbeiter** darf "Arbeit jetzt beginnen"/"Auftragsort jetzt verlassen" antippen – first-come-first-served statt einer Sonderrolle wie "nur Erstankommender". Anders als bei `unterwegs`/`angekommen` gilt der Tap aber für den **ganzen Auftrag an diesem Tag**, nicht nur für den tippenden Mitarbeiter: Sobald ein `arbeit_begonnen`-Eintrag für den aktuellen Tag existiert, verschwindet der Button für alle zugewiesenen Mitarbeiter (ersetzt durch Anzeige "bereits von X um HH:MM gesetzt"); analog für `verlassen`.
- Mehrtägige Aufträge (siehe Konflikt-Auflösung 2 unten): **`unterwegs`/`angekommen` werden jeden Arbeitstag neu getappt**, kein einmaliger Checkin für die ganze Auftragsdauer. Damit lässt sich die Eligibility rein über die **Reihenfolge der jüngsten Einträge** bestimmen, ganz ohne Datums-/Tagesvergleich:
  - `arbeit_begonnen` ist erlaubt, sobald der jeweilige Mitarbeiter selbst einen `angekommen`-Checkin gesetzt hat, der **zeitlich nach dem letzten `verlassen`-Eintrag** liegt (bzw. noch gar kein `verlassen` existiert).
  - `verlassen` ist erlaubt, sobald der jüngste `arbeit_begonnen`/`verlassen`-Eintrag vom Typ `arbeit_begonnen` ist.
  - Nach einem `verlassen` ist `arbeit_begonnen` erst wieder möglich, nachdem irgendein Mitarbeiter erneut `angekommen` getappt hat – so kann der Button nie vor einer frischen Ankunftsbestätigung erscheinen, unabhängig davon, wie viele Tage der Auftrag schon läuft.
- Ablauf (wiederholt sich an jedem Arbeitstag ab Schritt 1):
  1. `unterwegs` (bestehend, pro Mitarbeiter, **täglich neu**)
  2. `angekommen` (bestehend, pro Mitarbeiter, **täglich neu**)
  3. `arbeit_begonnen` **(neu, gemeinsam)** – Button "Arbeit jetzt beginnen", erscheint sobald obige Bedingung erfüllt ist.
  4. Auftrag als erledigt melden (bestehend, `CompleteOrderDialog`) – inhaltlich Schritt 5+6 deiner Liste, unabhängig von 3./5. auslösbar (siehe Frage 4).
  5. `verlassen` **(neu, gemeinsam)** – Button "Auftragsort jetzt verlassen", erscheint sobald der jüngste Eintrag ein `arbeit_begonnen` ohne nachfolgendes `verlassen` ist.

Ein Badge "in Arbeit" am Auftrag lässt sich direkt ableiten (jüngster `order_checkins`-Eintrag vom Typ `arbeit_begonnen` und Auftrag noch `offen`) – kein Zusatzfeld nötig.

### 2. Fahrzeugposition automatisch bei "angekommen" aktualisieren

Wenn ein Mitarbeiter, dem aktuell ein Fahrzeug zugeordnet ist (`vehicles.assignedTo === employeeId`), den `angekommen`-Checkin auslöst – **egal ob über den direkten Button oder über die Bestätigung im Fallback-Dialog "Bist du am Auftragsort angekommen?"** – wird automatisch:

1. `navigator.geolocation.getCurrentPosition` abgefragt (gleiches Muster wie `VehicleCard.tsx`s "Meinen Standort verwenden"),
2. bei Erfolg `updateVehicleLocation(vehicleId, { address: order.address, lat, lng })` aufgerufen,
3. bei Ablehnung/Fehler der Geolocation **kein Fehlerdialog** – der Checkin selbst wird trotzdem gesetzt (das Ankunfts-Signal ist wichtiger als die Fahrzeugposition, analog zur bestehenden Entscheidung, dass der "unterwegs"-Zeitstempel unabhängig vom Maps-Dialog gesetzt wird). **Fallback (siehe offene Frage 3): `order.address` per `geocodeAddress()` in lat/lng auflösen** und darüber `updateVehicleLocation(vehicleId, { address: order.address, lat, lng })` aufrufen – so werden alle drei Felder trotzdem gesetzt, nur eben über Geocoding statt Geräte-GPS.

Kein zusätzlicher Button nötig – die Positionsaktualisierung läuft transparent als Nebeneffekt des ohnehin nötigen "Angekommen"-Taps mit.

### 3. Neuer Dialog "Fahrzeug freigeben"

Neue Komponente (Arbeitstitel `ReleaseVehicleDialog`), aufgebaut wie `MapsAppDialog.tsx` (Liste von Optionen statt Ja/Nein), ersetzt den direkten `assign.mutate({ userId: null })`-Klick in `VehicleCard.tsx`:

- **"Adresse eingeben"** → zeigt das vorhandene Adress-Eingabefeld + geocodiert via `geocodeAddress()`, setzt Standort und gibt danach frei.
- **"Aktuellen Standort verwenden"** → `navigator.geolocation`, setzt Standort und gibt danach frei.
- **"Bestehenden Ort beibehalten"** → gibt nur `assignedTo` frei, Standortfelder bleiben unverändert.
- **"Abbrechen"** → schließt den Dialog ohne Änderung (wie bei `MapsAppDialog`).

Technisch: erst `updateVehicleLocation` (falls Option 1/2), danach `assignVehicle(id, null)` – beides über die schon vorhandenen Mutations-Hooks.

### 4. Datenmodell-Änderungen

- Neue Migration in `backend/pb_migrations/`: `order_checkins.type`-SelectField um `'arbeit_begonnen'` und `'verlassen'` erweitern (bestehende Collection ändern, nicht neu anlegen) – siehe Konzept Abschnitt 1 (Option A, wegen mehrtägiger Aufträge).
- Keine neuen Felder auf `vehicles` nötig – `address`/`lat`/`lng`/`locationUpdatedAt` decken alles ab.
- Neue `notifications.type`-Werte `order_work_started`/`order_left` in `notifications_orders.pb.js`, beide **nur an Chef/Büro** (siehe Frage 5) – analog zur bestehenden Empfängerlogik von `order_arrived`.

## Offene Fragen, die den weiteren Plan beeinflussen

1. ~~Sind "Arbeit beginnen" und "Auftragsort verlassen" wirklich pro Mitarbeiter sinnvoll...~~ **Entschieden: ein gemeinsamer Vorgang pro Auftrag/Tag, first-come-first-served**, umgesetzt als `order_checkins`-Einträge (Option A, siehe Konflikt-Auflösung unten und Konzept Abschnitt 1) statt als einmalige `orders`-Felder – wegen mehrtägiger Aufträge (Frage 4).
2. ~~Soll "Als erledigt melden" weiterhin Schritt 5+6 abdecken...~~ **Entschieden: ja**, bestehende Umsetzung (`CompleteOrderDialog`, Fotos + Rapportzettel) bleibt wie sie ist – hier ist nichts zu bauen.
3. ~~Fallback, falls Geolocation bei "angekommen" abgelehnt wird...~~ **Entschieden: `order.address` per `geocodeAddress()` (bestehende Funktion, siehe Abschnitt 40) in lat/lng auflösen** und darüber alle drei Felder (`address`, `lat`, `lng`) setzen, statt nur die Adresse ohne Koordinaten zu speichern.
4. ~~Soll "Auftragsort verlassen" zwingend erst nach "Als erledigt melden" möglich sein...~~ **Entschieden: nein, unabhängig davon** – Begründung: zu einem Auftrag muss man teils an mehreren Tagen hin, "verlassen" ist also nicht an "erledigt melden" gekoppelt.
5. ~~Sollen `arbeit_begonnen`/`verlassen` auch neue Glocken-Meldungen auslösen...~~ **Entschieden: ja, beide neuen Typen (`order_work_started`/`order_left`) gehen nur an Chef/Büro**, nicht an alle Mitarbeiter (anders als `order_enroute`, das an alle geht).
6. ~~Soll die Fahrzeugposition auch beim "Verlassen"-Checkin irgendwie reagieren...~~ **Entschieden: nein, ausschließlich an "angekommen" gekoppelt** – "verlassen" löst keine Fahrzeugstandort-Aktualisierung aus.

## Konflikt durch Antwort zu Frage 4 – aufgelöst mit Option A

Deine Begründung zu Frage 4 ("man muss zu einem Auftrag auch an mehreren Tagen hin") widersprach der ursprünglichen Idee aus Frage 1 (einmalige Felder `orders.workStartedAt`/`leftAt`). **Entschieden: Option A** – `arbeit_begonnen`/`verlassen` werden als `order_checkins`-Einträge geführt (mehrere Paare über die Auftragslaufzeit möglich, first-come-first-served pro Tag), siehe Konzept Abschnitt 1 und Datenmodell Abschnitt 4 oben.

## Konflikt 2: Tagesgrenze für mehrtägige Aufträge – aufgelöst

Die "pro Tag"-Logik aus Konzept Abschnitt 1 setzte ursprünglich voraus, dass ein Mitarbeiter irgendwann `angekommen` getappt hat – ohne Tagesgrenze hätte das ein `angekommen` von Tag 1 auch an Tag 3 noch als Erlaubnis für `arbeit_begonnen` durchgehen lassen, obwohl der Mitarbeiter an dem Tag noch gar nicht bestätigt vor Ort war. **Entschieden: `unterwegs`/`angekommen` werden jeden Arbeitstag neu getappt.** Dadurch lässt sich die Eligibility rein über die Reihenfolge der Checkins lösen (siehe aktualisierter Konzept Abschnitt 1), ganz ohne Datumsvergleich – ein `angekommen` zählt nur, wenn seitdem kein neueres `verlassen` existiert.

**Alle 6 Fragen sind jetzt entschieden, beide Modellierungskonflikte aufgelöst.** Nächster Schritt: Umsetzungsplan (Migration, `notifications_orders.pb.js`-Erweiterung, Frontend-Buttons/Badges für `arbeit_begonnen`/`verlassen`, `ReleaseVehicleDialog`) auf Basis der obigen Entscheidungen ausarbeiten.

---

## Erweiterung: Mehrtägige Aufträge mit mehreren Zeitblöcken

Aufträge sollen künftig über mehrere (nicht zwingend zusammenhängende) Tage laufen können, mit jeweils eigenen Zeitblöcken. Das muss beim Erstellen eines Auftrags und im Kalender berücksichtigt werden.

### Bestandsaufnahme

- **Heute hat ein Auftrag genau ein Datum + ein Zeitpaar**: `backend/pb_migrations/1783167075_fundament_schema.js` definiert `orders.date` (`TextField`, Pattern `^\d{4}-\d{2}-\d{2}$`), `orders.from`/`orders.to` (`TextField`, Pattern `^\d{2}:\d{2}$`, optional) und `orders.assigned` (Relation, mehrere Mitarbeiter).
- **`OrderForm.tsx`** (`frontend/src/features/scheduling/components/OrderForm.tsx`) hat genau ein `&lt;input type="date"&gt;` + zwei `&lt;input type="time"&gt;`, keinen Repeater. `orderFormSchema` (`frontend/src/features/scheduling/types/order.ts`) spiegelt das 1:1.
- **Der gesamte Kalender geht hart von "ein Auftrag = ein Datum = ein Zeitraum" aus**: `WeekPage.tsx` filtert Aufträge über `o.date === dIso`, `listOrdersInRange` (`frontend/src/features/scheduling/api/orders.ts`) filtert serverseitig über `pb.filter('date >= {:from} && date <= {:to}')`, `DayBoardPage.tsx` + `layoutTimeline` (`frontend/src/core/lib/calendarLayout.ts`) legen Aufträge anhand eines einzelnen `from`/`to`-Paars in Bahnen.
- **Kein Vorbild im Repo**: `events`, `vehicles` und `projects` verwenden alle dasselbe Einzeldatum-Muster, nirgendwo gibt es bereits ein Datumsbereichs- oder Mehrblock-Konzept.

### Entschiedene Architektur

1. **Neue Relation-Collection `order_blocks`** (analog zu `order_checkins`): Felder `order` (Relation), `date` (Text, `^\d{4}-\d{2}-\d{2}$`), `from`/`to` (Text, `^\d{2}:\d{2}$`, optional), `assigned` (Relation, mehrere Mitarbeiter). Ersetzt `orders.date`/`from`/`to`/`assigned` vollständig – kein Summenfeld, keine Datenduplikation.
2. **Beliebige Einzelblöcke**, kein zusammenhängender Zeitraum: ein Auftrag kann z. B. Blöcke "Mo 08–12", "Mi 14–18", "Fr ganztags" haben, ohne dass die Tage dazwischen etwas bedeuten.
3. **Zuweisung individuell pro Block**: unterschiedliche Mitarbeiter an unterschiedlichen Tagen sind möglich, da `assigned` jetzt auf `order_blocks` statt auf `orders` sitzt.
4. **`orders` bleibt der Träger für alles Blockübergreifende**: `status`, `closedBy`/`closedAt`, `rapportSigned`/`rapportReason`, Kunde/Adresse/Material/Beschreibung usw. bleiben unverändert auf `orders` – "erledigt melden" ist weiterhin eine einmalige Aktion für den ganzen Auftrag (siehe Frage 4 oben), unabhängig von einzelnen Blöcken.
5. **Anbindung an den Checkin-Flow (siehe Konzept Abschnitt 1 + Konflikt 2 oben)**: "heute" im Sinne von `unterwegs`/`angekommen`/`arbeit_begonnen`/`verlassen` heißt jetzt konkret "der `order_block` mit `date = heute`". Nur Mitarbeiter, die im **heutigen** Block als `assigned` stehen, dürfen für diesen Auftrag heute tappen – nicht alle jemals zugewiesenen Mitarbeiter des gesamten Auftrags.

### Auswirkungen auf bestehenden Code (Umsetzung, nicht mehr offen)

- **Migration**: neue Collection `order_blocks`; bestehende `orders`-Datensätze werden 1:1 in genau einen `order_blocks`-Eintrag überführt (`date`/`from`/`to`/`assigned` übernehmen); anschließend `orders.date`/`from`/`to`/`assigned` per Migration entfernen.
- **`OrderForm.tsx`**: einzelnes Datums-/Zeit-/Zuweisungsfeld wird durch einen Block-Repeater ersetzt (mind. 1 Block Pflicht, "+ weiteren Tag hinzufügen").
- **`listOrdersInRange`**: Range-Filter läuft jetzt gegen `order_blocks.date` statt `orders.date`, liefert dann die zugehörigen `orders` (expandiert).
- **`WeekPage.tsx`/`DayBoardPage.tsx`/`layoutTimeline`**: filtern/positionieren pro `order_block` statt pro `order` – ein Auftrag mit 3 Blöcken erscheint an 3 Tagen mit jeweils eigenem `from`/`to` und eigener Mitarbeiter-Spalte.
- **Alle sonstigen Stellen, die `order.date`/`order.from`/`order.to`/`order.assigned` lesen** (Sortierungen, Übersichtslisten, Benachrichtigungen, Exporte) müssen auf eine Abfrage über `order_blocks` umgestellt werden – dafür braucht es vor der Umsetzung noch eine vollständige Grep-Bestandsaufnahme aller Stellen, die diese Felder referenzieren.

### Offene Fragen zu dieser Erweiterung

1. ~~Kollidierende/überlappende Blöcke am selben Tag...~~ **Entschieden: erstmal nur ein Block pro Auftrag und Tag.** Umsetzung: eindeutiger Index/Constraint auf (`order`, `date`) in `order_blocks`, `OrderForm`-Repeater verhindert das Hinzufügen eines zweiten Blocks mit bereits vergebenem Datum (vormittags/nachmittags-Splitting bleibt für später vorgemerkt).
2. ~~Bearbeiten/Löschen einzelner Blöcke nach Erstellung...~~ **Entschieden: ein einfacher Repeater reicht** – Blöcke können im Bearbeiten-Dialog jederzeit hinzugefügt/entfernt/geändert werden, keine Historie/Protokollierung nötig.
3. ~~"Nächster Termin" in Listenansichten ohne Kalenderbezug...~~ **Entschieden, konkretisiert an drei Fundstellen:**
   - **`OrdersListPage.tsx`** (gruppiert bisher per `o.date`) und **`HomePage.tsx`** ("Meine Aufträge heute/morgen", bisher `o.date === today/tomorrow`): Auftrag erscheint **einmal pro Block** – ein Auftrag mit Blöcken am 10./12./15. taucht an allen drei Tagen jeweils als eigener Eintrag auf. Gruppierung/Filterung läuft künftig über `order_blocks.date` statt `orders.date`.
   - **`CustomerCard.tsx`** (`ActivityRow`, bisher `item.date` als einzelnes Datum): zeigt stattdessen **"N Termine, nächster: TT.MM."** – Anzahl der `order_blocks` des Auftrags plus frühester zukünftiger (oder, falls keiner mehr aussteht, frühester vergangener) Blocktermin.
4. ~~Reihenfolge/Nummerierung der Blöcke in der Anzeige...~~ **Entschieden: erstmal reine Datumsanzeige ohne Zählung**, kein "Tag 2 von 3"-Label.

**Alle 4 Fragen zu dieser Erweiterung sind jetzt entschieden.** Nächster Schritt: vollständige Grep-Bestandsaufnahme aller Stellen, die `orders.date`/`from`/`to`/`assigned` referenzieren, dann Migration + Code-Änderungen (Backend-Collection, `OrderForm`, `listOrdersInRange`, `WeekPage`/`DayBoardPage`/`layoutTimeline`, `OrdersListPage`, `HomePage`, `CustomerCard`) im Detail ausarbeiten.
