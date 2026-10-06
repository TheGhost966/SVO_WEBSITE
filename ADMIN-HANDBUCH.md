# SVÖ Website — Handbuch für die Redaktion

Anleitung für den Admin-Bereich der Website. Für Redaktion, Vorstand und Administration.

Kurz gesagt: **Sie füllen Felder aus, wählen einen Status und drücken „Speichern“.** Was auf der
Website steht, entscheidet allein das Feld **Status**.

---

## 1. Anmelden

Admin-Bereich: **`https://[domain]/admin`**

Anmelden mit E-Mail-Adresse und Passwort. Das Passwort ändern Sie unter **Konto** (Kreis oben
rechts).

**Sprache des Admin-Bereichs** (Deutsch, Arabisch, Englisch): Der Admin-Bereich folgt dem
**Sprachumschalter** oben in der Kopfzeile. Wer dort „العربية“ wählt, bearbeitet die arabischen
Inhalte *und* sieht Schaltflächen, Feldnamen und Hilfetexte auf Arabisch, von rechts nach links.
Wer die Oberfläche in einer anderen Sprache haben möchte als die Inhalte, stellt sie unter
**Konto** ein — das gilt, bis der Sprachumschalter das nächste Mal benutzt wird.
Dieses Handbuch verwendet die deutschen Bezeichnungen.

### Das erste Administrator-Konto

Es wird **nicht im Browser** angelegt, sondern einmalig von der Entwicklung bei der Einrichtung
der Website:

```
npm run create-admin
```

(E-Mail, Passwort mit mindestens 12 Zeichen und Name werden dabei abgefragt bzw. über
`CREATE_ADMIN_EMAIL`, `CREATE_ADMIN_PASSWORD`, `CREATE_ADMIN_NAME` übergeben; siehe `README.md`,
Abschnitt „Deployment“.) Der Befehl wirkt nur, solange es noch gar kein Konto gibt. Auf der
Live-Website ist die Registrierung über den Browser absichtlich gesperrt — sonst könnte sich auf
einer frisch aufgesetzten Website jede beliebige Person als erste:r Administrator:in eintragen.

Alle weiteren Konten legt ein:e Administrator:in unter **Einstellungen → Benutzer:innen** an.

**Es muss immer mindestens ein Administrator-Konto geben.** Das letzte lässt sich nicht löschen.
Wer es ersetzen will, gibt zuerst einer anderen Person die Rolle *Administrator* und löscht dann
das alte Konto. Empfehlung: zwei Administrator-Konten, damit bei einem vergessenen Passwort
niemand ausgesperrt ist.

---

## 2. Rollen — wer darf was

| | Redaktion (editor) | Vorstand (board) | Administration (admin) | Betrachter:in (viewer) |
|---|:---:|:---:|:---:|:---:|
| Inhalte anlegen und als Entwurf bearbeiten | ✅ | ✅ | ✅ | – |
| Zur Überprüfung einreichen | ✅ | ✅ | ✅ | – |
| **Veröffentlichen und archivieren** | ❌ | ✅ | ✅ | – |
| **Veröffentlichte oder archivierte Inhalte ändern** | ❌ | ✅ | ✅ | – |
| Frühere Version wiederherstellen | nur bei Entwürfen | ✅ | ✅ | – |
| Bilder hochladen und bearbeiten | ✅ | ✅ | ✅ | – |
| Bilder und Vorstandsmitglieder **löschen** | ❌ | ✅ | ✅ | – |
| Kategorien, Guide-Themen, Schwerpunkte ändern | ❌ (nur auswählen) | ✅ | ✅ | – |
| Vorstand und Partner bearbeiten | ✅ | ✅ | ✅ | – |
| Kontaktanfragen lesen und bearbeiten | ✅ | ✅ | ✅ | ❌ |
| Website-Einstellungen ändern | ❌ (nur lesen) | ✅ | ✅ | – |
| Inhalte löschen (News, Veranstaltungen, …), Partner löschen | ❌ | ❌ | ✅ | – |
| Benutzer:innen verwalten | ❌ | ❌ | ✅ | – |

