// exercise-storage.js
// The only place that reads, writes or removes a stored exercise record.
// Why it is its own file: permanent exercise ids will change how records are stored, and
// that change should land here alone. Every function goes straight to localStorage and
// nothing is kept in memory, so a choice survives the browser being killed at any moment
// (project law 1 in ARCHITECTURE.txt).

createBlankExercise = (exerciseName) => {
    return {
        'name': exerciseName,
        'setidx': 0,
        'secList': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'prevWkNumSets': 0,
    };
}

//gives null for an exercise that has never been saved
readStoredExercise = (exerciseName) => {
    const exerciseJsonFromLocalStorage = localStorage.getItem(exerciseName);
    if (exerciseJsonFromLocalStorage === null) {
        return null;
    }
    return JSON.parse(exerciseJsonFromLocalStorage);
}

saveExercise = (exercise) => {
    localStorage.setItem(exercise.name, JSON.stringify(exercise));
}

removeStoredExercise = (exerciseName) => {
    localStorage.removeItem(exerciseName);
}
