// load-app-in-fake-page.mjs
// Loads the real exercise.tracker.html scripts into a fake page, with a movable clock and
// fake storage, so tests can tap and press exactly as a user does.
// Why it exists: the app has no browser in this VM, and the VM is too small to install one.
// Buttons fire the real onmousedown and onmouseup attributes from the real markup, so the
// wiring is tested too. What it cannot show is layout: which element sits under the pointer.
// Passing a store and a time into a second loadApp call simulates reopening the browser.

import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..');
const ONE_HOUR = 3600;
const QUESTION_DIALOG_BUTTONS = ['yesNewWorkoutBtn', 'noNewWorkoutBtn', 'cancelDecidingNewWorkoutBtn'];
const SETTINGS_DIALOG_BUTTONS = ['closeSettingsBtn', 'resetBtn'];
const RESET_CONFIRMATION_BUTTONS = ['confirmResetBtn', 'cancelResetBtn'];
const DIALOG_NAMES_BY_ID = {
    exerciseActionsModal: 'add/del',
    isItNewWorkoutModal: 'question',
    settingsModal: 'settings',
    resetConfirmationModal: 'reset confirmation',
};

export const pageMarkup = readFileSync(join(PROJECT_FOLDER, 'exercise.tracker.html'), 'utf8');

/** Every function name the page's markup calls from a press or release attribute. */
export const functionsCalledByMarkup = () =>
    [...new Set([...pageMarkup.matchAll(/on(?:mousedown|mouseup)="(\w+)\(this\)"/g)].map((match) => match[1]))];

function createFakeStorage(store) {
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
    };
}

function createFakeDocument() {
    const elements = {};
    const elementById = (id) => elements[id] ??= {
        id,
        style: {},
        dataset: {},
        innerHTML: '',
        querySelector: (selector) => elementById(selector.slice(1)),
    };
    return { getElementById: elementById };
}

function runPageScripts(context) {
    for (const match of pageMarkup.matchAll(/<script src="([^"]+)"><\/script>/g)) {
        vm.runInContext(readFileSync(join(PROJECT_FOLDER, match[1]), 'utf8'), context, { filename: match[1] });
    }
}

function dialogHoldingButton(buttonId) {
    if (QUESTION_DIALOG_BUTTONS.includes(buttonId)) return 'isItNewWorkoutModal';
    if (SETTINGS_DIALOG_BUTTONS.includes(buttonId)) return 'settingsModal';
    if (RESET_CONFIRMATION_BUTTONS.includes(buttonId)) return 'resetConfirmationModal';
    return 'exerciseActionsModal';
}

function attributeFunctionName(buttonId, eventName) {
    const fromButton = pageMarkup.slice(pageMarkup.indexOf(`id="${buttonId}"`));
    return new RegExp(`${eventName}="(\\w+)\\(this\\)"`).exec(fromButton)[1];
}

export function loadApp({ store = new Map(), nowSeconds = 1_800_000_000 } = {}) {
    let now = nowSeconds;
    class FakeDate extends Date {
        static now() { return now * 1000; }
    }
    const document = createFakeDocument();
    const context = vm.createContext({
        window: {},
        console: { log() {} },
        localStorage: createFakeStorage(store),
        Date: FakeDate,
        document,
        setInterval: () => 0,
    });
    runPageScripts(context);
    context.window.onload();

    const element = document.getElementById;
    const fireButtonEvent = (buttonId, eventName) => {
        const button = element(buttonId);
        button.parentElement = { parentElement: element(dialogHoldingButton(buttonId)) };
        context[attributeFunctionName(buttonId, eventName)](button);
    };

    const app = {
        store,
        context,
        now: () => now,
        waitSeconds: (seconds) => { now += seconds; },

        /** Every screen showing, such as 'list' or 'settings'. Two at once reads 'list + settings',
         *  so a test fails if a dialog is left open behind another. */
        visibleScreen: () => {
            const listIsShowing = element('exerciseListDiv').style.display !== 'none';
            const dialogsShowing = Object.entries(DIALOG_NAMES_BY_ID)
                .filter(([id]) => element(id).style.display === 'block')
                .map(([, name]) => name);
            const screensShowing = listIsShowing ? ['list', ...dialogsShowing] : dialogsShowing;
            return screensShowing.join(' + ') || 'nothing';
        },

        /** The id of the exercise currently holding this name. Tests speak in names, as users do. */
        exerciseId: (exerciseName) => [...context.readExerciseIds()]
            .find((id) => context.readStoredExercise(id).name === exerciseName),

        tapRowById: (exerciseId) => {
            const row = { style: {}, children: [{ getAttribute: () => exerciseId }] };
            context.eventHandlerExerciseDivPressed(row);
            context.eventHandlerExerciseDivReleased(row);
        },
        tapRow: (exerciseName) => app.tapRowById(app.exerciseId(exerciseName)),
        pressOnly: (buttonId) => fireButtonEvent(buttonId, 'onmousedown'),
        releaseOnly: (buttonId) => fireButtonEvent(buttonId, 'onmouseup'),
        click: (buttonId) => {
            app.pressOnly(buttonId);
            app.releaseOnly(buttonId);
        },

        /** A complete add, for an exercise that does not raise the workout question. */
        addSet: (exerciseName) => {
            app.tapRow(exerciseName);
            if (app.visibleScreen() !== 'add/del') throw new Error(`expected add/del, saw ${app.visibleScreen()}`);
            app.click('addSetBtn');
            app.waitSeconds(30);
        },
        addSets: (exerciseName, count) => {
            for (let added = 0; added < count; added += 1) app.addSet(exerciseName);
        },

        /** The same two lines the owner pastes in the console: the workout looks 3 hours idle. */
        makeLastActivityLookThreeHoursOld: () => {
            store.set('currentWorkoutStartedAtSeconds', String(now - 4 * ONE_HOUR));
            store.set('currentWorkoutLatestSetAtSeconds', String(now - 3 * ONE_HOUR));
            now += 1;
        },

        storedExercise: (exerciseName) => context.readStoredExercise(app.exerciseId(exerciseName)),
        setCount: (exerciseName) => app.storedExercise(exerciseName).setidx,
        dialogText: () => element('exerciseModalText').innerHTML,
        questionText: () => element('isItNewWorkoutModalText').innerHTML,
        dialogExerciseId: (dialogId) => element(dialogId).dataset.exerciseId,
        listMarkup: () => element('exerciseListDiv').innerHTML,
        workoutTimeText: () => element('currentWorkoutTime').innerHTML,

        /** The list as drawn: exercise name, set count, elapsed text and colour, top row first. */
        rowsOnScreen: () => {
            context.createDisplayableExerciseList();
            const rowPattern = /background-color:([^;]+);[\s\S]*?<label class="exerciseLabel"[^>]*>(\d+) ([^<]+)<\/label>[\s\S]*?id="elapsedTimeLabel">([^<]+)<\/label>/g;
            return [...element('exerciseListDiv').innerHTML.matchAll(rowPattern)]
                .map(([, colour, sets, name, elapsed]) => ({ name, sets: Number(sets), elapsed, colour }));
        },
    };
    return app;
}