Betrachter:innen können sich anmelden und veröffentlichte Inhalte ansehen, aber nichts ändern.
Jede Person sieht unter „Benutzer:innen“ nur ihr eigenes Konto; nur die Administration sieht alle.

**Wichtig für die Redaktion:**

- Sie können **nichts selbst veröffentlichen**. Im Feld *Status* stehen Ihnen nur „Entwurf“ und
  „Zur Überprüfung eingereicht“ zur Auswahl.
- Sobald ein Eintrag **veröffentlicht oder archiviert** ist, können Sie ihn **nicht mehr
  ändern**: Das Formular ist dann grau und hat keinen Speichern-Knopf. Das ist Absicht — sonst
  ginge eine Änderung ohne Prüfung online. Ist eine Korrektur nötig, bitten Sie den Vorstand
  darum (er kann den Eintrag selbst ändern oder für Sie auf „Entwurf“ zurücksetzen; solange er
  auf „Entwurf“ steht, ist er nicht auf der Website).
- Versuchen Sie, eine alte Version eines veröffentlichten Eintrags wiederherzustellen, erscheint
  die Meldung, dass das nur Vorstand oder Administration können.

---

## 3. Die Startseite des Admin-Bereichs

Nach dem Anmelden sehen Sie eine Übersicht mit diesen Kästen:

- **Wartet auf Freigabe** — alles, was die Redaktion eingereicht hat, das älteste zuerst.
  Für den Vorstand ist das die Aufgabenliste: *Öffnen*, prüfen, Status setzen. Die Redaktion sieht
  hier, was noch nicht freigegeben ist.
- **Prüfung überfällig** — veröffentlichte Guide-Artikel und Wegweiser, deren Prüfintervall
  abgelaufen ist. Diese Texte beschreiben Behördenwege und stehen mit „Stand: …“ auf der
  Website. Inhalt prüfen, dann im Reiter *Einstellungen* das Feld **Zuletzt geprüft am** neu
  setzen — damit verschwindet der Eintrag aus der Liste.
- **Was noch fehlt** — Bereiche der Website, die noch keinen veröffentlichten Inhalt haben. Die
  Startseite der Website blendet leere Abschnitte aus.
- **Wo erscheint was?** — welcher Inhaltstyp welche Seite der Website füllt.
- **Der Ablauf** und **Gut zu wissen** — die Kurzfassung dieses Handbuchs.

---

## 4. Das Menü links

Geordnet danach, wie oft man etwas braucht:

**Inhalte**
- **News** — Artikel für „Nachrichten“.
- **Veranstaltungen** — Termine; vergangene wandern von selbst zu „Vergangene“.
- **Guide-Artikel** — die Texte des Österreich-Guides, je einem Thema zugeordnet.
- **Wegweiser** — Schritt-für-Schritt-Anleitungen („Anleitungen“ auf der Website).
- **Stellenangebote** — verschwinden nach dem Ablaufdatum von selbst.
- **Expert:innen** — das Verzeichnis. Anträge aus dem Formular der Website landen hier.
- **Leistungen** — Angebote des Vereins, je einem Schwerpunkt zugeordnet.
- **Seiten** — derzeit eine: die Seite „Über uns“ (siehe 9).
- **Mediathek** — Bilder und Dateien.

**Anfragen**
- **Kontaktanfragen** — Nachrichten aus dem Kontaktformular.

**Struktur** *(nur Vorstand und Administration)*
- **Kategorien**, **Guide-Themen**, **Schwerpunkte** — die Ordnung der Website. Änderungen hier
  sind **sofort** online, es gibt keinen Prüfschritt.

**Verein**
- **Vorstand**, **Partner & Förderer**.

