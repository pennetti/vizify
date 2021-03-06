var SpotifyApi = (function($) {

  // TODO: get errors from params, check access_token before request
  // var _access_token = null;
  var spotifyApi = {},
      _access_token = getHashParams().access_token;

  /**
   * Obtains parameters from the hash of the URL
   * @return {object} parameters in object form
   */
  function getHashParams() {
    var params,
        hashParams = {},
        regex = /([^&;=]+)=?([^&;]*)/g,
        urlAnchor = window.location.hash.substring(1);

    while (params = regex.exec(urlAnchor)) {
       hashParams[params[1]] = decodeURIComponent(params[2]);
    }

    return hashParams;
  }

  /**
   * Make an ajax call to the Spotify Web API
   * @param  {string} spotify web api uri string
   * @param  {object} data object to send in the api call
   * @param  {function} callback function for api call
   * @return {promise} promise resolved on completion of api call
   */
  function callSpotifyWebApi(uri, data, callback) {
    return $.ajax({
      url: 'https://api.spotify.com/v1/' + uri,
      type: 'get',
      dataType: 'json',
      data: data,
      headers: {
        'Authorization': 'Bearer ' + _access_token
      },
      success: function(response) {
        callback(response);
      },
      error: function(response, status, request) {
        callback(null);
      }
    });
  }

  /**
   * Get the current user profile
   * @return {promise} ajax promise
   */
  spotifyApi.getUserProfile = function(callback) {
    return callSpotifyWebApi('me', {}, callback);
  };

  /**
   * Get tracks in the user collection
   * @param  {number} index of first object to return
   * @param  {number} number of tracks to return, max 50
   * @return {promise} ajax promise
   */
  spotifyApi.getUserTracks = function(offset, callback) {
    return callSpotifyWebApi(
      'me/tracks?' + $.param({ limit: 50, offset: offset }), {}, callback);
  };

  /**
   * Get starred playlist for current user (if public)
   * @param  {number} index of first object to return
   * @param  {number} number of tracks to return, max 100
   * @param  {string} user id to use when looking up starred playlist
   * @return {promise} ajax promise
   */
  spotifyApi.getUserStarredTracks = function(offset, id, callback) {
    // TODO: check if starred playlist is public
    return callSpotifyWebApi(
      'users/' + id + '/starred/tracks?' +
      $.param({ limit: 100, offset: offset }), {}, callback);
  };

  /**
   * Get the artist object that corresponds to the ID
   * @param  {string} artist ID
   * @return {promise} ajax promise
   */
  spotifyApi.getArtistById = function(id, callback) {
    return callSpotifyWebApi('artists/' + id, {}, callback);
  };

  /**
   * Get artist objects for each ID
   * @param  {string} artist IDs separated by commas, max 50
   * @return {promise} ajax promise
   */
  spotifyApi.getArtistsByIds = function(ids, callback) {
    return callSpotifyWebApi('artists?ids=' + ids, {}, callback);
  };

  return spotifyApi;
}(jQuery));
