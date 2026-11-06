// clock.js
// The only place the app reads the system clock.
// Why it is its own file: every workout decision depends on "now", so keeping that read in
// one place means tests can substitute a fixed time.

timeNowInSeconds = () => {
    return Math.round(Date.now() / 1000);
}
