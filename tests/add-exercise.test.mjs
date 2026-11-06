// add-exercise.test.mjs
// Pins adding a user's own exercise from Settings. It shares the name rules with rename, and
// nothing is saved until the name is accepted.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, pageMarkup } from './load-app-in-fake-page.mjs';

const appOnAddScreen = () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('addExerciseBtn');
    return app;
};

const addExercise = (app, typedName) => {
    app.click('settingsBtn');
    app.click('addExerciseBtn');
    app.typeExerciseToAdd(typedName);
    app.click('addConfirmBtn');
};

test('Add in Settings opens an empty name box', () => {
    const app = appOnAddScreen();
    assert.equal(app.visibleScreen(), 'add exercise');
    assert.equal(app.exerciseToAdd(), '');
    assert.equal(app.addMessage(), '');
});

test('the name box limits typing to 12 characters', () => {
    assert.match(pageMarkup, /id="addNameInput"[^>]*maxlength="12"/);
});

test('adding only highlights on press, and saves on release', () => {
    const app = appOnAddScreen();
    app.typeExerciseToAdd('Chest Fly');
    const storedBefore = JSON.stringify([...app.store]);
    app.pressOnly('addConfirmBtn');
    assert.equal(app.visibleScreen(), 'add exercise');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('a good name creates a never-done exercise, and returns to the list', () => {
    const app = loadApp();
    addExercise(app, '  Chest   Fly ');
    assert.equal(app.visibleScreen(), 'list');
    const row = app.rowsOnScreen().find((candidate) => candidate.name === 'Chest Fly');
    assert.equal(row.sets, 0);
    assert.equal(row.colour, 'lightgrey');
    assert.equal(app.rowsOnScreen().length, 19);
});

test('the list shows the new exercise straight away, without waiting for the timer', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    assert.match(app.listMarkup(), /Chest Fly/);
});

test('a new exercise gets the next id, and each add gets a new one', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    addExercise(app, 'Squat');
    assert.equal(app.exerciseId('Chest Fly'), 'exercise-19');
    assert.equal(app.exerciseId('Squat'), 'exercise-20');
});

test('a new exercise works like any other', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    app.addSets('Chest Fly', 2);
    assert.equal(app.setCount('Chest Fly'), 2);
    assert.equal(app.rowsOnScreen()[0].name, 'Chest Fly');
    app.waitSeconds(86400);
    app.addSet('Chest Fly');
    assert.equal(app.storedExercise('Chest Fly').prevWkNumSets, 2);
});

test('a new exercise can be renamed', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    assert.equal(app.exercisesInPicker().includes('Chest Fly'), true);
    app.pickExerciseToRename('Chest Fly');
    app.typeNewName('Squat');
    app.click('renameNextBtn');
    app.click('keepSetsBtn');
    assert.equal(app.exerciseId('Squat'), 'exercise-19');
});

for (const [typedName, reason] of [
    ['   ', 'Name is empty'],
    ['leg  PRESS', 'Name already used'],
    ['A'.repeat(13), 'Name too long'],
]) {
    test(`"${typedName}" is refused with ${reason}, keeping the typing and saving nothing`, () => {
        const app = appOnAddScreen();
        app.typeExerciseToAdd(typedName);
        const storedBefore = JSON.stringify([...app.store]);
        app.click('addConfirmBtn');
        assert.equal(app.visibleScreen(), 'add exercise');
        assert.equal(app.addMessage(), reason);
        assert.equal(app.exerciseToAdd(), typedName);
        assert.equal(JSON.stringify([...app.store]), storedBefore);
    });
}

test('a name added earlier counts as taken', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    addExercise(app, 'chest  FLY');
    assert.equal(app.addMessage(), 'Name already used');
    assert.equal(app.rowsOnScreen().length, 19);
});

test('Go Back returns to Settings, saving nothing', () => {
    const app = appOnAddScreen();
    app.typeExerciseToAdd('Chest Fly');
    const storedBefore = JSON.stringify([...app.store]);
    app.click('addBackBtn');
    assert.equal(app.visibleScreen(), 'settings');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('old typing and messages do not linger when Add is opened again', () => {
    const app = appOnAddScreen();
    app.typeExerciseToAdd('   ');
    app.click('addConfirmBtn');
    app.click('addBackBtn');
    app.click('addExerciseBtn');
    assert.equal(app.exerciseToAdd(), '');
    assert.equal(app.addMessage(), '');
});

test('the gear leaves the Add screen for Settings', () => {
    const app = appOnAddScreen();
    app.click('settingsBtn');
    assert.equal(app.visibleScreen(), 'settings');
});

test('a name with markup is safe in the list', () => {
    const app = loadApp();
    addExercise(app, '<b>x');
    app.rowsOnScreen();
    assert.doesNotMatch(app.listMarkup(), /<b>/);
});

test('Reset Everything removes added exercises and restarts the ids', () => {
    const app = loadApp();
    addExercise(app, 'Chest Fly');
    app.click('settingsBtn');
    app.click('resetBtn');
    app.click('confirmResetBtn');
    assert.equal(app.rowsOnScreen().length, 18);
    assert.equal(app.store.has('exercise:exercise-19'), false);
    addExercise(app, 'Squat');
    assert.equal(app.exerciseId('Squat'), 'exercise-19');
});

test('a browser kill between the two writes leaves no ghost, and the id is reused safely', () => {
    const app = loadApp();
    app.store.set('exercise:exercise-19', JSON.stringify({ id: 'exercise-19', name: 'Ghost', setidx: 0, secList: [0], prevWkNumSets: 0 }));
    const reopened = loadApp({ store: app.store, nowSeconds: app.now() });
    assert.equal(reopened.rowsOnScreen().length, 18);
    addExercise(reopened, 'Chest Fly');
    assert.equal(reopened.exerciseId('Chest Fly'), 'exercise-19');
    assert.equal(reopened.exerciseId('Ghost'), undefined);
});
