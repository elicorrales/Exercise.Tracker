// press-and-release.test.mjs
// Pins which action happens on press and which on release. A dialog that opens on press sits
// under the pointer and catches the release, which is how Same Workout used to flash closed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, functionsCalledByMarkup } from './load-app-in-fake-page.mjs';

const THREE_HOURS = 3 * 3600;

const appShowingTheQuestion = () => {
    const app = loadApp();
    app.addSets('Bench', 2);
    app.waitSeconds(THREE_HOURS);
    app.tapRow('Bench');
    return app;
};

for (const [label, buttonId] of [['Same Workout', 'noNewWorkoutBtn'], ['New Workout', 'yesNewWorkoutBtn']]) {
    test(`${label} only highlights on press`, () => {
        const app = appShowingTheQuestion();
        const storedBefore = JSON.stringify([...app.store]);
        app.pressOnly(buttonId);
        assert.equal(app.visibleScreen(), 'question');
        assert.equal(JSON.stringify([...app.store]), storedBefore);
    });

    test(`${label} opens the add/del dialog on release`, () => {
        const app = appShowingTheQuestion();
        app.click(buttonId);
        assert.equal(app.visibleScreen(), 'add/del');
    });
}

test('Go Back returns to the list without changing anything', () => {
    const app = appShowingTheQuestion();
    const storedBefore = JSON.stringify([...app.store]);
    app.click('cancelDecidingNewWorkoutBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('every add/del button returns to the list on release', () => {
    for (const buttonId of ['addSetBtn', 'delSetBtn', 'cancelBtn']) {
        const app = loadApp();
        app.tapRow('Bench');
        app.click(buttonId);
        assert.equal(app.visibleScreen(), 'list', buttonId);
    }
});

test('every function the markup calls exists', () => {
    const app = loadApp();
    const missing = functionsCalledByMarkup().filter((name) => typeof app.context[name] !== 'function');
    assert.deepEqual(missing, []);
});
