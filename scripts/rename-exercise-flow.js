// rename-exercise-flow.js
// The rename screens: pick an exercise, type its new name, then save it, with a choice about
// its history if it has any.
// Why it is its own file: this is one self-contained journey through three dialogs. A rename
// may be a name fix, or the user may be reusing the slot for a different exercise, so an
// exercise with history always asks. Nothing is saved until that answer, and the answer saves
// the name and the sets in one write. Every step acts on release, never on press.
// It depends on exercise-storage.js, exercise-name-rules.js, workout-rules.js,
// page-text-escaping.js, exercise-dialogs.js and exercise-list-display.js.

const showRenamePicker = () => {
    const rows = readExerciseIds().map((exerciseId) =>
        `<p> <label class="exerciseModalBtn" name="` + exerciseId + `"
            onmousedown="eventHandlerHighlightSettingsDialogBtn(this)"
            onmouseup="eventHandlerPickExerciseToRename(this)">`
            + escapeTextForPage(readStoredExercise(exerciseId).name) + `</label><br /> </p>`);
    document.getElementById('renamePickerList').innerHTML = rows.join('\n');
    document.getElementById('renamePickerModal').style.display = 'block';
}

const showRenameEntry = (exerciseId) => {
    const modal = document.getElementById('renameEntryModal');
    modal.dataset.exerciseId = exerciseId;
    document.getElementById('renameNameInput').value = readStoredExercise(exerciseId).name;
    document.getElementById('renameMessage').innerHTML = '';
    modal.style.display = 'block';
}

//an exercise with no history has nothing to clear, so it is only offered Save
const showRenameSetsQuestion = (exerciseId, newName) => {
    const offerClear = hasExerciseHistory(readStoredExercise(exerciseId));

    const modal = document.getElementById('renameSetsModal');
    modal.dataset.exerciseId = exerciseId;
    modal.dataset.newName = newName;
    document.getElementById('renameSetsTitle').innerHTML = escapeTextForPage(newName);
    document.getElementById('keepSetsBtn').innerHTML = offerClear ? 'Save Set Hist' : 'Save';
    document.getElementById('clearSetsRow').style.display = offerClear ? 'block' : 'none';
    modal.style.display = 'block';
}

const finishRename = (button) => {
    resetButtonColours(button);
    document.getElementById('renameSetsModal').style.display = 'none';
    createDisplayableExerciseList();
    document.getElementById('exerciseListDiv').style.display = 'block';
}

eventHandlerOpenRenamePicker = (what) => {
    resetButtonColours(what);
    hideSettingsModalDialog();
    showRenamePicker();
}

eventHandlerGoBackFromRenamePicker = (what) => {
    resetButtonColours(what);
    document.getElementById('renamePickerModal').style.display = 'none';
    showSettingsModalDialog();
}

eventHandlerPickExerciseToRename = (what) => {
    document.getElementById('renamePickerModal').style.display = 'none';
    showRenameEntry(what.getAttribute('name'));
}

eventHandlerGoBackFromRenameEntry = (what) => {
    resetButtonColours(what);
    document.getElementById('renameEntryModal').style.display = 'none';
    showRenamePicker();
}

eventHandlerCheckNewExerciseName = (what) => {
    resetButtonColours(what);

    const entryModal = document.getElementById('renameEntryModal');
    const exerciseId = entryModal.dataset.exerciseId;
    const typedName = document.getElementById('renameNameInput').value;

    const reasonRefused = reasonExerciseNameCannotBeUsed(typedName, exerciseId);
    if (reasonRefused !== '') {
        document.getElementById('renameMessage').innerHTML = reasonRefused;
        return;
    }

    entryModal.style.display = 'none';
    showRenameSetsQuestion(exerciseId, cleanExerciseName(typedName));
}

//goes all the way back to the list, and nothing changes
eventHandlerGoBackFromRenameSets = (what) => {
    resetButtonColours(what);
    document.getElementById('renameSetsModal').style.display = 'none';
    document.getElementById('exerciseListDiv').style.display = 'block';
}

eventHandlerKeepSetsOfRenamedExercise = (what) => {
    const { exerciseId, newName } = document.getElementById('renameSetsModal').dataset;
    renameExerciseKeepingSets(exerciseId, newName);
    finishRename(what);
}

eventHandlerClearSetsOfRenamedExercise = (what) => {
    const { exerciseId, newName } = document.getElementById('renameSetsModal').dataset;
    renameExerciseClearingSets(exerciseId, newName);
    finishRename(what);
}
