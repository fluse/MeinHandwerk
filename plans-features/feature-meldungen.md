Neues Feature:

Ich möchte oben im Header eine Glocke haben, wo jeder sieht, was sich geändert hat, so wie auf Social Media:

Beispiele:
Dir wurde ein Auftrag zugewiesen.
Person x hat einen Auftrag abgeschlossen.

Mitarbeiter x ist auf dem Weg zu Auftrag y

Mitarbeiter hat sich eine Pinnwand eintrag erstellt.

Heute findet das Event x statt.

Mitarbeiter hat sich das Fahrzeug X genommen.

---

## Bestandsaufnahme (was es dafür schon gibt)

- Es gibt **noch keine** `notifications`/Activity-Log-Collection im Backend (`backend/pb_migrations/1783167075_fundament_schema.js`). Am nächsten kommt `order_reads` (wer hat welchen Auftrag "gelesen") – kein generischer Feed, aber ein brauchbares Vorbild für "gelesen/ungelesen pro Nutzer".
- Rollen: `chef`, `buero`, `monteur`, `helfer` (`frontend/src/core/lib/roles.ts`). `chef`/`buero` planen (`canPlanRole`), `monteur`/`helfer` sind eingeschränkt (`isRestrictedRole`). Manche Meldungen sind nur für Chef/Büro sinnvoll (z. B. "Rapport ohne Unterschrift"), andere für alle (z. B. Event heute).
- Header-Komponente: `frontend/src/core/layout/AppLayout.tsx` – die Glocke käme neben Settings/Logout in die `flex items-center gap-3`-Zeile.
- Realtime: Die PocketBase-JS-SDK-Instanz (`frontend/src/core/api/pocketbase.ts`) unterstützt Live-Subscriptions (SSE) pro Collection – bisher ungenutzt, aber genau der Mechanismus, um die Glocke live zu befüllen statt zu pollen.
- Wichtig zur Machbarkeit einzelner Beispiele: "Mitarbeiter x ist auf dem Weg zu Auftrag y" hat aktuell **keine** Entsprechung im Datenmodell. `orders.status` kennt nur `offen`/`erledigt` – ein "unterwegs"-Zustand müsste neu ergänzt werden (siehe offene Fragen unten).

## Vollständige Liste möglicher Meldungen (nach Bereich)

Bereits von dir genannte Beispiele sind markiert mit **(✓ Idee)**. Der Rest leitet sich aus den vorhandenen Entitäten/Statuswechseln im Schema ab.

### Aufträge (`orders`)
- **(✓ Idee)** Dir wurde ein Auftrag zugewiesen → an alle neu in `assigned` aufgenommenen Nutzer.
- **(✓ Idee)** Auftrag wurde von Person X abgeschlossen (`status: offen → erledigt`, `closedBy`) → an Chef/Büro und ggf. an andere zugewiesene Mitarbeiter.
- **(✓ Idee, siehe Konzept unten)** Mitarbeiter X ist auf dem Weg zu Auftrag Y.
- Mitarbeiter X ist angekommen bei Auftrag Y (Ergänzung zur obigen Idee, siehe Konzept unten) → **nur für Chef/Büro sichtbar**, nicht für alle Kolleg:innen.
- Auftrag wurde dir entzogen / du wurdest von einem Auftrag entfernt (Änderung in `assigned`).
- Auftragstermin wurde verschoben (Änderung von `date`/`from`/`to`) → an alle zugewiesenen Mitarbeiter.
- Neuer Auftrag für morgen/heute ohne Zuweisung (`assigned` leer, `date` nah) → Erinnerung an Chef/Büro, damit nichts unbesetzt bleibt.
- Foto zu einem Auftrag hochgeladen (`order_photos`) → an Chef/Büro bzw. andere zugewiesene Mitarbeiter.
- Rapport erstellt/unterschrieben (`rapports`, `rapportSigned = true`) → an Chef/Büro.
- Rapport **ohne** Unterschrift abgeschlossen (`rapportReason` gefüllt) → wichtige Meldung an Chef/Büro, da das oft ein Reklamations-/Nachfrage-Fall ist.
- Auftrag vom Typ `urlaub`/`krank` wurde eingetragen → an Chef/Büro (Personalplanung).

