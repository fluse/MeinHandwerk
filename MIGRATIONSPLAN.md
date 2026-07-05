# Überführungsplan: Handwerkerkalender-Vorlage → React/PocketBase-Stack

## Kontext

`vorlage/Handwerkerkalender.jsx` (+ `.html`) ist ein funktionierender, aber reiner Client-Prototyp für die Einsatzplanung von "Hahn Energie & Bau": Wochenkalender, Team/Rollen, Aufträge, Kunden (CRM), Projekte (Taifun-Import), Zeiterfassung, Arbeitsrapporte, Pinnwand und Events – alles in einer ~2000-Zeilen-Datei, ohne Router, ohne Backend (nur `localStorage`/In-Memory), ohne echte Nutzerkonten (geteilter Zugangscode + Namens-Auswahl), Fotos/Signaturen als Base64 direkt im JSON.

Ziel: dieselbe Funktionalität schrittweise in den bereits aufgesetzten Stack überführen (React+TS+Vite, Tailwind, TanStack Query, React Router, PocketBase, Zod/RHF), gemäß der in `AGENTS.md` festgelegten Architektur (features/ + core/ Trennung, PocketBase Auth, TanStack Query, Zod-Validierung). Dies ist ein **Plan**, keine Implementierung – Umsetzung erfolgt danach phasenweise.

## Bewusste Abweichungen von der Vorlage (nicht 1:1 portieren)

- **Auth**: Der geteilte Zugangscode + Leitungs-PIN + "tippe deinen Namen an" entfällt. Gemäß `AGENTS.md` ("Authentication is handled exclusively via PocketBase Auth") bekommt jedes Teammitglied einen echten PocketBase-`users`-Account (E-Mail+Passwort) mit einem `role`-Feld (`chef|buero|monteur|helfer`). `identity` wird schlicht `pb.authStore.record`.
- **Fotos/Signaturen**: statt Base64-Strings im JSON → echte PocketBase-File-Felder (Upload-Endpoint, Größenlimit, kein `localStorage`-Quota-Risiko mehr).
- **Persistenz**: der `store`/`loadJSON`/`saveJSON`-Mock wird komplett durch TanStack-Query-Hooks ersetzt, die PocketBase-Collections lesen/schreiben. Die "shared vs. private key"-Unterscheidung der Vorlage entfällt, weil PocketBase-Collections ohnehin geteilt/serverseitig sind; geräte-lokale Dinge (z. B. "zuletzt gesehen"-Zeitstempel für Badges) bleiben `localStorage`.
- **Navigation**: der `view`-State-Machine + "from"-Stack wird durch echtes React-Router-Routing ersetzt (Deep-Links, Browser-Back funktioniert wieder).
- **`window.confirm()`**: wird durch eine einheitliche Confirm-Dialog-Komponente in `core/components` ersetzt.

## 1. PocketBase-Datenmodell (Migrations in `backend/pb_migrations`)

| Collection | Kernfelder | Hinweise |
|---|---|---|
| `users` (built-in) | + `role` (select: chef/buero/monteur/helfer), `phone` (text) | Login-Fix per AGENTS.md; `role` steuert `canPlan` |
| `orders` | title, trade (select), date, from, to, client, phone, address, material, desc, note, assigned (relation→users, multi), status (select: offen/erledigt), project (relation→projects, optional), closedBy (relation→users), closedAt, rapportSigned (bool), rapportReason | ersetzt `Order` |
| `order_reads` | order (relation), user (relation), readAt | ersetzt `reads: {name: ts}` als eigene Tabelle statt JSON-Map |
| `order_photos` | order (relation), file (file), uploadedBy (relation→users) | ersetzt `photos:<id>` |
| `rapports` | order (relation), author (relation→users), text, signature (file), signedName, date | ersetzt `rapports:<id>` |
| `rapport_materials` | rapport (relation), qty, unit, desc | ersetzt `materials[]` |
| `timelog` | employee (relation→users), date, von, bis, hours (number), travelVon, travelBis, travel (number), order (relation, optional), note | 1:1 |
| `customers` | kdnr, name, contact, street, zip, city, phone, email, notes, source | 1:1 |
| `projects` | projnr, title, client, street, zip, city, phone, value (number), date, desc, status (select: offen/eingeplant/erledigt), scheduledOrder (relation→orders, optional) | 1:1 |
| `feed_posts` | author (relation→users), text, category (select), image (file, optional), pinned (bool), resolved (bool), likes (relation→users, multi) | ersetzt `feed`+`feedimg:<id>` |
| `feed_comments` | post (relation), author (relation→users), text | ersetzt `comments[]` |
| `events` | title, type (select), date, time, location, desc, by (relation→users), rsvp (relation→users, multi) | 1:1 |

