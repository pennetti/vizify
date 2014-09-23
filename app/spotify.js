var rp = require('request-promise'),
    querystring = require('querystring');


/**
 * Make an ajax call to the Spotify Web API
 * @param  {url} Spotify Web API URL
 * @param  {data} data to send in the api call
 * @param  {callback} callback function for api call
 * @return {rp} request promise
 */
var callSpotifyWebApi = function(url, data, access_token) {
  var options = {
    url: url,
    dataType: 'json',
    data: data,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };

  return rp(options);
};

/**
 * Get the current user profile
 * @param  {access_token} access token
 * @return {rp} request promise
 */
var getUserProfile = function(access_token) {
  return callSpotifyWebApi(
    'https://api.spotify.com/v1/me', {}, access_token);
};

/**
 * Get tracks in the user collection
 * @param  {offset} index of first object to return
 * @param  {limit} number of tracks to return, max 50
 * @return {rp} request promise
 */
var getUserTracks = function(offset, limit, access_token) {
  return callSpotifyWebApi(
    'https://api.spotify.com/v1/me/tracks' +
    querystring.stringify({
      limit: limit,
      offset: offset
    }), {}, access_token);
};

/**
 * Get the artist object that corresponds to the ID
 * @param  {id} artist ID
 * @param  {access_token} access token
 * @return {rp} request promise
 */
var getArtistById = function(id, access_token) {
  return callSpotifyWebApi(
    'https://api.spotify.com/v1/artists/' + id, {}, access_token);
};

exports.getArtistById = getArtistById;
exports.getUserTracks = getUserTracks;
exports.getUserProfile = getUserProfile;
