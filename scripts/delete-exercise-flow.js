// delete-exercise-flow.js
// The delete screens: pick an exercise, then confirm.
// Why it is its own file: it is one short journey through two dialogs. A delete cannot be
// undone, so it always confirms, and the delete itself happens on release of Yes, so
// dragging off the button still cancels. The title is the name alone, to stay on one line.
// It depends on exercise-storage.js, page-text-escaping.js, exercise-dialogs.js and
// exercise-list-display.js.

eventHandlerOpenDeletePicker = (what) => {
    resetButtonColours(what);
    hideSettingsModalDialog();
    document.getElementById('deletePickerList').innerHTML = exercisePickerRowsMarkup('eventHandlerPickExerciseToDelete');
    document.getElementById('deletePickerModal').style.display = 'block';
}

eventHandlerGoBackFromDeletePicker = (what) => {
    resetButtonColours(what);
    document.getElementById('deletePickerModal').style.display = 'none';
    showSettingsModalDialog();
}

eventHandlerPickExerciseToDelete = (what) => {
    const exerciseId = what.getAttribute('name');

    document.getElementById('deletePickerModal').style.display = 'none';

    const modal = document.getElementById('deleteConfirmationModal');
    modal.dataset.exerciseId = exerciseId;
    document.getElementById('deleteConfirmationTitle').innerHTML = escapeTextForPage(readStoredExercise(exerciseId).name);
    modal.style.display = 'block';
}

//goes all the way back to the list, and nothing changes
eventHandlerGoBackFromDeleteConfirmation = (what) => {
    resetButtonColours(what);
    document.getElementById('deleteConfirmationModal').style.display = 'none';
    document.getElementById('exerciseListDiv').style.display = 'block';
}

eventHandlerDeleteExercise = (what) => {
    resetButtonColours(what);

    const modal = document.getElementById('deleteConfirmationModal');
    deleteStoredExercise(modal.dataset.exerciseId);

    modal.style.display = 'none';
    createDisplayableExerciseList();
    document.getElementById('exerciseListDiv').style.display = 'block';
}
