/**
 * Escape user input for safe RegExp usage.
 */
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
