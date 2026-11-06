// add-exercise-flow.js
// The Add screen in Settings: type a name, and a new never-done exercise joins the list.
// Why it is its own file: it is one short journey with its own dialog, and it shares only
// the name rules with rename. Nothing is saved until the name is accepted, and every button
// acts on release.
// It depends on exercise-storage.js, exercise-name-rules.js, exercise-dialogs.js and
// exercise-list-display.js.

eventHandlerOpenAddExercise = (what) => {
    resetButtonColours(what);
    hideSettingsModalDialog();
    document.getElementById('addNameInput').value = '';
    document.getElementById('addMessage').innerHTML = '';
    document.getElementById('addExerciseModal').style.display = 'block';
}

eventHandlerGoBackFromAddExercise = (what) => {
    resetButtonColours(what);
    document.getElementById('addExerciseModal').style.display = 'none';
    showSettingsModalDialog();
}

eventHandlerAddNewExercise = (what) => {
    resetButtonColours(what);

    const typedName = document.getElementById('addNameInput').value;

    const reasonRefused = reasonNewExerciseNameCannotBeUsed(typedName);
    if (reasonRefused !== '') {
        document.getElementById('addMessage').innerHTML = reasonRefused;
        return;
    }

    addStoredExercise(cleanExerciseName(typedName));

    document.getElementById('addExerciseModal').style.display = 'none';
    createDisplayableExerciseList();
    document.getElementById('exerciseListDiv').style.display = 'block';
}
