
/**
 * Make an ajax call to the Spotify Web API
 * @param  {url} Spotify Web API URL
 * @param  {data} data to send in the api call
 * @param  {callback} callback function for api call
 * @return {ajax} ajax promise
 */
var callSpotifyWebAPI = function(url, data, callback) {
  return $.ajax({
    url: url,
    dataType: 'json',
    data: data,
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    success: function(response) {
      callback(response);
    },
    error: function(response) {
      callback(null);
    }
  });
};

/**
 * Get the current user profile
 * @param  {callback} callback function
 * @return {ajax} ajax promise
 */
var getUserProfile = function(callback) {
  return callSpotifyWebAPI(
    'https://api.spotify.com/v1/me', {}, callback);
};

/**
 * Get the tracks in the user collection
 * @param  {callback} callback function
 * @return {ajax} ajax promise
 */
var getUserTracks = function(callback) {
  return callSpotifyWebAPI(
    'https://api.spotify.com/v1/me/tracks', {}, callback);
};

/**
 * Get the artist object that corresponds to the ID
 * @param  {id} artist ID
 * @param  {callback} callback function
 * @return {ajax} ajax promise
 */
var getArtist = function(id, callback) {
  return callSpotifyWebAPI(
    'https://api.spotify.com/v1/artists/' + id, {}, callback);
};

exports.getArtist = getArtist;
exports.getUserTracks = getUserTracks;
exports.getUserProfile = getUserProfile;
exports.callSpotifyWebAPI = callSpotifyWebAPI;