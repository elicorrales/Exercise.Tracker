// workout-time-display.js
// Writes the workout duration at the top of the screen, beside the "Worked:" label.
// Why it is its own file: the header is a separate view from the exercise list. The time
// shown is first activity to last activity, so it only moves when the user does something.
// It depends on elapsed-time-text.js.

displayWorkoutTime = () => {
    const wkStartAtSecs = parseFloat(localStorage.getItem('currentWorkoutStartedAtSeconds')).toFixed(0);
    const wkLatestSecs = parseFloat(localStorage.getItem('currentWorkoutLatestSetAtSeconds')).toFixed(0);
    const workoutTimeLabel = document.getElementById('currentWorkoutTime');
    workoutTimeLabel.innerHTML = createDisplayableSeconds(wkLatestSecs - wkStartAtSecs);
}
