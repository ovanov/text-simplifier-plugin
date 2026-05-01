# EinfachLesen — Privacy Policy

_Last updated: 2026-05-01_

## Summary (English)

EinfachLesen is a browser extension developed for a research study at the University of Zurich. It transmits article paragraph text to a research backend operated by the researcher when (and only when) a study participant clicks the "Text vereinfachen" button on a supported news site, and stores a study authentication token in the browser's extension storage. No data is shared with third parties; no analytics, advertising, or tracking services are used.

## What is collected

When you enroll, you provide:

- A **User Id** (a UUID) that you receive by email after signing up for the study.
- A self-selected **CEFR level** (A1, A2, B1, or B2).

Once enrolled, the extension transmits to the research backend:

- The **text of any paragraph** for which you click the "✨ Text vereinfachen" button.
- The **source URL** of the page that paragraph appeared on.
- A previously-returned simplified version, when you click "Nochmals vereinfachen" to request a further-simplified output.

The extension does **not** read paragraphs you did not click on, does not track your browsing across sites, and does not collect IP-address-as-identity data, browser fingerprints, cookies, mouse movement, scroll position, or anything similar.

## How the User Id is used

The User Id is purely a **correlation token** between your enrollment and your simplification requests. The backend does not link your User Id to your name, email address, or any other personal identifier. The User Id allows the researcher to analyse simplification patterns per participant in aggregate; it does not allow re-identification.

## What is stored locally

The extension stores **only one item** in the browser's extension-scoped local storage (`chrome.storage.local`):

- `authToken` — a JSON Web Token issued by the research backend at enrollment, used to authenticate subsequent simplification requests.

This token is scoped to the extension; it is not accessible to any web page you visit and is not transmitted to any party other than the research backend.

## Where the data goes

All transmitted data is sent to a single endpoint: the research backend at the URL configured at extension-build time (currently a cloud-hosted server controlled by the researcher). No data is sent to any other party. No analytics, advertising, or third-party tracking services are integrated.

## Retention

Study data is retained for the duration of the research project and the publication of its results, after which it is anonymised and either retained for archival research purposes or deleted, in accordance with University of Zurich research data policy.

## Your rights

You may withdraw from the study at any time by contacting the researcher. Upon withdrawal, simplification request records associated with your User Id will be deleted from the active research dataset upon request.

## Contact

Researcher: claude@jo.ovanov.ch
Affiliation: University of Zurich

---

## Zusammenfassung (Deutsch)

EinfachLesen ist eine Browser-Erweiterung für eine Forschungsstudie der Universität Zürich. Sie sendet den Text eines Nachrichten-Absatzes an ein vom Forscher betriebenes Backend genau dann (und nur dann), wenn du als Studien-Teilnehmer:in auf einer unterstützten Nachrichtenseite den Button "Text vereinfachen" anklickst. Ein Authentifizierungs-Token wird im Erweiterungs-Speicher des Browsers abgelegt. Es werden keine Daten an Dritte weitergegeben; es werden keine Analyse-, Werbe- oder Tracking-Dienste eingesetzt.

## Was erhoben wird

Bei der Anmeldung gibst du an:

- Eine **User Id** (ein UUID), die du per E-Mail nach der Studienanmeldung erhalten hast.
- Ein selbst gewähltes **CEFR-Niveau** (A1, A2, B1 oder B2).

Nach der Anmeldung sendet die Erweiterung an das Forschungs-Backend:

- Den **Text eines Absatzes**, für den du den Button "✨ Text vereinfachen" anklickst.
- Die **Quell-URL** der Seite, auf der dieser Absatz erscheint.
- Eine zuvor erhaltene vereinfachte Version, wenn du "Nochmals vereinfachen" klickst.

Die Erweiterung liest **keine** Absätze, die du nicht angeklickt hast, verfolgt dein Surfverhalten nicht über Seiten hinweg und erhebt weder IP-Adressen als Identifikator, noch Browser-Fingerprints, Cookies, Mausbewegungen, Scroll-Positionen oder Ähnliches.

## Verwendung der User Id

Die User Id ist ausschliesslich ein **Zuordnungs-Token** zwischen deiner Studienanmeldung und deinen Vereinfachungs-Anfragen. Das Backend verknüpft deine User Id nicht mit deinem Namen, deiner E-Mail-Adresse oder einem anderen personenbezogenen Identifikator. Die User Id erlaubt dem Forscher, Vereinfachungs-Muster pro Teilnehmer:in aggregiert auszuwerten; eine Re-Identifikation ist nicht möglich.

## Was lokal gespeichert wird

Die Erweiterung speichert **nur einen Eintrag** im Erweiterungs-eigenen Speicher des Browsers (`chrome.storage.local`):

- `authToken` — ein vom Forschungs-Backend bei der Anmeldung ausgestelltes JWT, das für die Authentifizierung nachfolgender Anfragen verwendet wird.

Dieses Token ist auf die Erweiterung beschränkt; keine Website, die du besuchst, hat Zugriff darauf, und es wird an keine andere Stelle als das Forschungs-Backend übertragen.

## Wohin die Daten gehen

Alle übertragenen Daten gehen an einen einzigen Endpunkt: das Forschungs-Backend unter der zur Build-Zeit konfigurierten URL (aktuell ein vom Forscher kontrollierter Cloud-Server). Es werden keine Daten an Dritte gesendet. Keine Analyse-, Werbe- oder Tracking-Dienste sind integriert.

## Aufbewahrung

Studiendaten werden für die Dauer des Forschungsprojekts und der Publikation der Ergebnisse aufbewahrt; danach werden sie anonymisiert und entweder zu Archivzwecken aufbewahrt oder gelöscht, im Einklang mit der Forschungsdaten-Richtlinie der Universität Zürich.

## Deine Rechte

Du kannst jederzeit von der Studie zurücktreten, indem du den Forscher kontaktierst. Auf Wunsch werden die mit deiner User Id verknüpften Vereinfachungs-Anfragen aus dem aktiven Forschungsdatensatz gelöscht.

## Kontakt

Forscher: claude@jo.ovanov.ch
Affiliation: Universität Zürich
