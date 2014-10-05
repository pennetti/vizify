var spotifyApi = (function($) {

  // TODO: get errors from params, check access_token before request
  var _access_token = null;

  /**
   * Obtains parameters from the hash of the URL
   * @return {Object} parameters in object form
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
   * Spotify Web API construc
   */
  var _spotifyApi = function() {
    _access_token = getHashParams().access_token;
  };

  /**
   * Make an ajax call to the Spotify Web API
   * @param  {url} Spotify Web API URL
   * @param  {data} data to send in the api call
   * @param  {callback} callback function for api call
   * @return {promise} ajax promise
   */
  function callSpotifyWebApi(uri, data, callback) {
    return $.ajax({
      url: 'https://api.spotify.com/v1/' + uri,
      dataType: 'json',
      data: data,
      headers: {
        'Authorization': 'Bearer ' + _access_token
      },
      success: function(response) {
        callback(response);
      },
      error: function(response) {
        callback(null);
      }
    });
  }

  /**
   * Get the current user profile
   * @return {promise} ajax promise
   */
  _spotifyApi.prototype.getUserProfile = function(callback) {
    return callSpotifyWebApi('me', {}, callback);
  };

  /**
   * Get tracks in the user collection
   * @param  {offset} index of first object to return
   * @param  {limit} number of tracks to return, max 50
   * @return {promise} ajax promise
   */
  _spotifyApi.prototype.getUserTracks = function(offset, limit, callback) {
    return callSpotifyWebApi(
      'me/tracks?' + $.param({ limit: limit, offset: offset }), {}, callback);
  };

  /**
   * Get starred playlist for current user (if public)
   * @param  {offset} index of first object to return
   * @param  {limit} number of tracks to return, max 100
   * @param  {id} user id to use when looking up starred playlist
   * @return {promise} ajax promise
   */
  _spotifyApi.prototype.getUserStarredTracks = function(offset, limit, id, callback) {
    // TODO: check if starred playlist is public
    return callSpotifyWebApi(
      'users/' + id + '/starred/tracks?' +
      $.param({ limit: limit, offset: offset }), {}, callback);
  };

  /**
   * Get the artist object that corresponds to the ID
   * @param  {id} artist ID
   * @return {promise} ajax promise
   */
  _spotifyApi.prototype.getArtistById = function(id, callback) {
    return callSpotifyWebApi('artists/' + id, {}, callback);
  };

  return _spotifyApi;
}(jQuery));
