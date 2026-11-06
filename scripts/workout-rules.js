// workout-rules.js
// Decides whether a tap belongs to the current workout, starts a new one, or must be asked
// about, and rolls an exercise over into its previous-workout state.
// Why it is its own file: this is the app's core judgement, and the Del Set fix and the
// permanent exercise ids both build on it. It reads and writes localStorage directly.
// It depends on workout-time-limits.js and clock.js.

initializeCurrentWorkoutTimesInLocalStorageAsNeeded = () => {

    let wkStartAtSecs = parseFloat(localStorage.getItem('currentWorkoutStartedAtSeconds')).toFixed(0);
    let wkLatestSecs = parseFloat(localStorage.getItem('currentWorkoutLatestSetAtSeconds')).toFixed(0);

    if (wkStartAtSecs === null || wkStartAtSecs === 'NaN') { wkStartAtSecs = 0; }
    if (wkLatestSecs === null || wkLatestSecs === 'NaN') { wkLatestSecs = 0; }

    if (wkStartAtSecs == 0) {
        localStorage.setItem('currentWorkoutStartedAtSeconds', 0);
        localStorage.setItem('currentWorkoutLatestSetAtSeconds', 0);
    }
}

adjustEverythingToStartNewWorkout = (exerciseName) => {
    //this means we the last set time, become the workout start time(weve moved up the workout start time)
    //actually this seems very similar to the FIRS TIME run.
    localStorage.setItem('currentWorkoutStartedAtSeconds', timeNowInSeconds());
    localStorage.setItem('currentWorkoutLatestSetAtSeconds', timeNowInSeconds());
    localStorage.removeItem('theLastExerciseSetAdded');

}

//THIS CALLED WHEN SET TO BE ADDED
//if user clicks to add another set, to an exercise,
//we need to know if the new set is added to the displayed sets for that exercise,(current workout)
//or if we need to zero stuff and this is the first set
adjustExerciseToBePartOfCurrentWorkoutAsNeeded = (exerciseName) => {

    const timeNowSeconds = timeNowInSeconds();

    const exerciseJsonFromLocalStorage = localStorage.getItem(exerciseName);

    const json = JSON.parse(exerciseJsonFromLocalStorage);

    const lastSetIdx = parseInt(json.setidx);
    const lastSetSeconds = parseFloat(json.secList[lastSetIdx]).toFixed(0);

    //i think if setidx is 0 and secList(idx) is 0, then
    //it is safe to assume we dont have to do anything
    if ((lastSetIdx == 0) && (lastSetSeconds == 0)) {
        return;
    }

    //if the latest set happened since the workout started, it belongs to this workout
    //and the next set just continues the count. comparing against the workout start means
    //the user's Same or New Workout answer decides this, however long the gap was.
    const workoutStartedAtSeconds = parseFloat(localStorage.getItem('currentWorkoutStartedAtSeconds'));
    const isLastSetInCurrentWorkout = (lastSetSeconds >= workoutStartedAtSeconds);
    if (isLastSetInCurrentWorkout) {
        return;
    }

    // we also have to update the latest set idx as the prev workout set
    // we also have to clear the array of current set seconds
    // and finally store all that back to local storage
    json.secList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    json.prevWkNumSets = json.setidx;
    json.setidx = 0;
    localStorage.setItem(exerciseName, JSON.stringify(json));
}

getExerciseLatestSetSeconds = (exerciseName) => {
    //we also have to look at the specific exercise times
    const exerciseJsonFromLocalStorage = localStorage.getItem(exerciseName);
    if (exerciseJsonFromLocalStorage === null) {
        return 0;
    }

    const json = JSON.parse(exerciseJsonFromLocalStorage);
    const setidx = parseInt(json.setidx);

    return json.secList[setidx];
}

doesUserHaveToBeAskedAsWeUpdateStoredCurrentWorkoutTimeAndPreviousWorkoutSetsAsNeeded = (exerciseName) => {

    //we have to look at global workout time
    let wkStartAtSecs = parseFloat(localStorage.getItem('currentWorkoutStartedAtSeconds')).toFixed(0);
    let wkLatestSecs = parseFloat(localStorage.getItem('currentWorkoutLatestSetAtSeconds')).toFixed(0);
    wkStartAtSecs = parseFloat(wkStartAtSecs).toFixed(0);
    wkLatestSecs = parseFloat(wkLatestSecs).toFixed(0);


    //BRAND NEW 1st TIME WORKOUT
    //THIS SHOULD ONLY HAPPEN ONCE, IF BROWSER LOCAL STORAGE IS EMPTY OR CLEARED
    //this could be the very first workout (start time is 0);
    // so we save the new start time, and it is also the time of the 1st set.
    if (wkStartAtSecs === null || wkStartAtSecs === NaN || wkStartAtSecs == 0 || (wkStartAtSecs > wkLatestSecs)) {
        localStorage.setItem('currentWorkoutStartedAtSeconds', timeNowInSeconds());
        localStorage.setItem('currentWorkoutLatestSetAtSeconds', timeNowInSeconds());
        localStorage.removeItem('theLastExerciseSetAdded');
        //that's it we're done for this go round
        return false;//we knew what to do, no need to ask user
    }

    // CURRENT WORKOUT
    //next scenario is there is a current workout in effect.
    //minimum requirement is that latest time must be greater than or equal to start time.(1 or more sets)
    //minimum requirement is that latest time must be greater than zero.(superflous??)
    //how do we know what is a 'current' workout?
    //subjective: we allow a max diff between current time and latest time.
    //NOTE: the global workout times can be current/recent, but we could have clicked on an older exercise
    //so that has to be tested too
    if (wkLatestSecs > 0) {//met min requirements, so this is NOT a diff scenario.

        const isWorkoutUnderMaxTimeBetweenSets = ((timeNowInSeconds() - wkLatestSecs) < T_MAX_TIME_BETWEEN_SETS);

        //const exerciseLatestSeconds = getExerciseLatestSetSeconds(exerciseName);
        //const isExerciseLatestSecondsLessThanMaxTimeBetweenSets = ((timeNowInSeconds() - exerciseLatestSeconds) < T_MAX_TIME_BETWEEN_SETS);
        //const isExerciseHaveZeroSetsZeroTime = (exerciseLatestSeconds == 0);

        // are we still in current or has it passed
        //if (isWorkoutUnderMaxTimeBetweenSets && (isExerciseLatestSecondsLessThanMaxTimeBetweenSets || isExerciseHaveZeroSetsZeroTime)) {
        if (isWorkoutUnderMaxTimeBetweenSets) {
            //still in current, just update the latest time
            localStorage.setItem('currentWorkoutLatestSetAtSeconds', timeNowInSeconds());
            //that's it we're done for this go round
            return false;//we knew what to do, no need to ask user
        }
    }

    //PAST CURRENT WORKOUT, START NEW ONE
    //the next scenario is that we are no longer in current workout, too much time has passed.
    if (wkLatestSecs > 0) {//met min requirements, so this is NOT a diff scenario.
        // are we past current workout?
        if ((timeNowInSeconds() - wkLatestSecs) > T_MAX_WK_TIME) {

            adjustEverythingToStartNewWorkout(exerciseName);

            return false;//we knew what to do, no need to ask user
        }
    }

    //WE DONT KNOW, COULD BE CURENT WORKOUT, ASK
    //is this a new workout starting? or is it still current workout?
    //because the user has taken a long time between sets
    return true;
}
