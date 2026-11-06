// exercise-storage.test.mjs
// Pins the storage seam: exercise records are only read and written in exercise-storage.js,
// and that file writes straight through, because a phone browser can be killed at any time.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './load-app-in-fake-page.mjs';

const SCRIPTS_FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts');

const scriptsOutsideStorage = () => readdirSync(SCRIPTS_FOLDER)
    .filter((file) => file !== 'exercise-storage.js')
    .map((file) => ({ file, source: readFileSync(join(SCRIPTS_FOLDER, file), 'utf8') }));

test('only exercise-storage.js turns exercise records into stored text and back', () => {
    const offenders = scriptsOutsideStorage().filter(({ source }) => /JSON\.(parse|stringify)/.test(source));
    assert.deepEqual(offenders.map(({ file }) => file), []);
});

test('saving writes straight through to storage', () => {
    const app = loadApp();
    const exercise = app.context.createBlankExercise('Bench');
    exercise.setidx = 7;
    app.context.saveExercise(exercise);
    assert.equal(JSON.parse(app.store.get('Bench')).setidx, 7);
});

test('reading always comes from storage, so nothing is cached in memory', () => {
    const app = loadApp();
    app.context.saveExercise(app.context.createBlankExercise('Bench'));
    assert.equal(app.context.readStoredExercise('Bench').setidx, 0);
    app.store.set('Bench', JSON.stringify({ name: 'Bench', setidx: 9, secList: [], prevWkNumSets: 0 }));
    assert.equal(app.context.readStoredExercise('Bench').setidx, 9);
});

test('reading an exercise that was never saved gives null', () => {
    const app = loadApp();
    app.store.delete('Bench');
    assert.equal(app.context.readStoredExercise('Bench'), null);
});

test('removing an exercise deletes its record', () => {
    const app = loadApp();
    app.context.removeStoredExercise('Bench');
    assert.equal(app.store.has('Bench'), false);
});

test('a blank exercise has no sets and holds up to 14', () => {
    const exercise = loadApp().context.createBlankExercise('Bench');
    assert.equal(exercise.name, 'Bench');
    assert.equal(exercise.setidx, 0);
    assert.equal(exercise.prevWkNumSets, 0);
    assert.equal(exercise.secList.length, 15);
});
