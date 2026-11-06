// exercise-list-display.js
// Builds the main screen's exercise list: sorts it by most recent set, then writes one row
// per exercise into the page.
// Why it is its own file: this is the app's main view, and it is rebuilt from stored data
// on a timer, so the rows on screen are never the source of truth. Each row carries the
// exercise's id for the tap, and shows its name to the user.
// It depends on exercise-storage.js, clock.js, elapsed-time-text.js and exercise-row-colours.js.

sortAllExercisesByElapsedTime = () => {
    const exerciseList = readExerciseIds().map(readStoredExercise);

    exerciseList.sort((a, b) => {
        const lastidxA = parseInt(a.setidx);
        const lastidxB = parseInt(b.setidx);
        if (lastidxA === null || lastidxA === NaN ) { lastidxA = 0; }
        if (lastidxB === null || lastidxB === NaN ) { lastidxB = 0; }
        const lastSecsA = +parseFloat(a.secList[lastidxA]).toFixed(0);
        const lastSecsB = +parseFloat(b.secList[lastidxB]).toFixed(0);
        return lastSecsB - lastSecsA;
    });

    return exerciseList.map((exercise) => exercise.id);
}

createDisplayableExerciseList = () => {
    const exerciseIdsMostRecentFirst = sortAllExercisesByElapsedTime();
    const exerciseListDiv = document.getElementById('exerciseListDiv');
    exerciseListDiv.innerHTML = '';
    exerciseIdsMostRecentFirst.forEach((exerciseId) => {
        exerciseListDiv.innerHTML =
            exerciseListDiv.innerHTML + createDisplayableExercise(exerciseId);
    });
}

createDisplayableExercise = (exerciseId) => {

    const exercise = readStoredExercise(exerciseId);

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
                name="`+ exercise.id + `"
                onmousedown="eventHandlerExerciseDivPressed(this)"
                onmouseup="eventHandlerExerciseDivReleased(this)"
            >
                <label class="exerciseLabel" name="`+ exercise.id + `" >` + exercise.setidx + ` ` + escapeTextForPage(exercise.name) + `</label>
                <label class="elapsedTimeLabel id="elapsedTimeLabel">` + displayTime + `</label>
            </div>
        <br/>
        \n`;
    return exerciseHTML;

}
