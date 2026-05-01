# Permissions justifications (Chrome Web Store form fields)

## `storage`

Stores the participant's research-study authentication token (issued at enrollment) so that the extension stays signed in across browser sessions. No other data is persisted.

## Host permission: `https://*.srf.ch/*`

Required for the content script to inject the "✨ Text vereinfachen" button into article paragraphs on the SRF news site. No data is collected automatically from this site; paragraph text is only transmitted when the participant explicitly clicks the simplify button.

## Host permission: `https://*.20min.ch/*`

Required for the content script to inject the "✨ Text vereinfachen" button into article paragraphs on the 20 Minuten news site. Same data discipline as SRF: paragraph text is only transmitted on explicit user click.

## Host permission for the study backend (substituted at build time, e.g., `https://study.example.uzh.ch/*`)

Required to send paragraph text and the source-page URL to the study's research backend, and to receive the simplified text in return. This is the sole network destination contacted by the extension. No third-party services are involved.
