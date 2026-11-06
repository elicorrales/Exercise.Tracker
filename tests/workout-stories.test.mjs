// workout-stories.test.mjs
// Plays whole workouts the way the owner does, and pins what counts as the same workout,
// when the app asks, and what the set counts and previous count become.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './load-app-in-fake-page.mjs';

const ONE_HOUR = 3600;
const ONE_DAY = 86400;

test('a first workout never asks, and counts up', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    assert.equal(app.setCount('Bench'), 3);
});

test('Same Workout after a console time jump continues the count and stops asking', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.makeLastActivityLookThreeHoursOld();
    app.tapRow('Bench');
    assert.equal(app.visibleScreen(), 'question');
    app.click('noNewWorkoutBtn');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 4);
    app.waitSeconds(30);
    app.addSet('Bench');
    assert.equal(app.setCount('Bench'), 5);
});

test('New Workout after a console time jump restarts at 1 and keeps the old count', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.makeLastActivityLookThreeHoursOld();
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 1);
    assert.equal(app.storedExercise('Bench').prevWkNumSets, 3);
});

test('a real 3 hour gap asks, and Same Workout continues the count', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(3 * ONE_HOUR);
    app.tapRow('Bench');
    assert.equal(app.visibleScreen(), 'question');
    app.click('noNewWorkoutBtn');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 4);
});

test('a real 3 hour gap with New Workout restarts the count', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(3 * ONE_HOUR);
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 1);
});

test('Same Workout saves the time, so the next exercise does not ask', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(3 * ONE_HOUR);
    app.tapRow('Bench');
    app.click('noNewWorkoutBtn');
    app.click('cancelBtn');
    app.tapRow('Shrugs');
    assert.equal(app.visibleScreen(), 'add/del');
});

test('over 4 hours starts a new workout without asking', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(ONE_DAY);
    app.tapRow('Bench');
    assert.equal(app.visibleScreen(), 'add/del');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 1);
    assert.equal(app.storedExercise('Bench').prevWkNumSets, 3);
});

test('an exercise reached later in a new workout still restarts', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(ONE_DAY);
    app.addSet('Shrugs');
    app.waitSeconds(600);
    app.addSet('Bench');
    assert.equal(app.setCount('Bench'), 1);
});

test('Same Workout does not revive an exercise from an older workout', () => {
    const app = loadApp();
    app.addSets('Shrugs', 3);
    app.waitSeconds(ONE_DAY);
    app.addSet('Bench');
    app.waitSeconds(3 * ONE_HOUR);
    app.tapRow('Shrugs');
    app.click('noNewWorkoutBtn');
    app.click('addSetBtn');
    assert.equal(app.setCount('Shrugs'), 1);
    assert.equal(app.storedExercise('Shrugs').prevWkNumSets, 3);
});

test('a long workout with sets under 2 hours apart never asks', () => {
    const app = loadApp();
    app.addSet('Bench');
    app.waitSeconds(100 * 60);
    app.addSet('Bench');
    app.waitSeconds(100 * 60);
    app.addSet('Bench');
    assert.equal(app.setCount('Bench'), 3);
});

test('Del Set removes the latest set, and Add Set brings the count back', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.tapRow('Bench');
    app.click('delSetBtn');
    assert.equal(app.setCount('Bench'), 2);
    app.addSet('Bench');
    assert.equal(app.setCount('Bench'), 3);
});

test('Prev Wk Sets is right as soon as New Workout opens the dialog', () => {
    const app = loadApp();
    app.addSets('Bench', 5);
    app.makeLastActivityLookThreeHoursOld();
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    assert.match(app.dialogText(), /Prev Wk Sets:5$/);
});

test('Cancel after New Workout leaves the exercise as it was', () => {
    const app = loadApp();
    app.addSets('Bench', 5);
    app.makeLastActivityLookThreeHoursOld();
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    app.click('cancelBtn');
    assert.equal(app.setCount('Bench'), 5);
    assert.equal(app.visibleScreen(), 'list');
});

test('Prev Wk Sets stays correct after the first set of the new workout', () => {
    const app = loadApp();
    app.addSets('Bench', 5);
    app.makeLastActivityLookThreeHoursOld();
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    app.click('addSetBtn');
    app.waitSeconds(30);
    app.tapRow('Bench');
    assert.match(app.dialogText(), /Prev Wk Sets:5$/);
});

test('Same Workout keeps the stored Prev Wk Sets', () => {
    const app = loadApp();
    app.addSets('Bench', 5);
    app.makeLastActivityLookThreeHoursOld();
    app.tapRow('Bench');
    app.click('noNewWorkoutBtn');
    assert.match(app.dialogText(), /Prev Wk Sets:0$/);
});

test('a never-trained exercise shows no previous sets', () => {
    const app = loadApp();
    app.tapRow('Bench');
    assert.match(app.dialogText(), /Prev Wk Sets:0$/);
});

// Deleting the only set of a new workout returns the exercise to how it stood before it.
const startNewWorkoutWithOneSet = (app, exerciseName) => {
    app.waitSeconds(ONE_DAY);
    app.addSet(exerciseName);
};
const delLatestSet = (app, exerciseName) => {
    app.tapRow(exerciseName);
    app.click('delSetBtn');
};
const rowFor = (app, exerciseName) => app.rowsOnScreen().find((row) => row.name === exerciseName);

test('Del of the only set brings back the previous workout row', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(3 * ONE_HOUR);
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 1);
    app.tapRow('Bench');
    app.click('delSetBtn');
    const row = rowFor(app, 'Bench');
    assert.equal(row.sets, 3);
    assert.equal(row.elapsed, '3.0h');
    assert.equal(row.colour, 'gold');
});

test('Del of the only set brings back the count from two workouts ago as well', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    startNewWorkoutWithOneSet(app, 'Bench');
    app.addSet('Bench');
    startNewWorkoutWithOneSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    assert.equal(app.setCount('Bench'), 2);
    assert.equal(app.storedExercise('Bench').prevWkNumSets, 3);
});

test('after the restore, the dialog shows the restored workout as previous', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    startNewWorkoutWithOneSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    app.tapRow('Bench');
    assert.match(app.dialogText(), /Prev Wk Sets:3$/);
});

test('Add Set after the restore starts the new workout again', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    startNewWorkoutWithOneSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    app.addSet('Bench');
    assert.equal(app.setCount('Bench'), 1);
    assert.equal(app.storedExercise('Bench').prevWkNumSets, 3);
});

test('deleting back through a two set workout reaches the previous workout', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    startNewWorkoutWithOneSet(app, 'Bench');
    app.addSet('Bench');
    delLatestSet(app, 'Bench');
    assert.equal(app.setCount('Bench'), 1);
    delLatestSet(app, 'Bench');
    assert.equal(app.setCount('Bench'), 3);
});

test('Del of the only set of the first ever workout really is never done', () => {
    const app = loadApp();
    app.addSet('Bench');
    delLatestSet(app, 'Bench');
    const row = rowFor(app, 'Bench');
    assert.equal(row.sets, 0);
    assert.equal(row.colour, 'lightgrey');
});

test('Del with no sets at all changes nothing', () => {
    const app = loadApp();
    delLatestSet(app, 'Bench');
    assert.equal(app.setCount('Bench'), 0);
});

test('a restore happens once, so deleting on down does not bring the old count back again', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    startNewWorkoutWithOneSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    delLatestSet(app, 'Bench');
    assert.equal(app.setCount('Bench'), 0);
});