**Einstellungen**
- **Benutzer:innen** und **Website-Einstellungen**.

Das **Menü der Website** (Kopf- und Fußzeile) wird nicht im Admin-Bereich bearbeitet; es ist fest
eingebaut. Änderungswünsche bitte an die Entwicklung.

---

## 5. Einen Inhalt anlegen und veröffentlichen

1. Links den Bereich wählen, dann **Neu erstellen**.
2. Felder ausfüllen. Unter jedem Feld steht, wofür es gut ist. Lange Formulare haben oben
   **Reiter**:
   - **Inhalt** — Titel, Text, Bild.
   - **SEO** — Angaben für Suchmaschinen. Kann leer bleiben.
   - **Einstellungen** — Web-Adresse (Slug), Datum, Zuordnungen.
3. Rechts in der Seitenleiste den **Status** wählen (siehe unten).
4. **Speichern** (oben rechts). Es gibt genau einen Speichern-Knopf.

### Der Status

| Status | Bedeutung | Wer darf ihn setzen |
|---|---|---|
| **Entwurf** | In Arbeit, nicht auf der Website. | alle |
| **Zur Überprüfung eingereicht** | Fertig aus Sicht der Redaktion. **Der Vorstand bekommt automatisch eine E-Mail** mit einem Link zum Eintrag, und der Eintrag erscheint unter „Wartet auf Freigabe“. | alle |
| **Veröffentlicht** | Steht auf der Website. | Vorstand, Administration |
| **Archiviert** | Nicht mehr auf der Website, aber nicht gelöscht. | Vorstand, Administration |

- **Speichern wirkt sofort.** Ein veröffentlichter Eintrag, den der Vorstand ändert und
  speichert, ist nach wenigen Sekunden in der neuen Fassung online — auf Deutsch, Arabisch und
  Englisch. Es gibt kein „Änderungen vormerken“: Wer an einem veröffentlichten Text länger
  arbeiten will, setzt ihn so lange auf *Entwurf* (dann ist er offline) oder bereitet den Text
  außerhalb vor.
- **Archivieren oder auf Entwurf zurücksetzen** nimmt den Eintrag sofort von der Website; seine
  Adresse zeigt dann „Seite nicht gefunden“.
- **Zurück an die Redaktion:** Der Vorstand setzt den Status von „Zur Überprüfung“ wieder auf
  „Entwurf“ und sagt der Person Bescheid — eine Kommentarfunktion gibt es nicht.
- Auch ein Entwurf muss die **Pflichtfelder** (mit Stern) ausgefüllt haben, sonst lässt er sich
  nicht speichern.

### Die Web-Adresse (Slug)

Im Reiter *Einstellungen*. Nur Kleinbuchstaben, Ziffern und Bindestriche, z. B.
`deutschkurs-wien`. Sie wird nicht automatisch aus dem Titel gebildet. **Nach der
Veröffentlichung nicht mehr ändern** — alte Links führen sonst ins Leere.

### Versionen

Jedes Speichern legt eine Version an. Über **Versionen** (oben am Eintrag) lässt sich eine
frühere Fassung ansehen und wiederherstellen. Die Liste zeigt Datum und Uhrzeit. Bei
veröffentlichten Einträgen kann nur der Vorstand oder die Administration wiederherstellen — und
die wiederhergestellte Fassung ist sofort online.

### „Wird gerade bearbeitet“

Öffnen zwei Personen denselben Eintrag, erscheint ein Hinweis, dass ihn jemand bearbeitet. Der
Hinweis kann noch einige Minuten stehen bleiben, nachdem die andere Person den Eintrag verlassen
hat. Mit „Übernehmen“ können Sie weiterarbeiten.

---

## 6. Mehrsprachige Inhalte

Die Website gibt es auf Deutsch, Arabisch und Englisch. Oben im Formular steht der
**Sprachumschalter** („Locale“). Texte wie Titel und Inhalt hat jede Sprache für sich: Sprache
wählen, Text eintragen, speichern, nächste Sprache wählen. Es wird nichts automatisch übersetzt.

