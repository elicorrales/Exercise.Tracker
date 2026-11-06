// rename-exercise.test.mjs
// Pins the rename flow: Settings, pick an exercise, type a name, then keep or clear its sets.
// A rename may be a name fix, or the slot may be reused for a different exercise, so the app
// always asks. Nothing is saved until the user answers.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, pageMarkup } from './load-app-in-fake-page.mjs';

const ONE_DAY = 86400;

const appAskingAboutSets = (typedName = 'Chest Fly') => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(ONE_DAY);
    app.addSets('Bench', 2);
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Bench');
    app.typeNewName(typedName);
    app.click('renameNextBtn');
    return app;
};

const reopenBrowser = (app) => loadApp({ store: app.store, nowSeconds: app.now() });

test('Rename in Settings opens a picker listing every exercise', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    assert.equal(app.visibleScreen(), 'rename picker');
    assert.equal(app.exercisesInPicker().length, 18);
    assert.equal(app.exercisesInPicker()[0], 'Crunches');
});

test('picking an exercise opens the entry with its name filled in', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Bench');
    assert.equal(app.visibleScreen(), 'rename entry');
    assert.equal(app.typedName(), 'Bench');
    assert.equal(app.renameMessage(), '');
});

test('the name box limits typing to 12 characters', () => {
    assert.match(pageMarkup, /id="renameNameInput"[^>]*maxlength="12"/);
});

test('Next shows why a name was refused, and stays on the entry with the typing kept', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Bench');
    app.typeNewName('leg  press');
    app.click('renameNextBtn');
    assert.equal(app.visibleScreen(), 'rename entry');
    assert.equal(app.renameMessage(), 'Name already used');
    assert.equal(app.typedName(), 'leg  press');
});

test('a good name moves on to the sets question, and nothing is saved yet', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Bench');
    app.typeNewName('Chest Fly');
    const storedBefore = JSON.stringify([...app.store]);
    app.click('renameNextBtn');
    assert.equal(app.visibleScreen(), 'rename sets question');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('a refused message does not linger after going back and picking again', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Bench');
    app.typeNewName('   ');
    app.click('renameNextBtn');
    app.click('renameEntryBackBtn');
    app.pickExerciseToRename('Shrugs');
    assert.equal(app.renameMessage(), '');
    assert.equal(app.typedName(), 'Shrugs');
});

test('the buttons run Save, Clear, Go Back', () => {
    const start = pageMarkup.indexOf('id="renameSetsModal"');
    const dialogMarkup = pageMarkup.slice(start, pageMarkup.indexOf('</div>', start));
    const buttons = [...dialogMarkup.matchAll(/<label class="exerciseModalBtn" id="(\w+)"/g)].map((match) => match[1]);
    assert.deepEqual(buttons, ['keepSetsBtn', 'clearSetsBtn', 'renameSetsBackBtn']);
});

const appRenaming = (exerciseName) => (app) => {
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename(exerciseName);
    app.typeNewName('Chest Fly');
    app.click('renameNextBtn');
};

test('an exercise with history offers Save Set Hist and Clear Set Hist', () => {
    const app = appAskingAboutSets();
    assert.equal(app.saveButtonText(), 'Save Set Hist');
    assert.equal(app.clearButtonIsOffered(), true);
});

test('a never-done exercise offers only Save', () => {
    const app = loadApp();
    appRenaming('Bench')(app);
    assert.equal(app.visibleScreen(), 'rename sets question');
    assert.equal(app.saveButtonText(), 'Save');
    assert.equal(app.clearButtonIsOffered(), false);
});

