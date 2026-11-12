# Show HN — Fakten für Marcels eigenen Beitrag

Noch nicht eingereicht. **Dies sind Arbeitsnotizen, kein veröffentlichbarer Beitrag.**
Hacker News verlangt selbst geschriebene Texte und untersagt KI-generierte oder KI-editierte
Beiträge und automatisiertes Posting. Deshalb hier weder einen fertigen Titel noch einen
Kommentar aus den anderen Entwürfen übernehmen.

## Ort und Format

- [Selbst einreichen](https://news.ycombinator.com/submit), persönlicher Account erforderlich.
- Titel mit `Show HN:` beginnen und selbst formulieren.
- Als Ziel bietet sich das [öffentliche Repository](https://github.com/maphel/YTTS) an:
  Installation, Quellcode und Funktionen sind dort direkt zugänglich. Die fertige Extension
  lässt sich bereits aus dem Store installieren; keine reine Ankündigung einreichen.
- Im eigenen Kommentar kann Marcel die [Demo](https://ytts.christophel.io/) und den
  [Store](https://chromewebstore.google.com/detail/ytts/ipkipmmdaicpfijcddghjpfjpacgdphe) verlinken.

## Belegbare Eckdaten

| Thema | Fakt / Gesprächspunkt |
| --- | --- |
| Persönlicher Ausgangspunkt | Häufig Transkripte lesen statt das ganze Video ansehen; vorhandene Tools entsprachen nicht der gewünschten schlichten YouTube-Integration |
| Priorität 1 | Möglichst wie ein Teil von YouTube aussehen; Hell- und Dunkeldesign auch bei künftigen Anpassungen erhalten |
| Priorität 2 | Komplett kostenlos, ohne Werbung, ohne Accountpflicht |
| Funktionen | Vorhandenes Transkript lesen und kopieren; Lines, Sentences, Text; optionale Zeitstempel beim Kopieren; zu Zeitstempeln springen |
| Sprache | 21 Oberflächen-Locales, einschließlich RTL; keine Transkriptübersetzung |
| Technik | Chromium Manifest V3, Vanilla JavaScript, keine Laufzeitabhängigkeiten; native YouTube-Transkriptansicht als Quelle |
| Datenschutz | Kein eigener Backenddienst, keine Analytics; Transkripte bleiben im Arbeitsspeicher der Seite und werden auf Wunsch in die Zwischenablage kopiert |
| Lizenz | MIT; öffentliches Repository |
| Grenzen | YouTube muss ein Transkript bereitstellen; keine Audiotranskription, KI-Zusammenfassung oder Übersetzung; YouTube-Änderungen können Anpassungen nötig machen |

## Selbst beantworten

- Warum war die Integration ins bestehende Design wichtiger als weitere Funktionen?
- Was war an der YouTube-Integration technisch überraschend?
- Welche Rückmeldung von echten Transkriptnutzern würde bei der Weiterentwicklung helfen?

Keine Reichweite oder Nutzerzahlen erfinden. Nach dem Absenden für technische Fragen verfügbar
sein. Freunde nicht um Upvotes oder Kommentare bitten. Ein Eintrag erscheint zunächst bei
Show New; eine Platzierung auf Show HN oder der Startseite ist nicht garantiert.

Quellen: [Show-HN-Regeln](https://news.ycombinator.com/showhn.html),
[HN-Richtlinien](https://news.ycombinator.com/newsguidelines.html).