- **Fehlt eine Übersetzung**, zeigt die Website den deutschen Text mit dem Hinweis, dass er in
  dieser Sprache nicht verfügbar ist. Es bleibt nie eine Seite leer.
- **Ausnahme Startseite:** Die Texte unter *Website-Einstellungen → Startseite* fallen nicht auf
  Deutsch zurück. Ein leeres Feld zeigt den eingebauten Text der jeweiligen Sprache (siehe 8).
- Nicht übersetzt werden: Namen von Personen, Web-Adressen (Slugs), Daten, Zuordnungen, Status.

---

## 7. Bilder

Hochladen unter **Inhalte → Mediathek** oder direkt im Bild-Feld eines Eintrags. Zwei Dinge sind
wichtig:

- **Alt-Text** — Pflicht, für jede Sprache einzeln. Beschreibt in ein bis zwei Sätzen, was zu
  sehen ist (für Screenreader und Suchmaschinen). Ohne Alt-Text lässt sich das Bild nicht
  speichern.
- **Einwilligung liegt vor** — bei Fotos mit erkennbaren Personen muss eine schriftliche
  Einwilligung vorliegen, *bevor* das Foto hochgeladen wird. Das Kästchen ist nur ein Vermerk,
  kein Ersatz für die Einwilligung.

Löschen können Bilder nur Vorstand und Administration. Ein Bild, das noch in einem Eintrag
verwendet wird, vorher dort entfernen.

---

## 8. Website-Einstellungen

*Einstellungen → Website-Einstellungen* (ändern: Vorstand und Administration). Fünf Reiter:

- **Allgemein** — Logo, Name, Kontaktdaten, Social-Media-Links (Fußzeile, Kontaktseite).
- **Startseite** — Texte und Reihenfolge der Startseite:
  - Alle Felder sind freiwillig. **Leer = der eingebaute Text der jeweiligen Sprache.** Ein
    deutscher Text ersetzt den arabischen oder englischen nicht; wer die Startseite in allen
    Sprachen ändern will, füllt das Feld in allen drei Sprachen aus.
  - **Reihenfolge der Abschnitte:** leer lassen für die Standardreihenfolge. **Achtung:** Sobald
    dort Zeilen stehen, zeigt die Startseite *nur* die aufgeführten Abschnitte.
  - **CTA-Band:** Überschrift *und* Button-Text müssen ausgefüllt sein; dann ersetzt das Band die
    beiden eingebauten Karten „Ehrenamt“ und „Idee“. Nur eine Überschrift allein ändert nichts.
- **Stellenangebote** — Links zu AMS, karriere.at usw. auf der Stellenseite.
- **SEO** — Standardtitel und -beschreibung für Suchmaschinen.
- **Einstellungen** — an welche Adressen die Benachrichtigung „zur Überprüfung eingereicht“
  geht, und nach wie vielen Monaten Kontaktanfragen und nie veröffentlichte Expert:innen-Anträge
  gelöscht werden (DSGVO).

Änderungen sind nach dem Speichern innerhalb weniger Sekunden auf der Website.

---

## 9. Besonderheiten einzelner Bereiche

**Seite „Über uns“.** Unter *Inhalte → Seiten* eine Seite mit dem Slug **`about`** anlegen (genau
so, in jeder Sprache), im Feld *Seiteninhalt* mindestens einen Block hinzufügen, veröffentlichen.
Der Seiteninhalt wird für jede Sprache einzeln angelegt. Solange es keinen Block gibt, steht auf
der Website nur „Diese Seite wird gerade vorbereitet“.