test('Save on a never-done exercise renames it', () => {
    const app = loadApp();
    appRenaming('Bench')(app);
    app.click('keepSetsBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(app.setCount('Chest Fly'), 0);
});

test('current sets alone count as history', () => {
    const app = loadApp();
    app.addSet('Bench');
    appRenaming('Bench')(app);
    assert.equal(app.clearButtonIsOffered(), true);
});

test('a previous count alone counts as history', () => {
    const app = loadApp();
    const exercise = app.storedExercise('Bench');
    exercise.prevWkNumSets = 2;
    app.context.saveExercise(exercise);
    appRenaming('Bench')(app);
    assert.equal(app.clearButtonIsOffered(), true);
});

test('a kept undo state alone counts as history', () => {
    const app = loadApp();
    const exercise = app.storedExercise('Bench');
    exercise.stateBeforeThisWorkout = { setidx: 2, secList: [0, 1, 2], prevWkNumSets: 0 };
    app.context.saveExercise(exercise);
    appRenaming('Bench')(app);
    assert.equal(app.clearButtonIsOffered(), true);
});

test('deleting a first ever set leaves no history', () => {
    const app = loadApp();
    app.addSet('Bench');
    app.tapRow('Bench');
    app.click('delSetBtn');
    appRenaming('Bench')(app);
    assert.equal(app.clearButtonIsOffered(), false);
});

test('after Clear Set Hist, renaming again offers only Save', () => {
    const app = appAskingAboutSets();
    app.click('clearSetsBtn');
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Chest Fly');
    app.typeNewName('Squat');
    app.click('renameNextBtn');
    assert.equal(app.clearButtonIsOffered(), false);
});

test('the buttons change back when the next rename has history', () => {
    const app = loadApp();
    app.addSet('Shrugs');
    appRenaming('Bench')(app);
    app.click('renameSetsBackBtn');
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Shrugs');
    app.typeNewName('Rows');
    app.click('renameNextBtn');
    assert.equal(app.saveButtonText(), 'Save Set Hist');
    assert.equal(app.clearButtonIsOffered(), true);
});

test('the question shows the new name, safely', () => {
    assert.equal(appAskingAboutSets('Chest Fly').renameTitle(), 'Chest Fly');
    assert.doesNotMatch(appAskingAboutSets('<b>x').renameTitle(), /<b>/);
});

test('Keep Sets changes only the name, and returns to the list', () => {
    const app = appAskingAboutSets('  Chest   Fly ');
    const before = app.storedExercise('Bench');
    app.click('keepSetsBtn');
    assert.equal(app.visibleScreen(), 'list');
    const after = app.storedExercise('Chest Fly');
    assert.equal(after.id, before.id);
    assert.deepEqual({ ...after, name: '' }, { ...before, name: '' });
    assert.equal(app.rowsOnScreen().find((row) => row.name === 'Chest Fly').sets, 2);
});

test('the list shows the new name straight away, without waiting for the timer', () => {
    const app = appAskingAboutSets();
    app.click('keepSetsBtn');
    assert.match(app.listMarkup(), /Chest Fly/);
});

test('Clear Sets renames and makes the exercise never done, keeping its id', () => {
    const app = appAskingAboutSets();
    const id = app.exerciseId('Bench');
    app.click('clearSetsBtn');
    assert.equal(app.visibleScreen(), 'list');
    const after = app.storedExercise('Chest Fly');
    assert.equal(after.id, id);
    assert.equal(after.setidx, 0);
    assert.equal(after.prevWkNumSets, 0);
    assert.equal(after.stateBeforeThisWorkout, undefined);
    assert.equal(after.secList.every((seconds) => seconds === 0), true);
    assert.equal(app.rowsOnScreen().find((row) => row.name === 'Chest Fly').colour, 'lightgrey');
});

test('pressing Clear Sets without releasing on it changes nothing', () => {
    const app = appAskingAboutSets();
    const storedBefore = JSON.stringify([...app.store]);
    app.pressOnly('clearSetsBtn');
    assert.equal(app.visibleScreen(), 'rename sets question');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('Go Back from the sets question goes all the way to the list, saving nothing', () => {
    const app = appAskingAboutSets();
    const storedBefore = JSON.stringify([...app.store]);
    app.click('renameSetsBackBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('Go Back walks entry to picker to Settings', () => {
    const app = loadApp();
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    app.pickExerciseToRename('Bench');
    app.click('renameEntryBackBtn');
    assert.equal(app.visibleScreen(), 'rename picker');
    app.click('renamePickerBackBtn');
    assert.equal(app.visibleScreen(), 'settings');
});

test('the gear leaves every rename screen for Settings', () => {
    const openScreens = [
        (app) => { app.click('renameExerciseBtn'); },
        (app) => { app.click('renameExerciseBtn'); app.pickExerciseToRename('Bench'); },
        (app) => { app.click('renameExerciseBtn'); app.pickExerciseToRename('Bench'); app.typeNewName('Chest Fly'); app.click('renameNextBtn'); },
    ];
    for (const openScreen of openScreens) {
        const app = loadApp();
        app.click('settingsBtn');
        openScreen(app);
        app.click('settingsBtn');
        assert.equal(app.visibleScreen(), 'settings');
    }
});

test('the new name shows in the picker next time', () => {
    const app = appAskingAboutSets();
    app.click('keepSetsBtn');
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    assert.equal(app.exercisesInPicker().includes('Chest Fly'), true);
    assert.equal(app.exercisesInPicker().includes('Bench'), false);
});

test('the old name is free again after a rename', () => {
    const app = appAskingAboutSets();
    app.click('keepSetsBtn');
    assert.equal(app.context.reasonExerciseNameCannotBeUsed('Bench', app.exerciseId('Shrugs')), '');
});

test('a name with markup is safe in the picker', () => {
    const app = appAskingAboutSets('<b>x');
    app.click('keepSetsBtn');
    app.click('settingsBtn');
    app.click('renameExerciseBtn');
    assert.doesNotMatch(app.pickerMarkup(), /<b>/);
});

test('a kill before answering the sets question keeps the old name', () => {
    const app = appAskingAboutSets();
    assert.equal(reopenBrowser(app).setCount('Bench'), 2);
});

test('Keep Sets survives a browser kill straight after', () => {
    const app = appAskingAboutSets();
    app.click('keepSetsBtn');
    assert.equal(reopenBrowser(app).setCount('Chest Fly'), 2);
});

test('Clear Sets survives a browser kill straight after', () => {
    const app = appAskingAboutSets();
    app.click('clearSetsBtn');
    assert.equal(reopenBrowser(app).setCount('Chest Fly'), 0);
});
