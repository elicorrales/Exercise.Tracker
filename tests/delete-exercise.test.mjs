// delete-exercise.test.mjs
// Pins deleting an exercise from Settings. A delete cannot be undone, so it always confirms,
// acts on release, and its id is never given to another exercise.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, pageMarkup } from './load-app-in-fake-page.mjs';

const appConfirmingDelete = (exerciseName = 'Bench') => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.click('settingsBtn');
    app.click('deleteExerciseBtn');
    app.pickExerciseToDelete(exerciseName);
    return app;
};

const deleteExercise = (app, exerciseName) => {
    app.click('settingsBtn');
    app.click('deleteExerciseBtn');
    app.pickExerciseToDelete(exerciseName);
    app.click('confirmDeleteBtn');
};

const addExercise = (app, typedName) => {
    app.click('settingsBtn');
    app.click('addExerciseBtn');
    app.typeExerciseToAdd(typedName);
    app.click('addConfirmBtn');
};

test('Delete Exer in Settings opens a picker listing every exercise', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('deleteExerciseBtn');
    assert.equal(app.visibleScreen(), 'delete picker');
    assert.equal(app.exercisesInDeletePicker().length, 18);
    assert.equal(app.exercisesInDeletePicker()[0], 'Crunches');
});

test('picking an exercise asks to confirm, shows its name, and deletes nothing yet', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.click('settingsBtn');
    app.click('deleteExerciseBtn');
    const storedBefore = JSON.stringify([...app.store]);
    app.pickExerciseToDelete('Bench');
    assert.equal(app.visibleScreen(), 'delete confirmation');
    assert.equal(app.deleteTitle(), 'Bench');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('pressing Yes without releasing on it deletes nothing', () => {
    const app = appConfirmingDelete();
    const storedBefore = JSON.stringify([...app.store]);
    app.pressOnly('confirmDeleteBtn');
    assert.equal(app.visibleScreen(), 'delete confirmation');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('Yes removes the exercise and returns to the list straight away', () => {
    const app = appConfirmingDelete();
    const id = app.exerciseId('Bench');
    app.click('confirmDeleteBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.doesNotMatch(app.listMarkup(), /Bench/);
    assert.equal(app.rowsOnScreen().length, 17);
    assert.equal(app.context.readStoredExercise(id), null);
    assert.equal([...app.context.readExerciseIds()].includes(id), false);
});

test('Go Back from the confirmation goes to the list, deleting nothing', () => {
    const app = appConfirmingDelete();
    const storedBefore = JSON.stringify([...app.store]);
    app.click('cancelDeleteBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('Go Back from the picker returns to Settings', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('deleteExerciseBtn');
    app.click('deletePickerBackBtn');
    assert.equal(app.visibleScreen(), 'settings');
});

test('the gear leaves both delete screens for Settings', () => {
    const app = appConfirmingDelete();
    app.click('settingsBtn');
    assert.equal(app.visibleScreen(), 'settings');
    app.click('deleteExerciseBtn');
    app.click('settingsBtn');
    assert.equal(app.visibleScreen(), 'settings');
});

test('other exercises keep their sets', () => {
    const app = loadApp();
    app.addSets('Shrugs', 2);
    deleteExercise(app, 'Bench');
    assert.equal(app.setCount('Shrugs'), 2);
});

test('a deleted id is never given out again', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    assert.equal(app.exerciseId('Chest Fly'), 'exercise-19');
    deleteExercise(app, 'Chest Fly');
    addExercise(app, 'Squat');
    assert.equal(app.exerciseId('Squat'), 'exercise-20');
});

test('a deleted name is free to use again, with no old sets', () => {
    const app = appConfirmingDelete();
    app.click('confirmDeleteBtn');
    addExercise(app, 'Bench');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(app.setCount('Bench'), 0);
});

test('a delete survives a browser kill straight after', () => {
    const app = appConfirmingDelete();
    app.click('confirmDeleteBtn');
    const reopened = loadApp({ store: app.store, nowSeconds: app.now() });
    assert.equal(reopened.rowsOnScreen().some((row) => row.name === 'Bench'), false);
});

test('a kill between the two delete writes leaves the exercise gone', () => {
    const app = loadApp();
    const id = app.exerciseId('Bench');
    const record = app.store.get(`exercise:${id}`);
    deleteExercise(app, 'Bench');
    app.store.set(`exercise:${id}`, record);
    const reopened = loadApp({ store: app.store, nowSeconds: app.now() });
    assert.equal(reopened.rowsOnScreen().length, 17);
});

test('with every exercise deleted, the list stays empty, and Add still works', () => {
    const app = loadApp();
    [...app.context.readExerciseIds()].forEach((id) => {
        deleteExercise(app, app.context.readStoredExercise(id).name);
    });
    assert.equal(app.rowsOnScreen().length, 0);
    const reopened = loadApp({ store: app.store, nowSeconds: app.now() });
    assert.equal(reopened.rowsOnScreen().length, 0);
    addExercise(reopened, 'Squat');
    assert.equal(reopened.exerciseId('Squat'), 'exercise-19');
});

test('Reset Everything brings the defaults back after deletes', () => {
    const app = loadApp();
    deleteExercise(app, 'Bench');
    app.click('settingsBtn');
    app.click('resetBtn');
    app.click('confirmResetBtn');
    assert.equal(app.rowsOnScreen().length, 18);
});

test('a name with markup is safe in the delete screens', () => {
    const app = loadApp();
    addExercise(app, '<b>x');
    app.click('settingsBtn');
    app.click('deleteExerciseBtn');
    assert.doesNotMatch(app.deletePickerMarkup(), /<b>/);
    app.pickExerciseToDelete('<b>x');
    assert.doesNotMatch(app.deleteTitle(), /<b>/);
});

test('the confirmation runs Yes, Delete then Go Back', () => {
    const start = pageMarkup.indexOf('id="deleteConfirmationModal"');
    const dialogMarkup = pageMarkup.slice(start, pageMarkup.indexOf('</div>', start));
    const labels = [...dialogMarkup.matchAll(/>([^<>]+)<\/label>/g)].map((match) => match[1]);
    assert.deepEqual(labels, ['Yes, Delete', 'Go Back']);
});
