
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
 * Get tracks in the user collection
 * @param  {offset} index of first object to return
 * @param  {limit} number of tracks to return, max 50
 * @param  {callback} callback function
 * @return {ajax} ajax promise
 */
var getUserTracks = function(offset, limit, callback) {
  return callSpotifyWebAPI(
    'https://api.spotify.com/v1/me/tracks?limit=' + limit +
    '&offset=' + offset, {}, callback);
};

/**
 * Get the artist object that corresponds to the ID
 * @param  {id} artist ID
 * @param  {callback} callback function
 * @return {ajax} ajax promise
 */
var getArtistById = function(id, callback) {
  return callSpotifyWebAPI(
    'https://api.spotify.com/v1/artists/' + id, {}, callback);
};

exports.getArtistById = getArtistById;
exports.getUserTracks = getUserTracks;
exports.getUserProfile = getUserProfile;
// exports.callSpotifyWebAPI = callSpotifyWebAPI;