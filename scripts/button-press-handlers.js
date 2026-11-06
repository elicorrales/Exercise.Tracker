// button-press-handlers.js
// What happens when each dialog button or exercise row is pressed and released. The page's
// inline onmousedown and onmouseup attributes call these functions by name.
// Why it is its own file: this is the seam where a user's action becomes a data change and
// a screen change. Press and release are separate events, and the pointer may be over a
// different element by the time of the release.
// It depends on every script loaded before it in exercise.tracker.html.

const globalDefaultBackgroundColor = 'rgb(150, 148, 148)';

eventHandlerCancelDecidingIsItNewWorkout = (what) => {
    what.style.color = 'black';
    what.style.backgroundColor = 'white';
}

//runs on release of Yes, so dragging off the button still cancels.
//after clearing, the workout times are set up again as on a fresh load, and the screen is
//redrawn from them, otherwise the timer shows NaNs and the next tap asks the workout question.
eventHandlerResetLocalStorage = (what) => {
    what.style.color = 'white';
    what.style.backgroundColor = 'black';

    removeAllExercises();
    removeWorkoutTimes();

    seedDefaultExercisesIfNeeded();
    initializeCurrentWorkoutTimesInLocalStorageAsNeeded();
    displayWorkoutTime();
    createDisplayableExerciseList();

    hideResetConfirmationModalDialog();
    document.getElementById('exerciseListDiv').style.display = 'block';
}

eventHandlerAskToConfirmReset = (what) => {
    what.style.color = 'white';
    what.style.backgroundColor = 'black';

    hideSettingsModalDialog();
    showResetConfirmationModalDialog();
}

eventHandlerGoBackToSettings = (what) => {
    what.style.color = 'white';
    what.style.backgroundColor = 'black';

    hideResetConfirmationModalDialog();
    showSettingsModalDialog();
}

//New Workout and Same Workout only highlight on press, and act on release. If they acted on
//press, the add/del dialog would open under the pointer and catch the release, which closes it.
eventHandlerHighlightWorkoutChoiceBtn = (what) => {
    what.style.color = 'black';
    what.style.backgroundColor = 'white';
}

eventHandlerStartNewWorkout = (what) => {
    const exerciseId = what.parentElement.parentElement.dataset.exerciseId;
    adjustEverythingToStartNewWorkout(exerciseId);
    displayWorkoutTime();
    hideIsThisNewWorkoutModalDialog();
    showAddDelMoreCancelModalDialog(exerciseId);
}

eventHandlerContinueSameWorkout = (what) => {
    saveWorkoutLatestActivityAtSeconds(timeNowInSeconds());
    const exerciseId = what.parentElement.parentElement.dataset.exerciseId;
    hideIsThisNewWorkoutModalDialog();
    showAddDelMoreCancelModalDialog(exerciseId);
}

eventHandlerAddSet = (what) => {
    //grab data from dialog(overall parent)
    const exerciseId = what.parentElement.parentElement.dataset.exerciseId;

    adjustExerciseToBePartOfCurrentWorkoutAsNeeded(exerciseId);

    const json = readStoredExercise(exerciseId);

    //inc the current set and grab time of new set
    const len = json.secList.length;
    let setidx = parseInt(json.setidx);

    //we are limited to a certain number of sets
    //after the limit, we do not save the next set
    if ((setidx + 1) < len) {
        setidx = setidx + 1;

        json.setidx = setidx;
        json.secList[setidx] = timeNowInSeconds();

        //save the data
        saveExercise(json);

    }
    what.style.color = 'black';
    what.style.backgroundColor = 'white';

    displayWorkoutTime();
    createDisplayableExerciseList();

}

eventHandlerDelSet = (what) => {
    //grab data from dialog(overall parent)
    const exerciseId = what.parentElement.parentElement.dataset.exerciseId;

    const json = readStoredExercise(exerciseId);

    removeLatestSetFromExercise(json);

    //save the data
    saveExercise(json);

    what.style.color = 'black';
    what.style.backgroundColor = 'white';

    displayWorkoutTime();
    createDisplayableExerciseList();

}

eventHandlerCancelSet = (what) => {
    what.style.color = 'black';
    what.style.backgroundColor = 'white';
}

eventHandlerFinishExerciseActionsModalBtn = (what) => {

    console.log('eventHandlerFinishExerciseActionsModalBtn');

    what.style.color = 'white';
    what.style.backgroundColor = 'black';

    const modal = what.parentElement.parentElement;
    modal.style.display = 'none';

    //createDisplayableExerciseList();
    const exerciseListDiv = document.getElementById('exerciseListDiv');
    exerciseListDiv.style.display = 'block';
}


eventHandlerGoBackFromIsItNewWorkoutModalBtn = (what) => {

    what.style.color = 'white';
    what.style.backgroundColor = 'black';

    const modal = what.parentElement.parentElement;
    modal.style.display = 'none';

    //createDisplayableExerciseList();
    const exerciseListDiv = document.getElementById('exerciseListDiv');
    exerciseListDiv.style.display = 'block';
}

//the gear sits in the header, so it is always reachable, even with a dialog open.
//like the workout choices it only highlights on press, and acts on release.
eventHandlerHighlightSettingsGearBtn = (what) => {
    what.style.color = 'white';
    what.style.backgroundColor = 'dimgrey';
}

eventHandlerOpenSettings = (what) => {
    what.style.color = '';
    what.style.backgroundColor = '';

    document.getElementById('exerciseListDiv').style.display = 'none';
    hideAddDelMoreCancelModalDialog();
    hideIsThisNewWorkoutModalDialog();
    hideResetConfirmationModalDialog();
    showSettingsModalDialog();
}

eventHandlerHighlightSettingsDialogBtn = (what) => {
    what.style.color = 'black';
    what.style.backgroundColor = 'white';
}

eventHandlerReturnToListFromSettings = (what) => {
    what.style.color = 'white';
    what.style.backgroundColor = 'black';

    hideSettingsModalDialog();
    document.getElementById('exerciseListDiv').style.display = 'block';
}

//execiseDiv should act as a button and change background color
//to indicate press and release
eventHandlerExerciseDivPressed = (what) => {

    console.log('eventHandlerExerciseDivPressed');

    const exerciseDiv = what;//.parentElement;
    exerciseDiv.style.color = 'white'; //'button' text - pressed
    exerciseDiv.style.backgroundColor = 'dimgrey'; //'button' background
}

//execiseDiv should act as a button and change background color
//to indicate press and release
eventHandlerExerciseDivReleased = (what) => {

    console.log('eventHandlerExerciseDivReleased');

    const exerciseDiv = what;//.parentElement;
    exerciseDiv.style.color = 'black'; //'button' text - released
    exerciseDiv.style.backgroundColor = globalDefaultBackgroundColor;

    const exerciseListDiv = document.getElementById('exerciseListDiv');
    exerciseListDiv.style.display = 'none'; // hide the exercises list

    const exerciseId = exerciseDiv.children[0].getAttribute('name');

    if (doesUserHaveToBeAskedAsWeUpdateStoredCurrentWorkoutTimeAndPreviousWorkoutSetsAsNeeded(exerciseId)) {

        hideAddDelMoreCancelModalDialog();
        showIsThisNewWorkoutModalDialog(exerciseId);

    } else {
        hideIsThisNewWorkoutModalDialog();
        showAddDelMoreCancelModalDialog(exerciseId);
    }

}
