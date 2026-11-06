// exercise-dialogs.js
// Shows and hides the two dialogs: the add/del dialog and the "new or same workout" question.
// Why it is its own file: which dialog is on screen is a separate job from what its buttons
// do. Each dialog carries the exercise it was opened for in its data-exercise-name, and the
// button handlers read that back.

showIsThisNewWorkoutModalDialog = (exerciseName) => {
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
    modal.dataset.exerciseName = exerciseName;
    const isItNewWorkoutModalText = modal.querySelector('#isItNewWorkoutModalText');
    isItNewWorkoutModalText.innerHTML = exerciseName;
}

showAddDelMoreCancelModalDialog = (exerciseName) => {
    const modal = document.getElementById('exerciseActionsModal');
    modal.dataset.exerciseName = exerciseName;

    //in dialog , show exercise name and prev workout sets done
    const exerciseJsonFromLocalStorage = localStorage.getItem(exerciseName);
    const json = JSON.parse(exerciseJsonFromLocalStorage);
    const exerciseModalText = modal.querySelector('#exerciseModalText');
    exerciseModalText.innerHTML = json.name + '<br/>Prev Wk Sets:' + json.prevWkNumSets;
    modal.style.display = 'block'; //show add/del/etc dialog
}

hideAddDelMoreCancelModalDialog = () => {
    const modal = document.getElementById('exerciseActionsModal');
    modal.style.display = 'none';
}

hideIsThisNewWorkoutModalDialog = () => {
    const modal = document.getElementById('isItNewWorkoutModal');
    modal.style.display = 'none';
}
