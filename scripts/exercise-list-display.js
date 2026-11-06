// exercise-list-display.js
// Builds the main screen's exercise list: sorts it by most recent set, then writes one row
// per exercise into the page.
// Why it is its own file: this is the app's main view, and it is rebuilt from stored data
// on a timer, so the rows on screen are never the source of truth. It also creates the
// stored record the first time an exercise is displayed.
// It depends on exercise-names.js, clock.js, elapsed-time-text.js and exercise-row-colours.js.

sortAllExercisesByElapsedTime = () => {
    //using the official list at top, get what we can from localStorate.
    //not all exercises might have ever been done and saved.. in that
    //case we add a place holder for that exercise.
    let exerciseList = [];
    globalExerciseListOfNames.forEach((exerciseName) => {
        exerciseList.push(readStoredExercise(exerciseName) ?? createBlankExercise(exerciseName));
    });

    exerciseList.sort((a, b) => {
        const lastidxA = parseInt(a.setidx);
        const lastidxB = parseInt(b.setidx);
        if (lastidxA === null || lastidxA === NaN ) { lastidxA = 0; }
        if (lastidxB === null || lastidxB === NaN ) { lastidxB = 0; }
        const lastSecsA = +parseFloat(a.secList[lastidxA]).toFixed(0);
        const lastSecsB = +parseFloat(b.secList[lastidxB]).toFixed(0);
        return lastSecsB - lastSecsA;
    });

    const theEquivOfGlobalListOfNamesButSorted = [];
    exerciseList.forEach((exercise) => {
        theEquivOfGlobalListOfNamesButSorted.push(exercise.name);
    });

    return theEquivOfGlobalListOfNamesButSorted;
}

createDisplayableExerciseList = () => {
    const theEquivOfGlobalListOfNamesButSorted = sortAllExercisesByElapsedTime();
    const exerciseListDiv = document.getElementById('exerciseListDiv');
    exerciseListDiv.innerHTML = '';
    theEquivOfGlobalListOfNamesButSorted.forEach((exerciseName) => {
        exerciseListDiv.innerHTML =
            exerciseListDiv.innerHTML + createDisplayableExercise(exerciseName);
    });
}

createDisplayableExercise = (exerciseName) => {

    let exercise = readStoredExercise(exerciseName);
    if (exercise === null) {
        exercise = createBlankExercise(exerciseName);
        saveExercise(exercise);
    }

    //we have to calculate how many secs ago from current time was latest set, if possible
    //zero secs in the secList array is not valid, probabl none ever entered(or erased)
    const secsNow = timeNowInSeconds()
    const secs = exercise.secList[exercise.setidx]
    let lastSecs = 0; // <----we will try to set the correct value here
    if (secs > 0) {
        lastSecs = secsNow - secs;
    }

    //next we need to know how to display the lastSecs (if secs, hrs, days)
    const displayTime = createDisplayableSeconds(lastSecs);

    let backgroundColor = determineBackgroundColorBasedOnNumberOfSetsDone(exercise.setidx);

    //backgroundColor = adjustBackgroundColorIfNeededBasedOnTimeElapsedSinceSet(exercise.setidx, secs, backgroundColor);
    backgroundColor = adjustBackgroundColorIfNeededBasedOnTimeElapsedSinceSet(exercise.setidx, secs, displayTime, backgroundColor);

    const exerciseHTML =
        `
            <div class="exerciseDiv"
                style="background-color:`+ backgroundColor + `;"
                name="`+ exercise.name + `"
                onmousedown="eventHandlerExerciseDivPressed(this)"
                onmouseup="eventHandlerExerciseDivReleased(this)"
            >
                <label class="exerciseLabel" name="`+ exercise.name + `" >` + exercise.setidx + ` ` + exercise.name + `</label>
                <label class="elapsedTimeLabel id="elapsedTimeLabel">` + displayTime + `</label>
            </div>
        <br/>
        \n`;
    return exerciseHTML;

}
