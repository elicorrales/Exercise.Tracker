// exercise-name-rules.js
// Decides what a typed exercise name may be: how it is cleaned, how names are compared, and
// why one might be refused.
// Why it is its own file: these rules apply wherever a name is typed, so rename and create
// must share them. The comparison form is never saved. Users keep the capitals they typed.
// It depends on exercise-storage.js.

const EXERCISE_NAME_MAX_LENGTH = 12;

//the form a name is saved in. normalizing means an accented letter is stored one way,
//however the phone's keyboard encoded it.
cleanExerciseName = (typedName) => {
    return typedName.normalize('NFC').trim().replace(/\s+/g, ' ');
}

//the form names are compared in, so Bench, bench and ' BENCH ' count as the same name
exerciseNameComparisonKey = (typedName) => {
    return cleanExerciseName(typedName).toLowerCase();
}

isExerciseNameTakenByAnotherExercise = (typedName, exerciseId) => {
    const comparisonKey = exerciseNameComparisonKey(typedName);
    return readExerciseIds()
        .filter((otherExerciseId) => otherExerciseId !== exerciseId)
        .some((otherExerciseId) => exerciseNameComparisonKey(readStoredExercise(otherExerciseId).name) === comparisonKey);
}

//both reason functions give the message to show the user, or an empty string if the name
//can be used. exerciseId is the exercise allowed to hold this name already, if any.
const reasonNameBreaksTheRules = (cleanedName, exerciseId) => {
    if (cleanedName === '') {
        return 'Name is empty';
    }
    if (cleanedName.length > EXERCISE_NAME_MAX_LENGTH) {
        return 'Name too long';
    }
    if (isExerciseNameTakenByAnotherExercise(cleanedName, exerciseId)) {
        return 'Name already used';
    }
    return '';
}

reasonNewExerciseNameCannotBeUsed = (typedName) => {
    return reasonNameBreaksTheRules(cleanExerciseName(typedName), null);
}

reasonExerciseNameCannotBeUsed = (typedName, exerciseId) => {
    const cleanedName = cleanExerciseName(typedName);
    const reasonRefused = reasonNameBreaksTheRules(cleanedName, exerciseId);
    if (reasonRefused !== '') {
        return reasonRefused;
    }
    if (cleanedName === readStoredExercise(exerciseId).name) {
        return 'Name not changed';
    }
    return '';
}
