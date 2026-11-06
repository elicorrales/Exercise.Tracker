// workout-time-limits.js
// The time spans, in seconds, that the app's workout decisions and displays are built on.
// Why it is its own file: these numbers define what counts as the same workout, so they
// are tuned on their own, and both the rules and the row display read them.

const T_ONE_MIN = 60;
const T_ONE_HOUR = 3600;
const T_MAX_WK_TIME = T_ONE_HOUR * 4;
const T_QUART_DAY = T_ONE_HOUR * 6;
const T_HALF_DAY = T_QUART_DAY * 2;
const T_FULL_DAY = T_HALF_DAY * 2;
const T_MAX_TIME_BETWEEN_SETS = T_ONE_HOUR * 2; // 2 hours between sets should be plenty. this helps keep a more accurate workout time
