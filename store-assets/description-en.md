# EinfachLesen — Simplified News for German Learners

EinfachLesen is a research extension developed at the University of Zurich. It helps German-as-a-second-language learners read Swiss German news by adding an inline "Simplify" button to article paragraphs on supported news sites.

## How it works

1. Open an article on a supported site (currently SRF and 20 Minuten).
2. Each paragraph gets a small "✨ Text vereinfachen" button.
3. Click the button — the paragraph text is sent to the study's research backend, which returns a simplified version targeted at the participant's self-reported CEFR level (A1–B2).
4. The simplified text appears inline below the original paragraph. A "Nochmals vereinfachen" (Simplify again) button lets you request a further-simplified version.

## Audience and access

This extension is intended exclusively for participants enrolled in the study. Participants receive a User Id by email; that ID is required to use the extension. The extension is published as **unlisted** and is not intended for general public use.

## Permissions and data

- **storage** — stores the participant's authentication token between sessions.
- Access to **srf.ch** and **20min.ch** — required to inject the simplification button into article paragraphs on those sites.
- Access to the study's research backend — required to send paragraph text and receive simplified output.

The User Id is used **only** to associate simplification requests with a study enrollment record. No personal data (name, email, identifying network metadata) is linked to the User Id on the backend. No analytics, ads, tracking, or third-party services are used.

For full details, see the privacy policy: <https://ovanov.github.io/text-simplifier-plugin/PRIVACY>

## Contact

Research contact: <claude@jo.ovanov.ch> (UZH).

---

## Auf Deutsch

EinfachLesen ist eine Forschungserweiterung der Universität Zürich, die deutschsprachige Nachrichtenartikel auf Schweizer Nachrichtenseiten (SRF, 20 Minuten) für L2-Lernende vereinfacht. Die Erweiterung fügt jedem Absatz einen Button "✨ Text vereinfachen" hinzu; ein Klick sendet den Absatz an das Studien-Backend, das eine an dein selbst angegebenes CEFR-Niveau (A1–B2) angepasste vereinfachte Version zurückgibt.

Diese Erweiterung ist ausschliesslich für Teilnehmer:innen der Studie gedacht. Eine User Id (per E-Mail erhalten) wird zum Anmelden benötigt. Die User Id dient ausschliesslich der Zuordnung zur Studienanmeldung — es werden keine personenbezogenen Daten mit ihr verknüpft.

Datenschutz: <https://ovanov.github.io/text-simplifier-plugin/PRIVACY>
