// exercise-list-display.test.mjs
// Pins what the main list shows: row order, set counts, elapsed text, and both colour scales.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './load-app-in-fake-page.mjs';

const ONE_HOUR = 3600;
const ONE_DAY = 86400;

const rowFor = (app, exerciseName) => app.rowsOnScreen().find((row) => row.name === exerciseName);

test('all 18 exercises appear, in list order, before any training', () => {
    const rows = loadApp().rowsOnScreen();
    assert.equal(rows.length, 18);
    assert.equal(rows[0].name, 'Crunches');
    assert.equal(rows[17].name, 'Abducts');
});

test('the most recently trained exercise moves to the top', () => {
    const app = loadApp();
    app.addSet('Bench');
    app.addSet('Calves');
    assert.deepEqual(app.rowsOnScreen().slice(0, 2).map((row) => row.name), ['Calves', 'Bench']);
});

test('a row shows its set count and time since the last set', () => {
    const app = loadApp();
    app.addSets('Bench', 2);
    app.waitSeconds(60);
    const row = rowFor(app, 'Bench');
    assert.equal(row.sets, 2);
    assert.equal(row.elapsed, '1.5m');
});

test('elapsed text moves through seconds, minutes, hours and days', () => {
    const text = loadApp().context.createDisplayableSeconds;
    const expected = [[0, '0s'], [60, '60s'], [61, '1.0m'], [3600, '60.0m'], [3601, '1.0h'], [86400, '24.0h'], [86401, '1.0d'], [259200, '3.0d']];
    for (const [seconds, shown] of expected) assert.equal(text(seconds), shown);
});

test('a recent row is coloured by its set count', () => {
    const expected = [[1, '#ff0000'], [2, '#ff9900'], [3, 'gold'], [4, '#ffff4d'], [5, '#ccff33'], [13, '#bbddff'], [14, 'white']];
    for (const [sets, colour] of expected) {
        const app = loadApp();
        app.addSets('Bench', sets);
        assert.equal(rowFor(app, 'Bench').colour, colour, `${sets} sets`);
    }
});

test('an older row is coloured by its age, and each limit is exact', () => {
    const expected = [
        [4 * ONE_HOUR - 1, '#ff0000'], [4 * ONE_HOUR, '#11bbff'], [6 * ONE_HOUR, '#66aaff'], [12 * ONE_HOUR, '#6682ff'],
        [ONE_DAY, '#9966ff'], [2 * ONE_DAY, '#bf40b4'], [3 * ONE_DAY, '#c65353'], [4 * ONE_DAY, '#b37700'],
        [5 * ONE_DAY, '#888844'], [6 * ONE_DAY, '#5c8a8a'], [7 * ONE_DAY, '#8383af'], [8 * ONE_DAY, 'lightgrey'],
    ];
    for (const [age, colour] of expected) {
        const app = loadApp();
        app.tapRow('Bench');
        app.click('addSetBtn');
        app.waitSeconds(age);
        assert.equal(rowFor(app, 'Bench').colour, colour, `age ${age}`);
    }
});

test('a never-trained row is light grey', () => {
    assert.equal(rowFor(loadApp(), 'Bench').colour, 'lightgrey');
});
