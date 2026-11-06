// exercise-ids.test.mjs
// Pins permanent exercise ids: an exercise's id never changes, its name can, and everything
// the app does follows the id. This is what renaming and user-created exercises rest on.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './load-app-in-fake-page.mjs';

const THREE_HOURS = 3 * 3600;

const renameInStorage = (app, oldName, newName) => {
    const exercise = app.storedExercise(oldName);
    exercise.name = newName;
    app.context.saveExercise(exercise);
};

const reopenBrowser = (app) => loadApp({ store: app.store, nowSeconds: app.now() });

test('a first load creates all 18 default exercises, each with its own id', () => {
    const app = loadApp();
    const ids = [...app.context.readExerciseIds()];
    assert.equal(ids.length, 18);
    assert.equal(new Set(ids).size, 18);
    assert.equal(app.context.readStoredExercise(ids[0]).name, 'Crunches');
    assert.equal(app.context.readStoredExercise(ids[17]).name, 'Abducts');
});

test('reopening the browser keeps the same ids and does not overwrite sets', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    const idsBefore = [...app.context.readExerciseIds()];
    const reopened = reopenBrowser(app);
    assert.deepEqual([...reopened.context.readExerciseIds()], idsBefore);
    assert.equal(reopened.setCount('Bench'), 3);
});

test('a browser kill part way through the first load finishes on the next load', () => {
    const app = loadApp();
    app.store.delete('exerciseCatalog');
    app.store.delete(`exercise:${[...app.context.readExerciseIds()][5] ?? 'exercise-6'}`);
    const reopened = reopenBrowser(app);
    assert.equal(reopened.rowsOnScreen().length, 18);
});

test('the catalog is written last, so its presence means the first load finished', () => {
    const app = loadApp();
    assert.equal([...app.store.keys()].filter((key) => key.startsWith('exercise:')).length, 18);
    assert.equal([...app.store.keys()].indexOf('exerciseCatalog') > [...app.store.keys()].indexOf('exercise:exercise-18'), true);
});

test('a new name shows in the list, and the sets stay with the exercise', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    renameInStorage(app, 'Bench', 'Chest Press');
    const row = app.rowsOnScreen().find((candidate) => candidate.name === 'Chest Press');
    assert.equal(row.sets, 3);
    assert.equal(app.rowsOnScreen().some((candidate) => candidate.name === 'Bench'), false);
});

test('a renamed exercise keeps working through every action', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    renameInStorage(app, 'Bench', 'Chest Press');
    app.addSet('Chest Press');
    assert.equal(app.setCount('Chest Press'), 4);
    app.tapRow('Chest Press');
    app.click('delSetBtn');
    assert.equal(app.setCount('Chest Press'), 3);
    app.waitSeconds(86400);
    app.addSet('Chest Press');
    assert.equal(app.storedExercise('Chest Press').prevWkNumSets, 3);
});

test('the add/del dialog shows the name, and carries the id', () => {
    const app = loadApp();
    app.tapRow('Bench');
    assert.match(app.dialogText(), /^Bench<br\/>/);
    assert.equal(app.dialogExerciseId('exerciseActionsModal'), app.exerciseId('Bench'));
});

test('the workout question shows the name, and carries the id', () => {
    const app = loadApp();
    app.addSet('Bench');
    app.waitSeconds(THREE_HOURS);
    app.tapRow('Bench');
    assert.equal(app.questionText(), 'Bench');
    assert.equal(app.dialogExerciseId('isItNewWorkoutModal'), app.exerciseId('Bench'));
});

test('a row carries the id for the tap, and shows the name to the user', () => {
    const app = loadApp();
    app.rowsOnScreen();
    assert.match(app.listMarkup(), new RegExp(`name="${app.exerciseId('Bench')}"`));
    assert.doesNotMatch(app.listMarkup(), /name="Bench"/);
});

test('sets follow the id, not the name, even if storage ever holds a clash', () => {
    const app = loadApp();
    const benchId = app.exerciseId('Bench');
    renameInStorage(app, 'Shrugs', 'Bench');
    app.tapRowById(benchId);
    app.click('addSetBtn');
    assert.equal(app.rowsOnScreen().filter((row) => row.name === 'Bench').map((row) => row.sets).sort().join(), '0,1');
});

test('Reset Everything brings back all 18 defaults at zero', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    renameInStorage(app, 'Bench', 'Chest Press');
    app.click('settingsBtn');
    app.click('resetBtn');
    app.click('confirmResetBtn');
    const rows = app.rowsOnScreen();
    assert.equal(rows.length, 18);
    assert.equal(rows.every((row) => row.sets === 0), true);
    assert.equal(rows.some((row) => row.name === 'Bench'), true);
});