**Guide-Artikel und Wegweiser.** Im Reiter *Einstellungen* stehen **Zuletzt geprüft am** und
**Prüfintervall (Monate)**. Nach Ablauf erscheint der Eintrag auf der Admin-Startseite unter
„Prüfung überfällig“. Bei Guide-Artikeln lassen sich unter *Inhalt* passende **Leistungen,
Wegweiser und Expert:innen** verknüpfen; sie erscheinen unter dem Artikel als „Passend dazu“ —
aber nur, wenn sie selbst veröffentlicht sind.

**Das Quiz „Was ist meine Situation?“.** Es wird auf der Website erst angeboten, wenn *jede*
mögliche Antwort zu mindestens einem veröffentlichten Wegweiser führt. Dafür bei jedem Wegweiser
im Reiter *Einstellungen* das Feld **Passt zu (Quiz)** ankreuzen. Solange Situationen ohne
passenden Wegweiser bleiben (z. B. Familie, Gesundheit, Studium), ist das Quiz ausgeblendet. Es
erscheint von selbst, sobald alle abgedeckt sind.

**Expert:innen.** Anträge aus dem Formular der Website kommen als „Zur Überprüfung eingereicht“
an. Vor dem Veröffentlichen prüfen, ob die Person bei der zuständigen Kammer oder Behörde
eingetragen ist, und im Reiter *Einstellungen* den **Verifizierungsstatus** setzen (nur Vorstand
und Administration). E-Mail und Telefon sind nur dann öffentlich, wenn das Kästchen „öffentlich
anzeigen“ daneben angekreuzt ist — nur mit Zustimmung der Person.

**Stellenangebote.** Die Website nimmt keine Bewerbungen entgegen; sie verlinkt auf die Adresse
im Feld *Link zur Bewerbung*. Nach dem Ablaufdatum verschwindet die Stelle von selbst.

**Veranstaltungen.** Die Website nimmt keine Anmeldungen entgegen; sie zeigt den *Anmeldelink*.

**Kategorien, Guide-Themen, Schwerpunkte** (Vorstand). Jede Änderung ist sofort auf allen Seiten
sichtbar, die sie verwenden. Den Namen für jede Sprache einzeln eintragen, sonst steht im Filter
der arabischen und englischen Seiten der deutsche Name. Ein Thema oder einen Schwerpunkt nicht
löschen, solange noch Artikel oder Leistungen darin liegen.

**Kontaktanfragen.** Jede Nachricht aus dem Kontaktformular wird hier gespeichert und zusätzlich
per E-Mail weitergeleitet. Nach der Bearbeitung den Status auf „Gelesen“ oder „Archiviert“
setzen. Anfragen werden nach der eingestellten Frist automatisch gelöscht.

---

## 10. Wenn etwas nicht klappt

| Was passiert | Woran es liegt |
|---|---|
| Formular ist grau, kein Speichern-Knopf | Sie sind Redakteur:in und der Eintrag ist veröffentlicht oder archiviert — oder Sie sind Betrachter:in. |
| „Das folgende Feld ist ungültig: …“ | Ein Pflichtfeld (mit Stern) ist leer — oft der Slug im Reiter *Einstellungen* oder der Alt-Text eines Bildes. |
| Status springt nach dem Speichern zurück | Die Redaktion kann nicht veröffentlichen oder archivieren. |
| Eintrag ist veröffentlicht, aber nicht auf der Website | Slug prüfen; bei Stellen das Ablaufdatum; bei Veranstaltungen das Datum (vergangene stehen unter „Vergangene“). |
| Arabische oder englische Seite zeigt deutschen Text | Die Übersetzung fehlt — Sprache umschalten und eintragen. |
| „Wird gerade bearbeitet von …“ | Siehe 5, „Wird gerade bearbeitet“. |
| „Nicht berechtigt“ beim Öffnen einer Seite | Ihre Rolle darf diesen Bereich nicht ändern (siehe 2). |

Technische Probleme, die dieses Handbuch nicht klärt, bitte an die Entwicklung melden:
**+491771816575**.