API-Rules pro Collection so setzen, dass: Team/Projekte/Kunden/Events-Schreibzugriff nur `role="chef"||role="buero"`; eigene Zeiten/Rapporte nur vom Ersteller oder Chef/Büro änderbar; Aufträge von zugewiesenen Monteuren nur für Status/Foto/Zeit/Rapport-Zusatz, nicht für Stammdaten editierbar (`@request.auth.role` bzw. `assigned.id ?= @request.auth.id` in den Rules).

## 2. Design-Tokens (Tailwind v4 `@theme` in `src/index.css`)

Die Farbkonstanten `C`, `ROLES[k].dot`, `TRADES`, `STATUS`, `PSTATUS`, `CATS`, `ETYPES` aus der Vorlage werden 1:1 als CSS-Variablen/Tailwind-Farbtokens übernommen (z. B. `--color-sage`, `--color-sage-deep`, `--color-trade-heizung`, `--color-status-erledigt-fg/bg`, …), damit Komponenten `bg-trade-heizung`/`text-status-offen-fg` nutzen können statt Inline-Styles. Rollen-Icons/Logo (aktuell Base64 in der Vorlage) werden als echte Dateien unter `frontend/src/assets/` abgelegt.

## 3. Gemeinsame Utilities → `frontend/src/core/lib/`

Reine Funktionen aus der Vorlage werden mit Typen versehen, unverändert in ihrer Logik übernommen (Kernrisiko: ISO-Wochenberechnung, Nacht-Überlauf bei Zeiten, Lane-Algorithmus):

- `date.ts`: `mondayOf`, `addDays`, `iso`, `todayISO`, `kw` (ISO-8601-Woche), `fmtShort`, `fmtLong`
- `time.ts`: `hoursBetween` (inkl. Mitternachts-Wrap), `blockOf`, `BLOCKS`, `WD`
- `format.ts`: `surname`, `shortAddr`, `waNum`, `orderMsg`
- `image.ts`: `compressImage` (Canvas-Resize vor Upload)
- `csv.ts`: `parseCSV`, `downloadCSV`
- `calendarLayout.ts`: der Lane-Zuweisungs-/Cluster-Algorithmus aus der Tagesansicht (Zeile ~892–930 der Vorlage)

Für `kw`, `hoursBetween` und den Lane-Algorithmus: kleine Unit-Tests ergänzen, da hier Off-by-one-Fehler leicht passieren und die Vorlage keine Tests hat.

## 4. Feature-Zuschnitt & Routing

Jede Feature bekommt `api/` (PocketBase-Query/Mutation-Funktionen), `hooks/` (TanStack Query), `components/`, `types/`, `pages/` – analog zum bestehenden `features/auth`. Features importieren sich laut `AGENTS.md` nicht gegenseitig; Verknüpfungen (z. B. "Projekt → Auftrag anlegen") laufen über Routing-Parameter + eigene PocketBase-Relations, nicht über React-Imports zwischen Features.

