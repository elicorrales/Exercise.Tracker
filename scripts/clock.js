// clock.js
// The only place the app reads the system clock.
// Why it is its own file: every workout decision depends on "now", so keeping that read in
// one place means tests can substitute a fixed time.

getCurrentTime = () => {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();

    return { 'hours': hours, 'minutes': minutes };
}

timeNowInSeconds = () => {
    return Math.round(Date.now() / 1000);
}
