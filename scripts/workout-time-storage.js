// workout-time-storage.js
// The only place that reads, writes or removes the current workout's two stored times.
// Why it is its own file: the key names and the text-to-number conversion live here once,
// and user accounts will need these times kept per user. Every function goes straight to
// localStorage (project law 1 in ARCHITECTURE.txt).
// The latest activity key keeps its old name, so stored data stays readable.

const WORKOUT_STARTED_KEY = 'currentWorkoutStartedAtSeconds';
const WORKOUT_LATEST_ACTIVITY_KEY = 'currentWorkoutLatestSetAtSeconds';

//both reads give NaN when the time has never been saved
readWorkoutStartedAtSeconds = () => {
    return parseFloat(localStorage.getItem(WORKOUT_STARTED_KEY));
}

readWorkoutLatestActivityAtSeconds = () => {
    return parseFloat(localStorage.getItem(WORKOUT_LATEST_ACTIVITY_KEY));
}

saveWorkoutStartedAtSeconds = (seconds) => {
    localStorage.setItem(WORKOUT_STARTED_KEY, seconds);
}

saveWorkoutLatestActivityAtSeconds = (seconds) => {
    localStorage.setItem(WORKOUT_LATEST_ACTIVITY_KEY, seconds);
}

removeWorkoutTimes = () => {
    localStorage.removeItem(WORKOUT_STARTED_KEY);
    localStorage.removeItem(WORKOUT_LATEST_ACTIVITY_KEY);
}