### Pinnwand (`feed_posts`, `feed_comments`)
- **(✓ Idee)** Mitarbeiter hat einen Pinnwand-Eintrag erstellt → an alle (ggf. gefiltert nach Kategorie, s. u.).
- Neuer Kommentar auf einen Post, den du geschrieben oder kommentiert hast (`feed_comments`) → klassisches "Antwort auf deinen Beitrag".
- Dein Post wurde als "gelöst" markiert (`resolved: true`) → an den Autor.
- Ein Post wurde angepinnt (`pinned: true`) → an alle, da meist wichtig (z. B. Sicherheitshinweis).
- Optional/eher niedrige Priorität: Post wurde geliked (`likes`) – auf Social Media üblich, hier evtl. zu "geräuschig"; als spätere Option markieren statt sofort einbauen.

### Events (`events`)
- **(✓ Idee)** Heute findet das Event X statt → Tages-Erinnerung an alle bzw. an RSVP-Zusager.
- Neues Event wurde angelegt → an alle, damit man rechtzeitig zusagen kann.
- Erinnerung X Tage/Stunden vorher (nicht nur "heute") – konfigurierbarer Vorlauf.
- Jemand hat für ein Event zugesagt (`rsvp`) → eher an den Ersteller (`by`), niedrige Priorität.

### Fahrzeuge (`vehicles`)
- **(✓ Idee)** Mitarbeiter hat sich das Fahrzeug X genommen (`assignedTo` gesetzt) → an alle bzw. an Chef/Büro.
- Fahrzeug wurde zurückgegeben (`assignedTo` geleert) → symmetrisch zur "genommen"-Meldung, damit andere wissen, dass es wieder frei ist.

### Team/Projekte (ergänzend, für Chef/Büro)
- Neuer Mitarbeiter wurde angelegt.
- Projekt-Status geändert (`projects.status`: `offen → eingeplant → erledigt`), insbesondere wenn ein Projekt final zu einem Auftrag eingeplant wurde (`scheduledOrder` gesetzt).
- Zeiterfassung fehlt: Mitarbeiter hat für einen vergangenen Arbeitstag noch keinen `timelog`-Eintrag → Erinnerung an den Mitarbeiter selbst bzw. Hinweis an Büro vor Lohnabrechnung.

## Konzept: Mikro-Status statt Zeiterfassung per Formular

Hintergrund: Zeiterfassung läuft heute komplett getrennt vom Auftrag als eigenes Formular (`TimeEntryDialog` in `features/timetracking`), das der Mitarbeiter im Nachhinein von Hand ausfüllt – Arbeitszeit (`von`/`bis`) UND Fahrzeit (`travelVon`/`travelBis`) als Uhrzeiten eintippen. Das ist Aufwand und ungenau (man tippt selten die exakte Minute nach, in der man losgefahren ist).

Deine Idee: statt eines großen Formulars im Nachhinein tippt der Mitarbeiter am Auftrag selbst die tatsächlichen Momente über zwei eigene Buttons an. Aus diesen zwei Zeitstempeln ergibt sich die Fahrzeit automatisch, zeitgenau und ohne zusätzlichen Aufwand für den Mitarbeiter. Die Glocken-Meldung ("X ist auf dem Weg zu Y") fällt dabei quasi als Nebenprodukt ab, nicht als eigener Zusatz-Aufwand.

**Entschieden:** Es gibt zwei separate Buttons statt eines kombinierten Navigations-Buttons:

1. **"Mache mich jetzt auf den Weg zum Kunden"** → setzt sofort den Zeitstempel "unterwegs seit" (unabhängig davon, was im Dialog danach passiert) und löst die Meldung "Mitarbeiter X ist auf dem Weg zu Auftrag Y" an alle aus. Direkt danach öffnet sich der bestehende `MapsAppDialog` ("Navigation öffnen mit") mit den Optionen Google Maps / Apple Maps / Abbrechen ("nein") – der bisherige "Navigation"-Button wird durch diesen Button ersetzt bzw. um das Setzen des Zeitstempels erweitert. Der Zeitstempel bleibt auch bestehen, wenn im Dialog "Abbrechen" gewählt wird – die Navigations-App ist nur ein optionales Extra, das eigentliche Signal ist das Antippen des Buttons selbst.
2. **"Bin jetzt beim Kunden angekommen"** → erscheint, sobald "unterwegs" gesetzt ist, markiert die Ankunftszeit. Löst **nur für Chef/Büro** eine Meldung aus (siehe unten).
3. Aus (unterwegs seit, angekommen um) ergibt sich automatisch `travelVon`/`travelBis`/`travel` für den Zeiterfassungseintrag des Tages – vorausgefüllt, aber im `TimeEntryDialog` weiterhin korrigierbar (kein Zwang, der Automatik blind zu vertrauen, falls z. B. vergessen wurde zu tippen).
4. "Als erledigt melden" (gibt es schon) markiert zusätzlich das Ende der Arbeitszeit (`bis`), sodass am Ende des Tages nur noch die Pause/Korrektur nachgetragen werden muss statt aller Uhrzeiten von Hand.

**Wichtiger Architektur-Punkt:** `orders.status` ist ein einzelnes Feld pro Auftrag, aber `assigned` kann mehrere Mitarbeiter enthalten, die zu unterschiedlichen Zeiten unterwegs/angekommen sein können (jeder fährt für sich los). "Unterwegs"/"Angekommen" kann deshalb **nicht** als dritter Wert von `orders.status` funktionieren – das würde bei mehreren Zugewiesenen nur einen gemeinsamen Status abbilden können, obwohl jeder Mitarbeiter seinen eigenen Zeitstempel braucht. Es braucht stattdessen eine **pro Mitarbeiter geführte** Zwischenspeicherung, analog zum bestehenden `order_reads`-Muster (das ja schon "wer hat wann gelesen" pro Zugewiesenem trackt und in der "LESEBESTÄTIGUNG"-Liste in `OrderCard.tsx` pro Person angezeigt wird).

Konkreter Vorschlag: neue Collection, z. B. `order_checkins` (`order` relation, `employee` relation, `type`: `unterwegs`/`angekommen`, `at`: Zeitstempel) – ein Eintrag pro Tap. Vorteile:
- Jeder Tap ist gleichzeitig der Auslöser für eine Meldung (Insert in dieser Collection → Notification erzeugen).
- Die Zeitstempel lassen sich beim Öffnen des Zeiterfassungs-Dialogs für den betreffenden Tag/Auftrag automatisch in `travelVon`/`travelBis` vorbefüllen.
- Die UI kann, genau wie die bestehende Lesebestätigungs-Liste, pro zugewiesenem Mitarbeiter anzeigen: "unterwegs seit 13:42", "angekommen um 14:05".

**Entschieden – Fallback bei vergessener Ankunftsmeldung:** Falls "Mache mich jetzt auf den Weg" getippt wurde, aber noch kein Ankunfts-Zeitstempel vorliegt, zeigt die App auf der Auftragsseite einen Dialog "Bist du bereits beim Kunden angekommen?", der den Mitarbeiter aktiv zur fehlenden Bestätigung auffordert (statt `travelBis` stillschweigend leer zu lassen). Der Dialog ist **wegklickbar**, taucht aber bei jedem erneuten Aufruf/Öffnen der Auftragsseite **wieder auf**, solange die Ankunft nicht bestätigt wurde – so verschwindet die Erinnerung nicht dauerhaft, ohne den Mitarbeiter zu zwingen, sofort zu antworten.

