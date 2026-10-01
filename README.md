# Word Island

A complete offline vocabulary game for children aged 6–9 who can read simple English. Explore ten islands with Pip, answer eight questions per session, build words with letter tiles, earn stars and badges, and replay to discover more of the 120-word bank.

## Open in VS Code

1. Extract this ZIP.
2. In VS Code, select **File → Open Folder**, then choose `word-island`.
3. Double-click `index.html` in your computer's file browser to play in a web browser.

You do not need npm, an API key, a backend, or an extension. If you already use VS Code's Live Server extension, you may right-click `index.html` and choose **Open with Live Server**. Otherwise, an optional local server using an installed Python runtime is:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. On Windows, `py -m http.server 8000` may be the appropriate command. Keep the terminal open while using the server. The game also runs directly from the HTML file.

## Controls

- Tap or click a word to answer. You have two tries.
- On spelling questions, tap letter tiles in order. Undo and Clear let you edit; Check submits an attempt.
- Read the meaning and example, then choose Next word.
- Use Tab and Shift+Tab to move between controls; Enter or Space activates a focused button. Escape closes a dialog.
- Music and sound effects can be switched independently in Settings. Music starts only after interaction.
- Complete four of eight questions correctly to earn a star and open the next island. Replays keep your best stars and add completed-session points.

Progress is saved only in this browser on this device. Browsers can restrict saving when a file is opened directly; a local server generally provides a more consistent storage origin. When storage is blocked, play still works but progress may be lost on reload. Clearing browser storage removes progress. Unfinished sessions are discarded on reload.

## Project files

| File | Purpose |
|---|---|
| `index.html` | Finished self-contained game. This is the only file needed to play. |
| `index.template.html` | Editable layout, styles, and game logic. |
| `data.txt` | Editable vocabulary content. Lines contain word, picture, meaning, and sentence template separated by `\|`. |
| `build.py` | Embeds the content into the template to regenerate `index.html`. |
| `tests/logic.test.cjs` | Dependency-free tests of the actual embedded game logic. |
| `tests/interaction.test.cjs` | Actual event/screen flow tested with a minimal DOM stub. |
| `VALIDATION.md` | Checks performed and limitations. |
| `.vscode/settings.json` | Optional workspace defaults for Live Server users. |

## Make changes

For styling or gameplay, edit `index.template.html`. For vocabulary, edit `data.txt`. Each sentence must contain one `{word}` marker. Then rebuild with an installed Python runtime:

```sh
python build.py
```

Or edit `index.html` directly for a quick change; rebuilding will replace it with the template version. The original template is a source file and is not independently playable until built.

Run pure-logic tests with an installed Node runtime:

```sh
node tests/logic.test.cjs
node tests/interaction.test.cjs
```

No packages are installed by these commands. The game makes no network requests, contains no ads or accounts, and collects no identifying information. All drawings and synthesized tunes are included in the file; emoji appearance varies by device.

The game supports reduced motion and keyboard controls. Real-device audio, screen-reader usability, and learning outcomes have not been established by the automated checks; see VALIDATION.md.
