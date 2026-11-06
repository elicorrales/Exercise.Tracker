// exercise-row-colours.js
// Decides an exercise row's background colour from its set count and the age of its last set.
// Why it is its own file: these colours are information, not decoration. They tell the user
// at a glance what was done and what is overdue, so they live apart from the stylesheet.
// It depends on workout-time-limits.js and clock.js.

determineBackgroundColorBasedOnNumberOfSetsDone = (exerciseCount) => {

    var backgroundColor;
    switch (exerciseCount) {
        case 0:
            backgroundColor = 'dimgrey';
            break;
        case 1:
            backgroundColor = '#ff0000';//red
            break;
        case 2:
            backgroundColor = '#ff9900';//orange
            break;
        case 3:
            backgroundColor = 'gold';
            break;
        case 4:
            backgroundColor = '#ffff4d';
            break;
        case 5:
            backgroundColor = '#ccff33';
            break;
        case 6:
            backgroundColor = '#99ff33';
            break;
        case 7:
            backgroundColor = '#66ff77';
            break;
        case 8:
            backgroundColor = '#00ffBA';
            break;
        case 9:
            backgroundColor = '#77eeDD';
            break;
        case 10:
            backgroundColor = '#66E0ff';
            break;
        case 11:
            backgroundColor = '#99ddFf';
            break;
        case 12:
        case 13:
            backgroundColor = '#bbddff';
            break;
        default:
            backgroundColor = 'white';
            break;
    }

    return backgroundColor;
}

adjustBackgroundColorIfNeededBasedOnTimeElapsedSinceSet = (exerCount, lastSecs, displayTime, origBackgroundColor) => {
    const elapsedTime = timeNowInSeconds() - lastSecs;
    let backgroundColor;
    if (exerCount > 0) {
        if ((elapsedTime >= (T_FULL_DAY * 8))) { // 10+ days old
            backgroundColor = 'lightgrey';
        } else if (elapsedTime >= (T_FULL_DAY * 7)) { //10
            backgroundColor = '#8383af';
        } else if (elapsedTime >= (T_FULL_DAY * 6)) { //9
            backgroundColor = '#5c8a8a';
        } else if (elapsedTime >= (T_FULL_DAY * 5)) { //8
            backgroundColor = '#888844';
        } else if (elapsedTime >= (T_FULL_DAY * 4)) { //7
            backgroundColor = '#b37700';
        } else if ((elapsedTime >= (T_FULL_DAY * 3)) || (displayTime == '3.0d')) { //6
            backgroundColor = '#c65353';
        } else if ((elapsedTime >= (T_FULL_DAY * 2)) || (displayTime == '2.0d') ) { //5
            backgroundColor = '#bf40b4';
        } else if ((elapsedTime >= T_FULL_DAY) || (displayTime == '1.0d')) {    //4
            backgroundColor = '#9966ff';
        } else if (elapsedTime >= T_HALF_DAY) {    //3
            backgroundColor = '#6682ff';
        } else if (elapsedTime >= T_QUART_DAY) {   //2
            backgroundColor = '#66aaff';
        } else if (elapsedTime >= T_MAX_WK_TIME) { //1
            backgroundColor = '#11bbff';
        } else {
            backgroundColor = origBackgroundColor;
        }
    } else {
        backgroundColor = 'lightgrey';
    }

    return backgroundColor;
}
