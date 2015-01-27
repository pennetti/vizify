/**
 * Helper function to return resolution of all promises in passed array
 * http://stackoverflow.com/a/12206897/854645
 * @param {array} array of promises
 * @return {promise} promise of all array promises
 */
$.whenall = function(arr) { return $.when.apply($, arr); };

/**
 * Store a JSON object in local storage
 * @param {key} local storage object key
 * @param {value} JSON object
 */
Storage.prototype.setObject = function(key, value) {
  this.setItem(key, JSON.stringify(value));
};

/**
 * Retrieve a JSON object from local storage
 * @param {string} key of local storage object to return
 * @return {object} JSON object value stored at given key
 */
Storage.prototype.getObject = function(key) {
  var value = this.getItem(key);
  return value && JSON.parse(value);
};
