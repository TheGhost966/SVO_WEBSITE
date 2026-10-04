# SVÖ Website — Handbuch für die Redaktion

Kurze Anleitung für den Admin-Bereich der Website. Für Vorstand, Redakteur:innen und
Administrator:innen.

## 1. Anmeldung

Admin-Bereich: **`https://[domain]/admin`** (lokal beim Testen: `http://localhost:3000/admin`)

**Das erste Administrator-Konto** wird nicht im Browser angelegt, sondern einmalig von der
Entwicklung bei der Einrichtung der Website (Befehl `npm run create-admin`, siehe `README.md`,
Abschnitt „Deployment“). Auf der Live-Website ist die Registrierung über den Browser absichtlich
gesperrt — sonst könnte sich auf einer frisch aufgesetzten Website jede beliebige Person als
erste:r Administrator:in eintragen.

Danach vergibt ein Administrator Zugänge für weitere Personen unter **System → Users**.

**Es muss immer mindestens ein Administrator-Konto geben.** Das letzte verbleibende
Administrator-Konto lässt sich deshalb nicht löschen. Wer es ersetzen möchte, gibt zuerst einer
anderen Person die Rolle *Administrator* und löscht erst dann das alte Konto. Empfehlung: zwei
Administrator-Konten führen, damit bei einem vergessenen Passwort niemand ausgesperrt ist.

Jede Person kann in ihrem eigenen Konto (oben rechts) die Sprache des Admin-Bereichs zwischen
Deutsch, Arabisch und Englisch umstellen — unabhängig davon, in welcher Sprache man gerade
Inhalte bearbeitet.

## 2. Rollen — wer darf was

| Rolle | Inhalte erstellen/bearbeiten | Zur Überprüfung einreichen | Veröffentlichen | Benutzer verwalten |
|---|:---:|:---:|:---:|:---:|
| **Redakteur** (editor) | ✅ | ✅ | ❌ | ❌ |
| **Vorstand** (board) | ✅ | ✅ | ✅ | ❌ |
| **Administrator** (admin) | ✅ | ✅ | ✅ | ✅ |
| **Betrachter** (viewer) | Nur lesen | ❌ | ❌ | ❌ |

**Wichtig:** Ein Redakteur kann nichts direkt veröffentlichen. Das ist Absicht — jede
Veröffentlichung braucht die Freigabe durch den Vorstand.

## 3. Der Ablauf: Entwurf → Prüfung → Veröffentlichung

Jeder Inhalt (Seite, News-Artikel, Veranstaltung, Leistung) durchläuft diese Stationen,
sichtbar im Feld **Status**:

1. **Entwurf** — wird gerade bearbeitet, noch für niemanden sichtbar.
2. **Zur Überprüfung eingereicht** — der Redakteur ist fertig und möchte, dass der Vorstand
   es prüft. **Der Vorstand bekommt automatisch eine E-Mail.**
3. **Veröffentlicht** — live auf der Website. Nur der Vorstand oder ein Administrator kann
   diesen Status setzen.
4. **Archiviert** — nicht mehr live, aber nicht gelöscht (z. B. eine vergangene Veranstaltung,
   die nicht mehr beworben werden soll).

**Für Redakteur:innen:** Inhalt erstellen → Felder ausfüllen → Status auf
*"Zur Überprüfung eingereicht"* setzen → Speichern. Fertig — der Vorstand übernimmt den Rest.

**Für den Vorstand:** Wenn eine Benachrichtigungs-E-Mail kommt, im Admin-Bereich öffnen, den
Inhalt prüfen, und den Status auf *"Veröffentlicht"* setzen (oder mit Kommentar zurück an den
Redakteur geben, indem man es einfach auf *"Entwurf"* zurücksetzt).

Jede Änderung wird als Version gespeichert — über den Verlauf (Versions-Symbol oben rechts an
jedem Dokument) lässt sich jede frühere Fassung ansehen und wiederherstellen.

## 4. Die Menüpunkte

Der Admin-Bereich ist links in vier Gruppen gegliedert:

- **Inhalte** — alles, was auf der Website öffentlich sichtbar ist: Seiten, News, Veranstaltungen,
  Leistungen, die vier Schwerpunkt-Bereiche, Kategorien, und die Mediathek (Bilder/Dateien).
- **Organisation** — Vorstandsmitglieder und Partner/Förderer.
- **Einstellungen** — Website-Einstellungen (Logo, Kontaktdaten, Social-Media-Links) und die
  Navigation (Menüpunkte im Header/Footer).
- **System** — Benutzerkonten und eingegangene Kontaktanfragen. Nur für Redakteur:innen und
  höher sichtbar.

## 5. Mehrsprachige Inhalte bearbeiten

Die Website gibt es auf Deutsch, Arabisch und Englisch. Beim Bearbeiten eines Inhalts sieht man
oben im Formular einen Sprachumschalter (DE / AR / EN). Jede Sprache hat eigene Textfelder —
man muss die Übersetzung selbst eintragen, es wird nichts automatisch übersetzt.

**Fehlt eine Übersetzung?** Kein Problem — die Website zeigt dann automatisch den deutschen Text
mit einem kleinen Hinweis ("nicht in dieser Sprache verfügbar"). Es wird nie eine leere Seite
angezeigt. Trotzdem: Arabisch und Englisch sollten so bald wie möglich nachgezogen werden.

## 6. Bilder hochladen

Unter **Inhalte → Media** hochladen, oder direkt beim Bearbeiten eines Inhalts über das
Bild-Feld. Zwei Punkte sind **Pflicht**:

- **Alt-Text** (für jede Sprache einzeln) — beschreibt das Bild in ein bis zwei Sätzen, für
  Screenreader (Barrierefreiheit) und Suchmaschinen. Ohne Alt-Text lässt sich das Bild nicht
  speichern.
- **Einwilligung liegt vor** (Checkbox) — bei Fotos, auf denen erkennbare Personen zu sehen
  sind, muss eine schriftliche Einwilligung der abgebildeten Person(en) vorliegen, *bevor* das
  Foto hochgeladen wird. Die Checkbox ist nur ein interner Vermerk, kein Ersatz für die
  tatsächliche Einwilligung.

## 7. Kontaktanfragen

Nachrichten aus dem Kontaktformular landen unter **System → Contact Submissions** und werden
zusätzlich sofort per E-Mail weitergeleitet. Nach Bearbeitung den Status auf *"Gelesen"* oder
*"Archiviert"* setzen, damit der Überblick erhalten bleibt.

## 8. Bei Problemen

Technische Probleme, die dieses Handbuch nicht klärt, bitte an die Entwicklung melden:
**[Kontakt der Entwicklung eintragen]**.
