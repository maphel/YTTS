# YTTS Launch-Paket

Vorbereitet am 12. November 2026. **Entwürfe, noch keine Einreichung.**
Die Texte sind Englisch, damit sie auf den vier internationalen Plattformen passen.
Vor dem Absenden kurz persönlich lesen und gegebenenfalls anpassen.

## Reihenfolge und Status

| Plattform | Material | Status | Öffentlicher Eintrag |
| --- | --- | --- | --- |
| Indie Hackers | [Produkteintrag und erster Beitrag](indie-hackers.md) | Vorbereitet; Anmeldung und persönliche Freigabe ausstehend | — |
| Product Hunt | [Felder und Maker-Kommentar](product-hunt.md) | Vorbereitet; Anmeldung und Launch-Datum ausstehend | — |
| Show HN | [Eckdaten für deinen eigenen Text](show-hn-notes.md) | Fakten vorbereitet; Beitrag von Marcel zu schreiben | — |
| AlternativeTo | [Produkteintrag und passende Alternativen](alternativeto.md) | Vorbereitet; Anmeldung und Einreichung ausstehend | — |

Nach dem Veröffentlichen Datum und öffentlichen Link hier ergänzen. Bei AlternativeTo gilt
eine Einreichung noch nicht als veröffentlichter Eintrag; die kostenlose Prüfung kann sehr
lange dauern. Für dieses Paket wurden keine Accounts angelegt oder Beiträge veröffentlicht.

## Gemeinsame Angaben

| Feld | Wert |
| --- | --- |
| Name | YTTS |
| Entwickler / Maker | Marcel Christophel |
| Website und Demo | https://ytts.christophel.io/ |
| Chrome Web Store | https://chromewebstore.google.com/detail/ytts/ipkipmmdaicpfijcddghjpfjpacgdphe |
| Quellcode | https://github.com/maphel/YTTS |
| Support | https://github.com/maphel/YTTS/issues |
| Datenschutz der Extension | https://github.com/maphel/YTTS/blob/main/PRIVACY.md |
| Preis | Free; keine Werbung, kein Abo, kein erforderlicher Account |
| Lizenz | MIT; Open Source |
| Plattform | Desktop: Chrome und kompatible Chromium-Browser |

Die Positionierung bleibt gleich: eine Transkriptkarte, die sich in YouTubes Design einfügt,
in Hell und Dunkel, komplett kostenlos. Keine Zusammenfassungen oder KI-Funktionen versprechen.
Die **21 Locales betreffen die Oberfläche**, nicht die Übersetzung von Transkripten.
Ein Video braucht bereits ein bei YouTube verfügbares Transkript. YTTS ist unabhängig von Google.

## Upload-Dateien

| Datei | Verwendung |
| --- | --- |
| [icon-240.png](assets/icon-240.png) | Product-Hunt-Logo, 240 × 240, transparenter Hintergrund |
| [icon-512.png](assets/icon-512.png) | Größeres Icon für Verzeichnisse, 512 × 512 |
| [01-native-themes.png](assets/01-native-themes.png) | Hauptbild: echte Karte in Hell und Dunkel, 1270 × 760 |
| [02-watch-page.png](assets/02-watch-page.png) | Echte Karte auf der YouTube-Seite, 1270 × 760 |
| [03-preferences.png](assets/03-preferences.png) | Echte Einstellungen in Hell und Dunkel, 1270 × 760 |
| [Bestehende Desktop-Demo](../../website/assets/demo.mp4) | 1920 × 1080, ungefähr 19 Sekunden, Englisch |
| [Bestehende Mobil-Demo](../../website/assets/demo-portrait.mp4) | 1080 × 1350, Englisch |

Die PNGs sind aus dem bestehenden SVG-Icon und den vorhandenen echten Screenshots gerendert.
Andere Videoinhalte in der Übersichtsaufnahme sind bereits unkenntlich gemacht. Die Bilder
zeigen die englische Oberfläche. Videos werden in diesem Schritt nicht neu übersetzt oder
bei einem weiteren Dienst hochgeladen. Für ein optionales Video-Feld erst prüfen, welche
Video-Hoster die jeweilige Plattform akzeptiert; die Website bietet die Demo bereits direkt an.

Galerie-Alt-Texte stehen bei den [Product-Hunt-Feldern](product-hunt.md).
Bei Verzeichnissen mit wenig Platz reichen Icon und Hauptbild.

## Vor dem Absenden

1. Website und Store-Link öffnen, Demo abspielen.
2. Mit dem eigenen persönlichen Account anmelden. Den Text einmal lesen und bestätigen.
3. Die vorbereiteten Texte und Bilder übernehmen. **Free**, nicht Freemium, auswählen.
4. Product-Hunt-Termin so wählen, dass Zeit für Antworten auf Kommentare bleibt.
5. Show-HN-Beitrag selbst formulieren und selbst absenden; dort gelten menschlich geschriebene
   Texte und keine automatisierte Veröffentlichung.
6. Anschließend öffentlichen Link hier eintragen und auf Rückfragen eingehen.

Es sind keine bezahlten Platzierungen oder schnelleren Prüfungen vorgesehen. Diese Einträge
sind vor allem Möglichkeiten, Nutzer und Feedback zu gewinnen. Ein veröffentlichter Link
garantiert keinen Rankinggewinn.
Keine 21 separaten Einträge für die Sprachversionen anlegen: die englische Hauptseite verwenden.

## Medien neu erzeugen

Mit den vorhandenen Entwicklungsabhängigkeiten und installiertem Google Chrome:

```sh
node scripts/launch-assets.mjs
```

Die Quelldateien bleiben unter `extension/icons/`, `website/assets/` und `docs/screenshots/`.
Der Generator erstellt nur die PNGs in diesem Paket. Die Website und die Extension werden
dabei nicht verändert.

## Geprüfte Plattformregeln

- [Product Hunt: Felder und Medien](https://help.producthunt.com/en/articles/17834537-4-build-your-product-page)
  und [kostenloser Launch](https://help.producthunt.com/en/articles/17734646-8-launch-faq-and-myths).
- [Indie Hackers: Produktdatenbank](https://www.indiehackers.com/products),
  [kostenlose Basisnutzung](https://www.indiehackers.com/terms).
- [Show HN](https://news.ycombinator.com/showhn.html) und
  [HN-Richtlinien](https://news.ycombinator.com/newsguidelines.html).
- [AlternativeTo: Einreichen und Warteschlange](https://alternativeto.net/faq/),
  [Bedingungen](https://alternativeto.net/about/terms/).

Felder und Regeln können sich ändern; die jeweiligen Formulare sind beim Einreichen maßgeblich.
