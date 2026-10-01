# Validation report

Built and checked on 1 October 2026. These results describe checks actually executed in the development workspace.

## Verified

- `node tests/logic.test.cjs`: ten test groups passed using the pure functions extracted from the actual built HTML.
- Vocabulary: 120 unique words and IDs; allocations of 12 words in Levels 1–6 and 16 in Levels 7–9; short definitions; one blank marker per sentence; reciprocal opposite pairs; eligible spelling lengths and picture-format quotas.
- Question generation: 500 deterministic seeds across ten levels, totaling 5,000 sessions. Eight distinct targets per session, specified format quotas, distinct choices, same-source distractors, letter tile integrity, and Level 10 source diversity.
- Additional skewed-history generation checks and replay preference for unused words.
- Exact scoring, including 100 points for six uninterrupted first-try correct answers, 140 for eight, retry points, and streak reset.
- Every star boundary from 0–8 correct answers, ten-level progression, worse-replay preservation, idempotent result commits, and all six badges.
- Save/reload through a storage stub; malformed JSON, malformed saves, unavailable storage getter, failed writes, and namespaced reset.
- Distinct repeated-letter tile identities.
- Built HTML is below 500 KB. Static checks found no external asset references or network API calls in the game.
- `node tests/interaction.test.cjs`: actual event handlers, renderer, and screen state executed with a minimal DOM stub. A full ten-level playthrough produced 30 stars, 1,400 points, and six badges.
- The same interaction test exercised first-wrong/second-correct, two wrong answers, duplicate input, premature spelling submission, spelling Undo/Clear/retry, settings return, abandonment without point commit, reset cancellation, reset completion, and preservation of unrelated storage.
- An editorial pass reviewed definitions, sentence frames, opposite pairs, and format eligibility. Blank questions additionally show a definition clue to reduce ambiguity.

## Partially verified

- Accessibility: semantic controls, keyboard-native buttons, focus handling, labelled dialogs, polite feedback, reduced-motion CSS, and non-answer-revealing picture descriptions are implemented. The DOM stub cannot verify real focus behavior or assistive-technology usability.
- Privacy/offline behavior: the built source has no tracking, personal data fields, remote assets, or network calls. Real network-inspector verification was unavailable.
- Audio: gesture initialization, separate toggles, category gains, visibility handling, and failure catches were inspected in code. The interaction test exercises the unsupported-audio fallback, not actual playback.
- Vocabulary accuracy and ambiguity received editorial review, but have not been evaluated by children or a literacy specialist. Learning outcomes are not claimed.

## Not verified

- Real-browser layout, screenshots, zoom behavior, scrolling, full keyboard focus order, and measured color contrast.
- Browser-specific local-file persistence and actual storage-denied browser behavior.
- Real-device iOS/Android audio, tab visibility transitions, and emoji appearance.
- Screen-reader playthrough.
- First-screen performance on a mid-range phone.

Browser verification was attempted with the existing Playwright tooling, but neither its Chromium nor headless-shell executable was installed. No screenshots or real-browser pass results are claimed. The project requires no browser installation to run on the user's own computer.

## Quick checks after opening

1. Open `index.html`; check that Home and the level map look comfortable on your screen.
2. Play Level 1, including one wrong answer and a retry. Read the feedback and use Next.
3. Reload after completing a level and check saved stars.
4. Try music and sound toggles. The game must remain playable silently.
5. Try keyboard controls and a narrow browser window.
6. On a spelling level, try repeated letters, Undo, Clear, and both submissions.

The two included Node test scripts can be rerun without installing packages. A DOM-stub test is intentionally distinguished from browser verification.
