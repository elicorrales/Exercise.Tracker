// exercise-name-rules.test.mjs
// Pins what a typed exercise name may be, and that typed names cannot break the page.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './load-app-in-fake-page.mjs';

test('a name is saved with clean spacing and the capitals the user typed', () => {
    const { cleanExerciseName } = loadApp().context;
    assert.equal(cleanExerciseName('  Chest   Fly '), 'Chest Fly');
    assert.equal(cleanExerciseName('Chest \t Fly'), 'Chest Fly');
    assert.equal(cleanExerciseName('LEG press'), 'LEG press');
});

test('names compare without regard to capitals or spacing', () => {
    const { exerciseNameComparisonKey } = loadApp().context;
    assert.equal(exerciseNameComparisonKey('  leg   PRESS '), exerciseNameComparisonKey('Leg Press'));
    assert.notEqual(exerciseNameComparisonKey('LegPress'), exerciseNameComparisonKey('Leg Press'));
});

test('an accented letter compares equal however the phone encoded it', () => {
    const { exerciseNameComparisonKey } = loadApp().context;
    assert.equal(exerciseNameComparisonKey('Café'), exerciseNameComparisonKey('Café'));
    assert.notEqual(exerciseNameComparisonKey('Café'), exerciseNameComparisonKey('Cafe'));
});

const reasonFor = (typedName, nameOfExerciseBeingRenamed) => {
    const app = loadApp();
    return app.context.reasonExerciseNameCannotBeUsed(typedName, app.exerciseId(nameOfExerciseBeingRenamed));
};

test('a free name can be used', () => {
    assert.equal(reasonFor('Chest Fly', 'Bench'), '');
});

test('a blank name is refused', () => {
    assert.equal(reasonFor('    ', 'Bench'), 'Name is empty');
});

test('a name used by another exercise is refused, whatever its capitals and spacing', () => {
    assert.equal(reasonFor('  leg   PRESS ', 'Bench'), 'Name already used');
});

test('an exercise may change only the capitals of its own name', () => {
    assert.equal(reasonFor('BENCH', 'Bench'), '');
});

test('the same name exactly is refused, because nothing would change', () => {
    assert.equal(reasonFor('  Bench ', 'Bench'), 'Name not changed');
});

test('12 characters is allowed and 13 is refused, counted after cleaning', () => {
    assert.equal(reasonFor('A'.repeat(12), 'Bench'), '');
    assert.equal(reasonFor('A'.repeat(13), 'Bench'), 'Name too long');
    assert.equal(reasonFor(`   ${'A'.repeat(12)}   `, 'Bench'), '');
});

test('a brand new name follows the same rules, with no exercise of its own to skip', () => {
    const { reasonNewExerciseNameCannotBeUsed } = loadApp().context;
    assert.equal(reasonNewExerciseNameCannotBeUsed('Chest Fly'), '');
    assert.equal(reasonNewExerciseNameCannotBeUsed('  '), 'Name is empty');
    assert.equal(reasonNewExerciseNameCannotBeUsed('BENCH'), 'Name already used');
    assert.equal(reasonNewExerciseNameCannotBeUsed('A'.repeat(13)), 'Name too long');
});

test('the defaults all pass the rules: no clashes and none too long', () => {
    const app = loadApp();
    const { exerciseNameComparisonKey, readStoredExercise, readExerciseIds } = app.context;
    const names = [...readExerciseIds()].map((id) => readStoredExercise(id).name);
    assert.equal(new Set(names.map(exerciseNameComparisonKey)).size, 18);
    assert.equal(names.every((name) => name.length <= 12), true);
});

test('page text escaping covers every character that can break markup', () => {
    const { escapeTextForPage } = loadApp().context;
    assert.equal(escapeTextForPage(`<b>&"'`), '&lt;b&gt;&amp;&quot;&#39;');
});

const appWithTypedName = (typedName) => {
    const app = loadApp();
    const exercise = app.storedExercise('Bench');
    exercise.name = typedName;
    app.context.saveExercise(exercise);
    return app;
};

test('a typed name with markup cannot add markup to the list', () => {
    const app = appWithTypedName('<img src=x>');
    app.rowsOnScreen();
    assert.doesNotMatch(app.listMarkup(), /<img/);
    assert.match(app.listMarkup(), /&lt;img src=x&gt;/);
});

test('a typed name with markup cannot add markup to either dialog', () => {
    const app = appWithTypedName('<i>"x');
    const id = [...app.context.readExerciseIds()][4];
    app.tapRowById(id);
    assert.doesNotMatch(app.dialogText(), /<i>/);
    app.context.showIsThisNewWorkoutModalDialog(id);
    assert.doesNotMatch(app.questionText(), /<i>/);
});
