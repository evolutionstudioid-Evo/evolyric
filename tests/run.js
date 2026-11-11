/* Run:  npm test            (all)     |   node tests/run.js "setlist"   (only tests whose name contains the text) */
const {run}=require('./harness');
run(['./home.test.js','./lyrics.test.js','./weblyric.test.js','./evonote.test.js','./editor.test.js','./setlist.test.js','./categories.test.js','./friends.test.js','./data.test.js','./i18n.test.js','./pwa.test.js'].map(f=>require.resolve(f)));
