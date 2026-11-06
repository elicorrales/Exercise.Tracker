// workout-rules.js
// Decides whether a tap belongs to the current workout, starts a new one, or must be asked
// about, and rolls an exercise over into its previous-workout state.
// Why it is its own file: this is the app's core judgement, and the Del Set fix and the
// permanent exercise ids both build on it.
// It depends on workout-time-limits.js, clock.js and both storage files.

initializeCurrentWorkoutTimesInLocalStorageAsNeeded = () => {

    let wkStartAtSecs = readWorkoutStartedAtSeconds().toFixed(0);
    let wkLatestSecs = readWorkoutLatestActivityAtSeconds().toFixed(0);

    if (wkStartAtSecs === null || wkStartAtSecs === 'NaN') { wkStartAtSecs = 0; }
    if (wkLatestSecs === null || wkLatestSecs === 'NaN') { wkLatestSecs = 0; }

    if (wkStartAtSecs == 0) {
        saveWorkoutStartedAtSeconds(0);
        saveWorkoutLatestActivityAtSeconds(0);
    }
}

adjustEverythingToStartNewWorkout = (exerciseId) => {
    //this means we the last set time, become the workout start time(weve moved up the workout start time)
    //actually this seems very similar to the FIRS TIME run.
    saveWorkoutStartedAtSeconds(timeNowInSeconds());
    saveWorkoutLatestActivityAtSeconds(timeNowInSeconds());

}

//the one rule for whether an exercise's latest set belongs to an earlier workout.
//a set that happened since the workout started belongs to this workout, so the user's
//Same or New Workout answer decides this, however long the gap was.
isExerciseLastSetFromEarlierWorkout = (exercise) => {
    const lastSetIdx = parseInt(exercise.setidx);
    const lastSetSeconds = parseFloat(exercise.secList[lastSetIdx]).toFixed(0);

    //i think if setidx is 0 and secList(idx) is 0, then
    //there is no latest set to judge
    if ((lastSetIdx == 0) && (lastSetSeconds == 0)) {
        return false;
    }

    const workoutStartedAtSeconds = readWorkoutStartedAtSeconds();
    return !(lastSetSeconds >= workoutStartedAtSeconds);
}

//any trace of past training: current sets, a previous count, or a kept earlier workout
hasExerciseHistory = (exercise) => {
    return (exercise.setidx > 0) || (exercise.prevWkNumSets > 0) || (exercise.stateBeforeThisWorkout !== undefined);
}

//the set count of this exercise's previous workout, as the user should see it right now.
//the stored count only updates when the next set is added, so until then the sets on
//record from an earlier workout ARE the previous workout.
previousWorkoutSetCount = (exercise) => {
    if (isExerciseLastSetFromEarlierWorkout(exercise)) {
        return exercise.setidx;
    }
    return exercise.prevWkNumSets;
}

//THIS CALLED WHEN SET TO BE ADDED
//if user clicks to add another set, to an exercise,
//we need to know if the new set is added to the displayed sets for that exercise,(current workout)
//or if we need to zero stuff and this is the first set
adjustExerciseToBePartOfCurrentWorkoutAsNeeded = (exerciseId) => {

    const timeNowSeconds = timeNowInSeconds();

    const json = readStoredExercise(exerciseId);

    //if the latest set belongs to this workout, the next set just continues the count
    if (!isExerciseLastSetFromEarlierWorkout(json)) {
        return;
    }

    // we keep the state being replaced, so deleting the only set of this workout can restore it
    // we also have to update the latest set idx as the prev workout set
    // we also have to clear the array of current set seconds
    // and finally store all that back to local storage
    json.stateBeforeThisWorkout = {
        'setidx': json.setidx,
        'secList': json.secList,
        'prevWkNumSets': json.prevWkNumSets,
    };
    json.secList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    json.prevWkNumSets = json.setidx;
    json.setidx = 0;
    saveExercise(json);
}

//removes the latest set from an exercise record. the caller saves the record.
//deleting the only set of a workout puts the exercise back as it stood before that workout,
//so it never looks like it was never done. with no earlier workout, it really is at zero.
removeLatestSetFromExercise = (exercise) => {
    const setidx = parseInt(exercise.setidx);

    if (setidx === 1 && exercise.stateBeforeThisWorkout) {
        const earlierState = exercise.stateBeforeThisWorkout;
        exercise.setidx = earlierState.setidx;
        exercise.secList = earlierState.secList;
        exercise.prevWkNumSets = earlierState.prevWkNumSets;
        delete exercise.stateBeforeThisWorkout;
        return;
    }

    //if not already at first set, dec the current set
    if (setidx > 0) {
        exercise.setidx = setidx - 1;
    }
}

getExerciseLatestSetSeconds = (exerciseId) => {
    //we also have to look at the specific exercise times
    const json = readStoredExercise(exerciseId);
    if (json === null) {
        return 0;
    }

    const setidx = parseInt(json.setidx);

    return json.secList[setidx];
}

doesUserHaveToBeAskedAsWeUpdateStoredCurrentWorkoutTimeAndPreviousWorkoutSetsAsNeeded = (exerciseId) => {

    //we have to look at global workout time
    let wkStartAtSecs = readWorkoutStartedAtSeconds().toFixed(0);
    let wkLatestSecs = readWorkoutLatestActivityAtSeconds().toFixed(0);
    wkStartAtSecs = parseFloat(wkStartAtSecs).toFixed(0);
    wkLatestSecs = parseFloat(wkLatestSecs).toFixed(0);


    //BRAND NEW 1st TIME WORKOUT
    //THIS SHOULD ONLY HAPPEN ONCE, IF BROWSER LOCAL STORAGE IS EMPTY OR CLEARED
    //this could be the very first workout (start time is 0);
    // so we save the new start time, and it is also the time of the 1st set.
    if (wkStartAtSecs === null || wkStartAtSecs === NaN || wkStartAtSecs == 0 || (wkStartAtSecs > wkLatestSecs)) {
        saveWorkoutStartedAtSeconds(timeNowInSeconds());
        saveWorkoutLatestActivityAtSeconds(timeNowInSeconds());
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

        //const exerciseLatestSeconds = getExerciseLatestSetSeconds(exerciseId);
        //const isExerciseLatestSecondsLessThanMaxTimeBetweenSets = ((timeNowInSeconds() - exerciseLatestSeconds) < T_MAX_TIME_BETWEEN_SETS);
        //const isExerciseHaveZeroSetsZeroTime = (exerciseLatestSeconds == 0);

        // are we still in current or has it passed
        //if (isWorkoutUnderMaxTimeBetweenSets && (isExerciseLatestSecondsLessThanMaxTimeBetweenSets || isExerciseHaveZeroSetsZeroTime)) {
        if (isWorkoutUnderMaxTimeBetweenSets) {
            //still in current, just update the latest time
            saveWorkoutLatestActivityAtSeconds(timeNowInSeconds());
            //that's it we're done for this go round
            return false;//we knew what to do, no need to ask user
        }
    }

    //PAST CURRENT WORKOUT, START NEW ONE
    //the next scenario is that we are no longer in current workout, too much time has passed.
    if (wkLatestSecs > 0) {//met min requirements, so this is NOT a diff scenario.
        // are we past current workout?
        if ((timeNowInSeconds() - wkLatestSecs) > T_MAX_WK_TIME) {

            adjustEverythingToStartNewWorkout(exerciseId);

            return false;//we knew what to do, no need to ask user
        }
    }

    //WE DONT KNOW, COULD BE CURENT WORKOUT, ASK
    //is this a new workout starting? or is it still current workout?
    //because the user has taken a long time between sets
    return true;
}
