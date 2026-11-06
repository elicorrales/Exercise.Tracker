// settings-dialog.test.mjs
// Pins the gear button and the Settings dialog, where account-wide actions live so they stay
// out of the add/del dialog. Exercise management will be tested here as it arrives.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, pageMarkup } from './load-app-in-fake-page.mjs';

const markupOfDialog = (dialogId) => {
    const start = pageMarkup.indexOf(`id="${dialogId}"`);
    return pageMarkup.slice(start, pageMarkup.indexOf('</div>', start));
};

test('the header reads gear, then Worked:, then the workout time, with no clock', () => {
    assert.match(pageMarkup, /id="settingsBtn"[\s\S]*?&#9881;[\s\S]*?Worked:[\s\S]*?id="currentWorkoutTime"/);
    assert.doesNotMatch(pageMarkup, /Workout:/);
    assert.doesNotMatch(pageMarkup, /id="currentTime"/);
});

test('the workout time still shows after startup', () => {
    assert.equal(loadApp().workoutTimeText(), '0s');
});

test('the gear only highlights on press, and opens Settings on release', () => {
    const app = loadApp();
    app.pressOnly('settingsBtn');
    assert.equal(app.visibleScreen(), 'list');
    app.releaseOnly('settingsBtn');
    assert.equal(app.visibleScreen(), 'settings');
});

test('Close returns to the list and changes nothing', () => {
    const app = loadApp();
    app.addSets('Bench', 2);
    app.click('settingsBtn');
    const storedBefore = JSON.stringify([...app.store]);
    app.click('closeSettingsBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('the gear replaces an open dialog, and Close still returns to the list', () => {
    for (const openDialog of ['add/del', 'question']) {
        const app = loadApp();
        app.addSet('Bench');
        if (openDialog === 'question') app.waitSeconds(3 * 3600);
        app.tapRow('Bench');
        assert.equal(app.visibleScreen(), openDialog);
        app.click('settingsBtn');
        assert.equal(app.visibleScreen(), 'settings');
        app.click('closeSettingsBtn');
        assert.equal(app.visibleScreen(), 'list');
    }
});

const appAskingToConfirmReset = () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.click('settingsBtn');
    app.click('resetBtn');
    return app;
};

test('Reset Everything only asks, and changes nothing yet', () => {
    const app = loadApp();
    app.addSets('Bench', 3);
    app.click('settingsBtn');
    const storedBefore = JSON.stringify([...app.store]);
    app.pressOnly('resetBtn');
    assert.equal(app.visibleScreen(), 'settings');
    app.releaseOnly('resetBtn');
    assert.equal(app.visibleScreen(), 'reset confirmation');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('Go Back from the confirmation returns to Settings and changes nothing', () => {
    const app = appAskingToConfirmReset();
    const storedBefore = JSON.stringify([...app.store]);
    app.click('cancelResetBtn');
    assert.equal(app.visibleScreen(), 'settings');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('pressing Yes without releasing on it resets nothing', () => {
    const app = appAskingToConfirmReset();
    const storedBefore = JSON.stringify([...app.store]);
    app.pressOnly('confirmResetBtn');
    assert.equal(app.visibleScreen(), 'reset confirmation');
    assert.equal(JSON.stringify([...app.store]), storedBefore);
});

test('Yes clears the data and returns to the list straight away', () => {
    const app = appAskingToConfirmReset();
    app.click('confirmResetBtn');
    assert.equal(app.visibleScreen(), 'list');
    assert.equal(app.rowsOnScreen().find((row) => row.name === 'Bench').sets, 0);
});

test('the workout time shows 0s after a reset, not NaNs', () => {
    const app = appAskingToConfirmReset();
    app.click('confirmResetBtn');
    assert.equal(app.workoutTimeText(), '0s');
});

test('the first tap after a reset does not ask the workout question', () => {
    const app = appAskingToConfirmReset();
    app.click('confirmResetBtn');
    app.tapRow('Bench');
    assert.equal(app.visibleScreen(), 'add/del');
    app.click('addSetBtn');
    assert.equal(app.setCount('Bench'), 1);
});

test('the gear replaces the confirmation too', () => {
    const app = appAskingToConfirmReset();
    app.click('settingsBtn');
    assert.equal(app.visibleScreen(), 'settings');
});

test('a double tap on Reset Everything lands on Go Back, not Yes', () => {
    const buttons = [...markupOfDialog('resetConfirmationModal').matchAll(/<label class="exerciseModalBtn" id="(\w+)"/g)].map((match) => match[1]);
    assert.deepEqual(buttons, ['confirmResetBtn', 'cancelResetBtn']);
});

test('the add/del dialog holds only Add Set, Del Set and Cancel', () => {
    const buttons = [...markupOfDialog('exerciseActionsModal').matchAll(/<label class="exerciseModalBtn" id="(\w+)"/g)].map((match) => match[1]);
    assert.deepEqual(buttons, ['addSetBtn', 'delSetBtn', 'cancelBtn']);
});

test('Close comes before Reset Everything in the Settings dialog', () => {
    const buttons = [...markupOfDialog('settingsModal').matchAll(/<label class="exerciseModalBtn" id="(\w+)"/g)].map((match) => match[1]);
    assert.deepEqual(buttons, ['closeSettingsBtn', 'resetBtn']);
});

test('every way back out of a dialog is labelled Go Back', () => {
    for (const buttonId of ['cancelDecidingNewWorkoutBtn', 'closeSettingsBtn', 'cancelResetBtn']) {
        assert.match(pageMarkup, new RegExp(`id="${buttonId}"[^<]*>Go Back</label>`), buttonId);
    }
});
