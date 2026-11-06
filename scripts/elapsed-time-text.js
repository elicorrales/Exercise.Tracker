// elapsed-time-text.js
// Turns a number of seconds into the short text shown on screen, such as 45s, 2.5h or 3.0d.
// Why it is its own file: the row colours compare against this exact text, so the format
// has one home. It depends on workout-time-limits.js.

createDisplayableSeconds = (seconds) => {

    let displayTime = '';

    if (seconds > T_FULL_DAY) {
        displayTime = parseFloat(seconds / T_FULL_DAY).toFixed(1) + 'd';
    } else if (seconds > T_ONE_HOUR) {
        displayTime = parseFloat(seconds / T_ONE_HOUR).toFixed(1) + 'h';
    } else if (seconds > T_ONE_MIN) {
        displayTime = parseFloat(seconds / T_ONE_MIN).toFixed(1) + 'm';
    } else {
        displayTime = seconds + 's';
    }

    return displayTime;
}
