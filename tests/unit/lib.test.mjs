// Unit tests for extension/lib.js. The file is a classic browser script, so it is evaluated
// in a fresh VM context exactly as the browser would run it, then read from globalThis.YTTS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../../extension/lib.js', import.meta.url), 'utf8');
const sandbox = {};
sandbox.globalThis = sandbox;
runInNewContext(source, sandbox);
const lib = sandbox.YTTS;

// Values created inside the VM have foreign prototypes; normalise before deepEqual.
const plain = (value) => JSON.parse(JSON.stringify(value));
const seg = (ts, text) => ({ type: 'seg', ts, sec: lib.toSeconds(ts), text });
const chapter = (title) => ({ type: 'chapter', title });

test('defaults and views', () => {
  assert.deepEqual(plain(lib.DEFAULTS), { expandedByDefault: false, copyTimestamps: false, view: 'sentences' });
  assert.deepEqual(plain(lib.VIEWS), ['lines', 'sentences', 'text']);
  assert.ok(Object.isFrozen(lib.DEFAULTS));
});

test('normalizeSettings keeps valid values and repairs the rest', () => {
  assert.deepEqual(plain(lib.normalizeSettings(undefined)), plain(lib.DEFAULTS));
  assert.deepEqual(
    plain(lib.normalizeSettings({ expandedByDefault: true, copyTimestamps: 'yes', view: 'text', extra: 1 })),
    { expandedByDefault: true, copyTimestamps: false, view: 'text' },
  );
  assert.equal(lib.normalizeSettings({ view: 'grid' }).view, 'sentences');
  assert.equal(lib.validSetting('unknown', true), false);
});

test('toSeconds parses m:ss and h:mm:ss and rejects garbage', () => {
  assert.equal(lib.toSeconds('0:07'), 7);
  assert.equal(lib.toSeconds('12:34'), 754);
  assert.equal(lib.toSeconds('1:02:03'), 3723);
  assert.equal(lib.toSeconds(' 3:05 '), 185);
  assert.ok(Number.isNaN(lib.toSeconds('Kapitel')));
  assert.ok(Number.isNaN(lib.toSeconds('')));
});

test('fmtTime pads minutes only when hours are present', () => {
  assert.equal(lib.fmtTime(0), '0:00');
  assert.equal(lib.fmtTime(65.9), '1:05');
  assert.equal(lib.fmtTime(3723), '1:02:03');
  assert.equal(lib.fmtTime(-4), '0:00');
  assert.equal(lib.fmtTime(undefined), '0:00');
});

test('fragments merge into sentences with from–to ranges', () => {
  const items = [seg('0:00', 'Hallo'), seg('0:04', 'Welt.'), seg('0:08', 'Noch ein Satz.')];
  assert.deepEqual(plain(lib.toSentences(items, 12)), [
    { type: 'sent', sec: 0, end: 8, text: 'Hallo Welt.' },
    { type: 'sent', sec: 8, end: 12, text: 'Noch ein Satz.' },
  ]);
});

test('a segment containing several sentences is split', () => {
  const sentences = lib.toSentences([seg('0:00', 'Eins. Zwei! Drei?')], 6);
  assert.deepEqual(plain(sentences.map((s) => s.text)), ['Eins.', 'Zwei!', 'Drei?']);
});

test('quotes and brackets after punctuation still end the sentence', () => {
  const items = [seg('0:00', 'Er sagte „Hallo.“ Dann ging er.'), seg('0:05', '(Applaus.) Weiter.')];
  const texts = lib.toSentences(items, 9).map((s) => s.text);
  assert.deepEqual(plain(texts), ['Er sagte „Hallo.“', 'Dann ging er.', '(Applaus.)', 'Weiter.']);
});

// French typography with a space before » ("« Oui. »") is not recognised; captions rarely use it.
test('German single and French guillemet closers end a sentence', () => {
  const de = lib.toSentences([seg('0:00', 'Er sagte ‚Ja.‘ Gut.')], 3).map((s) => s.text);
  assert.deepEqual(plain(de), ['Er sagte ‚Ja.‘', 'Gut.']);
  const fr = lib.toSentences([seg('0:00', 'Il dit «Oui.» Puis.')], 3).map((s) => s.text);
  assert.deepEqual(plain(fr), ['Il dit «Oui.»', 'Puis.']);
  const ch = lib.toSentences([seg('0:00', 'Er sagt »Nein.« Dann.')], 3).map((s) => s.text);
  assert.deepEqual(plain(ch), ['Er sagt »Nein.«', 'Dann.']);
});

test('ellipsis ends a sentence', () => {
  const texts = lib.toSentences([seg('0:00', 'Na ja… Egal.')], 3).map((s) => s.text);
  assert.deepEqual(plain(texts), ['Na ja…', 'Egal.']);
});

// Known limitation, pinned so a future fix is a deliberate change: abbreviations split.
test('abbreviations followed by a space split (documented heuristic)', () => {
  const texts = lib.toSentences([seg('0:00', 'Das ist z. B. so.')], 3).map((s) => s.text);
  assert.deepEqual(plain(texts), ['Das ist z.', 'B.', 'so.']);
});

