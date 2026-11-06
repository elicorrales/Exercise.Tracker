// app-start.js
// Starts the app when the page has loaded, and sets up the timers that keep the screen fresh.
// Why it is its own file: it is the one place that shows the startup order, and the one
// script that runs on load instead of only defining functions. It loads last.

window.onload = function () {

    initializeCurrentWorkoutTimesInLocalStorageAsNeeded();

    //workout time will be manually updates right at load, then auto thereafter
    displayWorkoutTime();
    setInterval(displayWorkoutTime, 2500);

    //exercises and their sets and times will be manually updated right at load, then auto thereafter
    createDisplayableExerciseList();
    setInterval(createDisplayableExerciseList, 3000);
}