| Feature | Ersetzt Views der Vorlage | Kern-Routen |
|---|---|---|
| `features/team` | `team` | `/team` (chef/büro) |
| `features/scheduling` | `week`, `empweek`, `day`, `form` (Order), Notify-Sheet | `/`, `/week/:userId`, `/week/:userId/:date`, `/orders/new`, `/orders/:id/edit` |
| `features/customers` | `kunden`, `kundeForm` | `/customers`, `/customers/new`, `/customers/:id/edit` |
| `features/projects` | `projekte`, `projektForm` | `/projects`, `/projects/new`, `/projects/:id/edit` |
| `features/pinboard` | `pinboard` | `/pinboard` |
| `features/events` | `events` | `/events` |
| `features/timetracking` | `zeiten`, `rapportForm` | `/timetracking`, `/orders/:id/rapport/new` |
| `features/import` | `import` (CSV/XLSX) | `/customers/import`, `/projects/import` |

`AppLayout`/Bottom-Nav (bereits als `core/layout/AppLayout.tsx` vorhanden) bekommt die 6 Haupt-Tabs (`week`, `projects`, `timetracking`, `customers`, `pinboard`, `events`), analog zu `TABS`/`NAVMAP` der Vorlage. Ein `RoleRoute`-Guard (Erweiterung von `routes/ProtectedRoute.tsx`) sperrt chef/büro-only-Routen (Team, Projekte, Kunden, Zeiten-Gesamtübersicht) für `monteur`/`helfer`.

## 5. Umsetzungsreihenfolge (Phasen)

1. **Fundament**: PocketBase-Migrations (Abschnitt 1), Tailwind-Theme (Abschnitt 2), `core/lib`-Utilities (Abschnitt 3), `useAuth` um `role`/`canPlan`/`restricted` erweitern.
2. **Team** (`features/team`): Rollen-Verwaltung, Rollen-Icons/-Dots als `core/components`.
3. **Scheduling** (`features/scheduling`) – Herzstück: Wochenraster, Mitarbeiter-Wochenansicht, Tagesansicht mit Lane-Algorithmus + Drag-Resize, Auftragsformular, `OrderCard` mit Foto-Upload (PocketBase-File), Status-/Rapport-Pflicht-Flow, Lesebestätigungen, Benachrichtigung (WhatsApp/SMS/E-Mail-Links via `orderMsg`/`waNum`).
4. **Kunden & Projekte** (`features/customers`, `features/projects`): CRUD + "Projekt in Kalender einplanen"-Fluss (Route-Parameter + `project`-Relation auf `orders`).
5. **Pinnwand & Events** (`features/pinboard`, `features/events`): eigenständige CRUD-/Social-Feed-Features.
6. **Zeiterfassung & Arbeitsrapport** (`features/timetracking`): Monatsübersicht (eigene vs. Chef/Büro-Gesamtsicht), CSV-Export, `SignaturePad`, Rapport-CRUD.
7. **Import-Tool** (`features/import`): CSV/XLSX-Bulk-Import für Kunden/Projekte (benötigt `xlsx`-Paket → vorher Freigabe einholen, siehe `AGENTS.md` "No Third-Party Packages").
8. **Politur/Stretch**: PocketBase-Realtime-Subscriptions statt manuellem Polling für Benachrichtigungs-/Pinnwand-Badges, einheitlicher Confirm-Dialog statt `window.confirm`, Accessibility-Pass.

Jede Phase wird einzeln umgesetzt und gegen die weiterhin lauffähige `vorlage/Handwerkerkalender.html` (läuft standalone im Browser ohne Build) als Verhaltens-Referenz geprüft, bevor die nächste Phase startet.

## 6. Verifikation

- Nach jeder Phase: `npm run lint` + `npm run build` im Frontend, PocketBase-Migrations lokal gegen den `docker compose up -d pocketbase`-Service anwenden.
- Manuelles Durchklicken des jeweiligen Feature-Flows im Dev-Server (`npm run dev`) gegen die Vorlage (`vorlage/Handwerkerkalender.html` direkt im Browser geöffnet) als Referenzverhalten, inkl. Rand- und Rollen-Fälle (chef/büro vs. monteur/helfer, "chef-hidden"-Filterung).
- Für die risikoreichen reinen Funktionen (`kw`, `hoursBetween`, Lane-Algorithmus) gezielte Unit-Tests statt nur manueller Prüfung.