test('decimals do not split because there is no space after the dot', () => {
  const texts = lib.toSentences([seg('0:00', 'Version 3.5 ist da.')], 3).map((s) => s.text);
  assert.deepEqual(plain(texts), ['Version 3.5 ist da.']);
});

test('unpunctuated auto-captions close after 30 seconds', () => {
  const items = Array.from({ length: 12 }, (_, i) => seg(`0:${String(i * 5).padStart(2, '0')}`, `wort${i}`));
  const sentences = lib.toSentences(items, 60);
  assert.ok(sentences.length > 1, 'expected a fallback split');
  for (const s of sentences) assert.ok(s.end - s.sec <= 35, `sentence too long: ${s.sec}–${s.end}`);
  assert.equal(sentences.map((s) => s.text).join(' '), items.map((i) => i.text).join(' '));
});

test('unpunctuated auto-captions close after 300 characters', () => {
  const long = 'a'.repeat(160);
  const sentences = lib.toSentences([seg('0:00', long), seg('0:01', long), seg('0:02', 'b')], 3);
  assert.equal(sentences[0].text, `${long} ${long}`);
  assert.equal(sentences[1].text, 'b');
});

test('chapters close the running sentence and are passed through', () => {
  const items = [seg('0:00', 'ohne Punkt'), chapter('Teil 2'), seg('0:10', 'Weiter.')];
  assert.deepEqual(plain(lib.toSentences(items, 20)), [
    { type: 'sent', sec: 0, end: 10, text: 'ohne Punkt' },
    { type: 'chapter', title: 'Teil 2' },
    { type: 'sent', sec: 10, end: 20, text: 'Weiter.' },
  ]);
});

test('end of the last sentence falls back when the duration is unknown or too short (ads)', () => {
  assert.equal(lib.toSentences([seg('1:00', 'Ende.')]).at(-1).end, 65);
  assert.equal(lib.toSentences([seg('1:00', 'Ende.')], 15).at(-1).end, 65);
  assert.equal(lib.toSentences([seg('1:00', 'Ende.')], 90).at(-1).end, 90);
});

test('hour-long timestamps survive sentence ranges', () => {
  const [s] = lib.toSentences([seg('1:00:00', 'Spät.'), seg('1:00:09', 'Noch.')], 3620);
  assert.equal(`${lib.fmtTime(s.sec)}–${lib.fmtTime(s.end)}`, '1:00:00–1:00:09');
});

test('paragraphs hold four sentences and restart at chapters', () => {
  const items = [
    ...['A.', 'B.', 'C.', 'D.', 'E.'].map((t, i) => seg(`0:0${i}`, t)),
    chapter('K'),
    seg('0:09', 'F.'),
  ];
  const paras = lib.toParagraphs(lib.toSentences(items, 10));
  const labels = paras.map((p) => (p.type === 'para' ? p.sentences.map((s) => s.text).join(' ') : `#${p.title}`));
  assert.deepEqual(plain(labels), ['A. B. C. D.', 'E.', '#K', 'F.']);
});

const transcript = [
  chapter('Kapitel eins'), seg('0:00', 'Hallo'), seg('0:04', 'Welt.'), seg('0:08', 'Noch ein Satz.'),
  chapter('Kapitel zwei'), seg('0:15', 'Zum Schluss.'),
];

test('copy without timestamps gives paragraphs in every view', () => {
  const expected = '## Kapitel eins\n\nHallo Welt. Noch ein Satz.\n\n## Kapitel zwei\n\nZum Schluss.\n';
  for (const view of ['lines', 'sentences', 'text']) {
    assert.equal(lib.formatTranscript(transcript, { view, duration: 20 }), expected, view);
  }
});

test('copy with timestamps uses caption lines in the lines view', () => {
  assert.equal(
    lib.formatTranscript(transcript, { view: 'lines', copyTimestamps: true, duration: 20 }),
    '## Kapitel eins\n\n[0:00] Hallo\n[0:04] Welt.\n[0:08] Noch ein Satz.\n\n## Kapitel zwei\n\n[0:15] Zum Schluss.\n',
  );
});

test('copy with timestamps uses sentence ranges in the other views', () => {
  const expected = '## Kapitel eins\n\n[0:00–0:08] Hallo Welt.\n[0:08–0:15] Noch ein Satz.\n\n## Kapitel zwei\n\n[0:15–0:20] Zum Schluss.\n';
  for (const view of ['sentences', 'text']) {
    assert.equal(lib.formatTranscript(transcript, { view, copyTimestamps: true, duration: 20 }), expected, view);
  }
});

test('lib.js stays pure: no DOM or extension APIs', () => {
  for (const banned of [/\bdocument\./, /\bwindow\./, /\bchrome\.[a-z]/, /\bnavigator\./, /innerHTML/]) {
    assert.doesNotMatch(source, banned);
  }
});
