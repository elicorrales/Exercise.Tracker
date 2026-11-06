// workout-time-storage.test.mjs
// Pins the whole storage seam: only the two storage files touch localStorage, and the
// workout times write straight through, because a phone browser can be killed at any time.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './load-app-in-fake-page.mjs';

const SCRIPTS_FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts');
const STORAGE_FILES = ['exercise-storage.js', 'workout-time-storage.js'];

const scriptSource = (file) => readFileSync(join(SCRIPTS_FOLDER, file), 'utf8');

test('only the two storage files touch localStorage', () => {
    const offenders = readdirSync(SCRIPTS_FOLDER)
        .filter((file) => !STORAGE_FILES.includes(file))
        .filter((file) => /localStorage\./.test(scriptSource(file)));
    assert.deepEqual(offenders, []);
});

test('the unused last-exercise key is gone', () => {
    const offenders = readdirSync(SCRIPTS_FOLDER).filter((file) => scriptSource(file).includes('theLastExerciseSetAdded'));
    assert.deepEqual(offenders, []);
});

test('saving a workout time writes straight through to storage', () => {
    const app = loadApp();
    app.context.saveWorkoutStartedAtSeconds(1234);
    app.context.saveWorkoutLatestActivityAtSeconds(5678);
    assert.equal(app.store.get('currentWorkoutStartedAtSeconds'), '1234');
    assert.equal(app.store.get('currentWorkoutLatestSetAtSeconds'), '5678');
});

test('reading a workout time always comes from storage, as a number', () => {
    const app = loadApp();
    app.store.set('currentWorkoutStartedAtSeconds', '1234');
    app.store.set('currentWorkoutLatestSetAtSeconds', '5678');
    assert.equal(app.context.readWorkoutStartedAtSeconds(), 1234);
    assert.equal(app.context.readWorkoutLatestActivityAtSeconds(), 5678);
});

test('removing the workout times clears both', () => {
    const app = loadApp();
    app.context.removeWorkoutTimes();
    assert.equal(app.store.has('currentWorkoutStartedAtSeconds'), false);
    assert.equal(app.store.has('currentWorkoutLatestSetAtSeconds'), false);
});

test('the worked time is last activity minus workout start', () => {
    const app = loadApp();
    app.addSet('Bench');
    app.waitSeconds(600);
    app.addSet('Bench');
    app.context.displayWorkoutTime();
    assert.equal(app.workoutTimeText(), '10.5m');
});
