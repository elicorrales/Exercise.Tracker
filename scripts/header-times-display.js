// header-times-display.js
// Writes the two times at the top of the screen: the clock and the workout duration.
// Why it is its own file: the header is a separate view from the exercise list, and it is
// about to change when the "Workout" text becomes a Settings button.
// It depends on clock.js and elapsed-time-text.js.

displayWorkoutTime = () => {
    const wkStartAtSecs = parseFloat(localStorage.getItem('currentWorkoutStartedAtSeconds')).toFixed(0);
    const wkLatestSecs = parseFloat(localStorage.getItem('currentWorkoutLatestSetAtSeconds')).toFixed(0);
    const workoutTimeLabel = document.getElementById('currentWorkoutTime');
    workoutTimeLabel.innerHTML = createDisplayableSeconds(wkLatestSecs - wkStartAtSecs);
}

displayCurrentTime = () => {
    let currentTime = getCurrentTime();
    document.getElementById('currentTime').innerHTML =
        ((currentTime.hours   < 10) ? '0' : '') + `${currentTime.hours}:` + ((currentTime.minutes < 10) ? '0' : '') + `${currentTime.minutes}`;
}
