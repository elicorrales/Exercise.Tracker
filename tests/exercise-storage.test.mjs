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

test('saving writes straight through to storage, keyed by id', () => {
    const app = loadApp();
    const exercise = app.context.createBlankExercise('exercise-99', 'Bench');
    exercise.setidx = 7;
    app.context.saveExercise(exercise);
    assert.equal(JSON.parse(app.store.get('exercise:exercise-99')).setidx, 7);
});

test('reading always comes from storage, so nothing is cached in memory', () => {
    const app = loadApp();
    app.context.saveExercise(app.context.createBlankExercise('exercise-99', 'Bench'));
    assert.equal(app.context.readStoredExercise('exercise-99').setidx, 0);
    app.store.set('exercise:exercise-99', JSON.stringify({ id: 'exercise-99', name: 'Bench', setidx: 9, secList: [], prevWkNumSets: 0 }));
    assert.equal(app.context.readStoredExercise('exercise-99').setidx, 9);
});

test('reading an exercise that was never saved gives null', () => {
    assert.equal(loadApp().context.readStoredExercise('exercise-99'), null);
});

test('removing all exercises deletes every record and the catalog', () => {
    const app = loadApp();
    app.context.removeAllExercises();
    assert.deepEqual([...app.store.keys()].filter((key) => key.startsWith('exercise')), []);
});

test('with no catalog there are no exercise ids, rather than a crash', () => {
    const app = loadApp();
    app.store.clear();
    assert.equal(app.context.readExerciseIds().length, 0);
});

test('a blank exercise has its id and name, no sets, and holds up to 14', () => {
    const exercise = loadApp().context.createBlankExercise('exercise-99', 'Bench');
    assert.equal(exercise.id, 'exercise-99');
    assert.equal(exercise.name, 'Bench');
    assert.equal(exercise.setidx, 0);
    assert.equal(exercise.prevWkNumSets, 0);
    assert.equal(exercise.secList.length, 15);
});
