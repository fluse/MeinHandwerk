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

`order_checkins.type` um `'arbeit_begonnen'` und `'verlassen'` erweitern (gleiche Collection, gleiches Muster wie `unterwegs`/`angekommen` – pro Mitarbeiter, unveränderlich, ein Eintrag pro Tap):

1. `unterwegs` (bestehend)
2. `angekommen` (bestehend)
3. `arbeit_begonnen` **(neu)** – Button "Arbeit jetzt beginnen", erscheint sobald der Mitarbeiter selbst "angekommen" gesetzt hat und noch kein eigener `arbeit_begonnen`-Checkin existiert.
4. Auftrag als erledigt melden (bestehend, `CompleteOrderDialog`) – inhaltlich Schritt 5+6 deiner Liste.
5. `verlassen` **(neu)** – Button "Auftragsort jetzt verlassen", erscheint erst nachdem der Mitarbeiter `arbeit_begonnen` gesetzt hat.

Wichtig, analog zur bestehenden Begründung für `unterwegs`/`angekommen`: Ein Auftrag kann mehrere zugewiesene Mitarbeiter haben, die nicht synchron loslegen oder aufhören – deshalb auch hier **pro Mitarbeiter** und nicht als neuer Wert von `orders.status`. Ein optionales Badge "in Arbeit" am Auftrag lässt sich rein im Frontend ableiten (sobald mind. 1 Mitarbeiter `arbeit_begonnen` hat und der Auftrag noch `offen` ist) – dafür wäre kein neues Feld nötig.

### 2. Fahrzeugposition automatisch bei "angekommen" aktualisieren

Wenn ein Mitarbeiter, dem aktuell ein Fahrzeug zugeordnet ist (`vehicles.assignedTo === employeeId`), den `angekommen`-Checkin auslöst – **egal ob über den direkten Button oder über die Bestätigung im Fallback-Dialog "Bist du am Auftragsort angekommen?"** – wird automatisch:

1. `navigator.geolocation.getCurrentPosition` abgefragt (gleiches Muster wie `VehicleCard.tsx`s "Meinen Standort verwenden"),
2. bei Erfolg `updateVehicleLocation(vehicleId, { address: order.address, lat, lng })` aufgerufen,
3. bei Ablehnung/Fehler der Geolocation **kein Fehlerdialog** – der Checkin selbst wird trotzdem gesetzt (das Ankunfts-Signal ist wichtiger als die Fahrzeugposition, analog zur bestehenden Entscheidung, dass der "unterwegs"-Zeitstempel unabhängig vom Maps-Dialog gesetzt wird). Optional könnte man als Fallback wenigstens `address: order.address` ohne `lat`/`lng` setzen – siehe offene Frage 3.

Kein zusätzlicher Button nötig – die Positionsaktualisierung läuft transparent als Nebeneffekt des ohnehin nötigen "Angekommen"-Taps mit.

### 3. Neuer Dialog "Fahrzeug freigeben"

Neue Komponente (Arbeitstitel `ReleaseVehicleDialog`), aufgebaut wie `MapsAppDialog.tsx` (Liste von Optionen statt Ja/Nein), ersetzt den direkten `assign.mutate({ userId: null })`-Klick in `VehicleCard.tsx`:

- **"Adresse eingeben"** → zeigt das vorhandene Adress-Eingabefeld + geocodiert via `geocodeAddress()`, setzt Standort und gibt danach frei.
- **"Aktuellen Standort verwenden"** → `navigator.geolocation`, setzt Standort und gibt danach frei.
- **"Bestehenden Ort beibehalten"** → gibt nur `assignedTo` frei, Standortfelder bleiben unverändert.
- **"Abbrechen"** → schließt den Dialog ohne Änderung (wie bei `MapsAppDialog`).

Technisch: erst `updateVehicleLocation` (falls Option 1/2), danach `assignVehicle(id, null)` – beides über die schon vorhandenen Mutations-Hooks.

### 4. Datenmodell-Änderungen

- Neue Migration in `backend/pb_migrations/`: `order_checkins.type`-SelectField um `'arbeit_begonnen'` und `'verlassen'` erweitern (bestehende Collection ändern, nicht neu anlegen).
- Keine neuen Felder auf `vehicles` nötig – `address`/`lat`/`lng`/`locationUpdatedAt` decken alles ab.
- Optional neue `notifications.type`-Werte `order_work_started`/`order_left`, analog zu `order_enroute`/`order_arrived` in `notifications_orders.pb.js` – siehe offene Frage 5.

## Offene Fragen, die den weiteren Plan beeinflussen

1. **Sind "Arbeit beginnen" und "Auftragsort verlassen" wirklich pro Mitarbeiter sinnvoll**, oder reicht dir ein einziger gemeinsamer Zeitpunkt pro Auftrag (dann bräuchte es eine Sonderregel, *wer* diesen Tap stellvertretend für alle auslösen darf, z. B. nur der Erstankommende)?
2. **Soll "Als erledigt melden" weiterhin Schritt 5+6 (Arbeit fertig + Rapport) abdecken** wie heute schon umgesetzt, oder meintest du damit etwas zusätzliches, das noch fehlt?
3. **Fallback, falls Geolocation bei "angekommen" abgelehnt wird**: gar nichts tun (Standort bleibt wie zuletzt bekannt), oder wenigstens `address = order.address` ohne Koordinaten setzen?
4. **Soll "Auftragsort verlassen" zwingend erst nach "Als erledigt melden" möglich sein**, oder unabhängig davon (z. B. falls jemand den Ort schon verlässt, während ein Kollege noch den Rapport ausfüllt)?
5. **Sollen `arbeit_begonnen`/`verlassen` auch neue Glocken-Meldungen auslösen** (an alle bzw. nur Chef/Büro, analog zu `order_enroute`/`order_arrived`), oder reicht dir vorerst nur die reine Datenerfassung ohne neue Meldungstypen?
6. **Soll die Fahrzeugposition auch beim "Verlassen"-Checkin irgendwie reagieren** (z. B. zurück auf "unterwegs" markieren), oder bleibt die automatische Standort-Aktualisierung ausschließlich an "angekommen" gekoppelt?

Sag mir, wie du zu 1.–6. stehst, dann baue ich darauf den Umsetzungsplan (Migration, Hooks, Frontend-Komponenten) weiter aus.
