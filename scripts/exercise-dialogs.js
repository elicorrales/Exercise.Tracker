// exercise-dialogs.js
// Shows and hides the dialogs: add/del, the "new or same workout" question, Settings, and
// the reset confirmation.
// Why it is its own file: which dialog is on screen is a separate job from what its buttons
// do. Each dialog carries the exercise it was opened for in its data-exercise-id, and the
// button handlers read that back.

showIsThisNewWorkoutModalDialog = (exerciseId) => {
    const modal = document.getElementById('isItNewWorkoutModal');
    const yesBtn = modal.querySelector('#yesNewWorkoutBtn');
    yesBtn.style.color = 'white';
    yesBtn.style.backgroundColor = 'black';
    const noBtn = modal.querySelector('#noNewWorkoutBtn');
    noBtn.style.color = 'white';
    noBtn.style.backgroundColor = 'black';
    const canBtn = modal.querySelector('#cancelDecidingNewWorkoutBtn');
    canBtn.style.color = 'white';
    canBtn.style.backgroundColor = 'black';
    modal.style.display = 'block'; //show is it a new workout dialog
    modal.dataset.exerciseId = exerciseId;
    const isItNewWorkoutModalText = modal.querySelector('#isItNewWorkoutModalText');
    isItNewWorkoutModalText.innerHTML = escapeTextForPage(readStoredExercise(exerciseId).name);
}

showAddDelMoreCancelModalDialog = (exerciseId) => {
    const modal = document.getElementById('exerciseActionsModal');
    modal.dataset.exerciseId = exerciseId;

    //in dialog , show exercise name and prev workout sets done
    const json = readStoredExercise(exerciseId);
    const exerciseModalText = modal.querySelector('#exerciseModalText');
    exerciseModalText.innerHTML = escapeTextForPage(json.name) + '<br/>Prev Wk Sets:' + previousWorkoutSetCount(json);
    modal.style.display = 'block'; //show add/del/etc dialog
}

showSettingsModalDialog = () => {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'block';
}

hideSettingsModalDialog = () => {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'none';
}

showResetConfirmationModalDialog = () => {
    const modal = document.getElementById('resetConfirmationModal');
    modal.style.display = 'block';
}

hideResetConfirmationModalDialog = () => {
    const modal = document.getElementById('resetConfirmationModal');
    modal.style.display = 'none';
}

//a dialog button stays highlighted from its press until this runs on release
const resetButtonColours = (button) => {
    button.style.color = 'white';
    button.style.backgroundColor = 'black';
}

//one row per exercise for a picker dialog. each row carries the exercise's id, and calls
//the named handler on release.
exercisePickerRowsMarkup = (releaseHandlerName) => {
    const rows = readExerciseIds().map((exerciseId) =>
        `<p> <label class="exerciseModalBtn" name="` + exerciseId + `"
            onmousedown="eventHandlerHighlightSettingsDialogBtn(this)"
            onmouseup="` + releaseHandlerName + `(this)">`
            + escapeTextForPage(readStoredExercise(exerciseId).name) + `</label><br /> </p>`);
    return rows.join('\n');
}

hideEveryDialog = () => {
    ['exerciseActionsModal', 'isItNewWorkoutModal', 'settingsModal', 'resetConfirmationModal',
        'renamePickerModal', 'renameEntryModal', 'renameSetsModal', 'addExerciseModal',
        'deletePickerModal', 'deleteConfirmationModal'].forEach((dialogId) => {
        document.getElementById(dialogId).style.display = 'none';
    });
}

hideAddDelMoreCancelModalDialog = () => {
    const modal = document.getElementById('exerciseActionsModal');
    modal.style.display = 'none';
}

hideIsThisNewWorkoutModalDialog = () => {
    const modal = document.getElementById('isItNewWorkoutModal');
    modal.style.display = 'none';
}
