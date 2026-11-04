# Working on EvoLyric

**Every new feature or screen must be translated (English + Indonesia).**
1. Write visible text in English in the code.
2. Add the Indonesian version to `ID` (exact text) or `IDP` (text containing a name or number) in `www/index.html`. Long pages built with `L(en, id)` already carry both.
3. Run `node tools/i18n-audit.js` – it must print `OK – nothing untranslated`. Add new screens/dialogs as steps in that script.
4. Bump the cache in `www/sw.js` and add a `CHANGELOG.md` entry.