## Offene Fragen, die den weiteren Plan beeinflussen

1. ~~Mikro-Status-Detailfrage: Feinschliff des Fallback-Dialogs~~ **Geklärt:** wegklickbar, erscheint aber bei jedem erneuten Seitenaufruf wieder, bis die Ankunft bestätigt ist.
2. **Zielgruppe pro Meldungstyp**: Manche Meldungen sind für alle relevant (Event heute, Fahrzeug genommen, "ist unterwegs"), andere nur für die `chef`+`buero`-Gruppe (Ankunft, Rapport ohne Unterschrift, Urlaub/Krank-Eintrag) – **geklärt:** einheitlich `chef`+`buero` zusammen, analog zur `CHEF_OR_BUERO`-Gruppe, die im Schema durchgängig für Admin-Rechte verwendet wird. Weiterhin offen: Soll die Zielgruppe pro Typ fest verdrahtet sein, oder soll jeder Nutzer Kategorien in den Einstellungen ein-/ausschalten können?
3. **Speicherung – geklärt: echte Collection.** Neue Collection `notifications` (Felder z. B. `recipient` (relation→users), `type`, `message`, `relatedRecord`/Deep-Link, `read` (bool) oder `readAt`) plus PocketBase-Realtime-Subscription für Live-Updates in der Glocke. Das erlaubt Verlauf, Gelesen-Status und serverseitiges Filtern nach Rolle. Folgt daraus: die Einträge müssen serverseitig per `pb_hooks` bei jedem relevanten Create/Update der Quell-Collection erzeugt werden (z. B. Hook auf `orders`-Update für "zugewiesen"/"abgeschlossen", Hook auf `order_checkins`-Create für "unterwegs"/"angekommen", Hook auf `feed_posts`-Create für Pinnwand, etc.) – analog zu den bestehenden Hooks in `backend/pb_hooks/` (z. B. `geocode_customer.pb.js`). Für "an mehrere Empfänger" (z. B. Rapport ohne Unterschrift an Chef+Büro) legt der Hook pro Empfänger einen eigenen `notifications`-Datensatz an, damit jeder seinen eigenen Gelesen-Status hat.
4. **Anzeige – geklärt.** Die Glocke selbst zeigt nur **ungelesene** Meldungen (Dropdown/Badge im Header). Für die Historie gibt es einen Link/Punkt in der Glocke, der auf eine eigene Seite führt, die **alle** Meldungen (gelesen + ungelesen) mit Filtermöglichkeiten (z. B. nach Typ, Zeitraum) auflistet. Technische Folge: die Glocken-Abfrage filtert serverseitig auf `read = false`, die Historie-Seite paginiert über die komplette `notifications`-Collection. **Entschieden – manuelles Aufräumen statt Automatik:** Kein automatisches Löschen/Cron-Job. Stattdessen bekommt der Chef in den Einstellungen einen neuen Tab (z. B. "Meldungen"), über den er selbst entscheiden kann, wann und dass Meldungen gelöscht werden ("jetzt aufräumen"-Aktion). Vorteil: kein Backend-Scheduler nötig, volle Kontrolle beim Chef, kein Risiko, dass etwas automatisch verschwindet, das noch gebraucht wird. Kleines Detail, das beim Umsetzen noch festzulegen ist: was genau die Aktion löscht (alle Meldungen, nur gelesene, oder alle vor einem wählbaren Datum).

Sag mir, wie du zu 1.–4. stehst (insbesondere ob ich direkt mit einer `notifications`-Collection + `pb_hooks` starten soll), dann baue ich darauf den Umsetzungsplan (Datenmodell, Hooks, Frontend-Komponente) weiter aus.
