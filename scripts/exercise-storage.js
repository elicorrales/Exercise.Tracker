// exercise-storage.js
// The only place that reads, writes or removes stored exercises: one record per exercise,
// plus a catalog holding the list of ids.
// Why it is its own file: how exercises are stored is one decision, made here alone. Every
// function goes straight to localStorage and nothing is kept in memory, so a choice survives
// the browser being killed at any moment (project law 1 in ARCHITECTURE.txt).
//
// An exercise's id never changes. Its name can. Everything except the screen uses the id.
// It depends on default-exercise-names.js.

const EXERCISE_CATALOG_KEY = 'exerciseCatalog';

const storageKeyForExercise = (exerciseId) => `exercise:${exerciseId}`;

createBlankExercise = (exerciseId, exerciseName) => {
    return {
        'id': exerciseId,
        'name': exerciseName,
        'setidx': 0,
        'secList': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        'prevWkNumSets': 0,
    };
}

//gives null for an exercise that has never been saved
readStoredExercise = (exerciseId) => {
    const exerciseJsonFromLocalStorage = localStorage.getItem(storageKeyForExercise(exerciseId));
    if (exerciseJsonFromLocalStorage === null) {
        return null;
    }
    return JSON.parse(exerciseJsonFromLocalStorage);
}

saveExercise = (exercise) => {
    localStorage.setItem(storageKeyForExercise(exercise.id), JSON.stringify(exercise));
}

renameExerciseKeepingSets = (exerciseId, newName) => {
    const exercise = readStoredExercise(exerciseId);
    exercise.name = newName;
    saveExercise(exercise);
}

//the slot is being reused for a different exercise: same id, nothing of the old history
renameExerciseClearingSets = (exerciseId, newName) => {
    saveExercise(createBlankExercise(exerciseId, newName));
}

readExerciseIds = () => {
    const catalogJsonFromLocalStorage = localStorage.getItem(EXERCISE_CATALOG_KEY);
    if (catalogJsonFromLocalStorage === null) {
        return [];
    }
    return JSON.parse(catalogJsonFromLocalStorage).exerciseIds;
}

//the catalog is written last, so its presence means this finished. a browser killed part way
//leaves no catalog, and the next load simply does it again.
seedDefaultExercisesIfNeeded = () => {
    if (localStorage.getItem(EXERCISE_CATALOG_KEY) !== null) {
        return;
    }

    const exerciseIds = defaultExerciseNames.map((exerciseName, index) => {
        const exerciseId = `exercise-${index + 1}`;
        saveExercise(createBlankExercise(exerciseId, exerciseName));
        return exerciseId;
    });

    const catalog = {
        'nextExerciseNumber': exerciseIds.length + 1,
        'exerciseIds': exerciseIds,
    };
    localStorage.setItem(EXERCISE_CATALOG_KEY, JSON.stringify(catalog));
}

//the record is written first and the catalog last, as in the first load. a browser killed
//between the two leaves a record nothing lists, and the next add simply reuses its id.
addStoredExercise = (exerciseName) => {
    const catalog = JSON.parse(localStorage.getItem(EXERCISE_CATALOG_KEY));
    const exerciseId = `exercise-${catalog.nextExerciseNumber}`;

    saveExercise(createBlankExercise(exerciseId, exerciseName));

    catalog.exerciseIds.push(exerciseId);
    catalog.nextExerciseNumber = catalog.nextExerciseNumber + 1;
    localStorage.setItem(EXERCISE_CATALOG_KEY, JSON.stringify(catalog));
}

//the catalog is written first, so a browser killed between the two writes leaves only a
//record nothing lists. the id counter is left alone, so this id is never given out again.
deleteStoredExercise = (exerciseId) => {
    const catalog = JSON.parse(localStorage.getItem(EXERCISE_CATALOG_KEY));
    catalog.exerciseIds = catalog.exerciseIds.filter((otherExerciseId) => otherExerciseId !== exerciseId);
    localStorage.setItem(EXERCISE_CATALOG_KEY, JSON.stringify(catalog));

    localStorage.removeItem(storageKeyForExercise(exerciseId));
}

removeAllExercises = () => {
    readExerciseIds().forEach((exerciseId) => {
        localStorage.removeItem(storageKeyForExercise(exerciseId));
    });
    localStorage.removeItem(EXERCISE_CATALOG_KEY);
}
