// saved-immediately.test.mjs
// Pins the project law: every user choice is in localStorage the moment it is made, because
// a phone browser can be killed at any time. Each test acts, then "reopens the browser" from
// the same storage with nothing else carried over, and checks that the choice survived.
// New user actions, such as creating or renaming an exercise, get a test here.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './load-app-in-fake-page.mjs';

const THREE_HOURS = 3 * 3600;

const reopenBrowser = (app) => loadApp({ store: app.store, nowSeconds: app.now() });

test('Add Set is saved on the press, before the release', () => {
    const app = loadApp();
    app.tapRow('Bench');
    app.pressOnly('addSetBtn');
    assert.equal(reopenBrowser(app).setCount('Bench'), 1);
});

test('Del Set is saved on the press, before the release', () => {
    const app = loadApp();
    app.addSets('Bench', 2);
    app.tapRow('Bench');
    app.pressOnly('delSetBtn');
    assert.equal(reopenBrowser(app).setCount('Bench'), 1);
});

test('Del of the only set of a new workout is saved on the press', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(86400);
    app.addSet('Bench');
    app.tapRow('Bench');
    app.pressOnly('delSetBtn');
    assert.equal(reopenBrowser(app).setCount('Bench'), 3);
});

test('Same Workout survives a browser kill straight after choosing it', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(THREE_HOURS);
    app.tapRow('Bench');
    app.click('noNewWorkoutBtn');
    const reopened = reopenBrowser(app);
    reopened.tapRow('Bench');
    assert.equal(reopened.visibleScreen(), 'add/del');
    reopened.click('addSetBtn');
    assert.equal(reopened.setCount('Bench'), 4);
});

test('New Workout survives a browser kill straight after choosing it', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.waitSeconds(THREE_HOURS);
    app.tapRow('Bench');
    app.click('yesNewWorkoutBtn');
    const reopened = reopenBrowser(app);
    reopened.tapRow('Bench');
    reopened.click('addSetBtn');
    assert.equal(reopened.setCount('Bench'), 1);
    assert.equal(reopened.storedExercise('Bench').prevWkNumSets, 3);
});

test('a confirmed Reset Everything survives a browser kill straight after', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.click('settingsBtn');
    app.click('resetBtn');
    app.click('confirmResetBtn');
    const reopened = reopenBrowser(app);
    assert.equal(reopened.setCount('Bench'), 0);
    assert.equal(reopened.workoutTimeText(), '0s');
});

test('a reopened browser draws the same list', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.addSets('Shrugs', 1);
    assert.deepEqual(reopenBrowser(app).rowsOnScreen(), app.rowsOnScreen());
});
