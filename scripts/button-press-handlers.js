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

eventHandlerResetLocalStorage = (what) => {
    what.style.color = 'black';
    what.style.backgroundColor = 'white';

    globalExerciseListOfNames.forEach((exerciseName) => {
        localStorage.removeItem(exerciseName);
    });

    localStorage.removeItem('currentWorkoutStartedAtSeconds');
    localStorage.removeItem('currentWorkoutLatestSetAtSeconds');
    localStorage.removeItem('theLastExerciseSetAdded');
}

//New Workout and Same Workout only highlight on press, and act on release. If they acted on
//press, the add/del dialog would open under the pointer and catch the release, which closes it.
eventHandlerHighlightWorkoutChoiceBtn = (what) => {
    what.style.color = 'black';
    what.style.backgroundColor = 'white';
}

eventHandlerStartNewWorkout = (what) => {
    const exerciseName = what.parentElement.parentElement.dataset.exerciseName;
    adjustEverythingToStartNewWorkout(exerciseName);
    displayWorkoutTime();
    hideIsThisNewWorkoutModalDialog();
    showAddDelMoreCancelModalDialog(exerciseName);
}

eventHandlerContinueSameWorkout = (what) => {
    const exerciseName = what.parentElement.parentElement.dataset.exerciseName;
    hideIsThisNewWorkoutModalDialog();
    showAddDelMoreCancelModalDialog(exerciseName);
}

eventHandlerAddSet = (what) => {
    //grab data from dialog(overall parent)
    const exerciseName = what.parentElement.parentElement.dataset.exerciseName;
    localStorage.setItem('theLastExerciseSetAdded', exerciseName);

    adjustExerciseToBePartOfCurrentWorkoutAsNeeded(exerciseName);

    const exerciseJsonFromLocalStorage = localStorage.getItem(exerciseName);
    const json = JSON.parse(exerciseJsonFromLocalStorage);

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
        localStorage.setItem(exerciseName, JSON.stringify(json));

    }
    what.style.color = 'black';
    what.style.backgroundColor = 'white';

    displayWorkoutTime();
    createDisplayableExerciseList();

}

eventHandlerDelSet = (what) => {
    //grab data from dialog(overall parent)
    const exerciseName = what.parentElement.parentElement.dataset.exerciseName;

    const exerciseJsonFromLocalStorage = localStorage.getItem(exerciseName);
    const json = JSON.parse(exerciseJsonFromLocalStorage);
    const setidx = parseInt(json.setidx);

    //if not already at first set, dec the current set
    if (setidx > 0) {
        json.setidx = setidx - 1;
        //save the data
        localStorage.setItem(exerciseName, JSON.stringify(json));
    }

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

    const exerciseName = exerciseDiv.children[0].getAttribute('name');

    if (doesUserHaveToBeAskedAsWeUpdateStoredCurrentWorkoutTimeAndPreviousWorkoutSetsAsNeeded(exerciseName)) {

        hideAddDelMoreCancelModalDialog();
        showIsThisNewWorkoutModalDialog(exerciseName);

    } else {
        hideIsThisNewWorkoutModalDialog();
        showAddDelMoreCancelModalDialog(exerciseName);
    }

}
