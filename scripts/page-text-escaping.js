// page-text-escaping.js
// Makes user-typed text safe to place in the page's markup.
// Why it is its own file: exercise names are typed by users and written through innerHTML,
// so a name like <b> or a quote must show as text instead of changing the page. Every place
// that writes a name into markup calls this.

escapeTextForPage = (text) => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
