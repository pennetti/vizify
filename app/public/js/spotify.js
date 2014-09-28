var spotifyApi = (function() {

  // TODO: get errors from params, check access_token before request
  var _access_token = 'ACCESS_TOKEN';

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
  function callSpotifyWebApi(url, data, callback) {
    return $.ajax({
      url: url,
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
    return callSpotifyWebApi(
      'https://api.spotify.com/v1/me', {}, callback);
  };

  /**
   * Get tracks in the user collection
   * @param  {offset} index of first object to return
   * @param  {limit} number of tracks to return, max 50
   * @return {promise} ajax promise
   */
  _spotifyApi.prototype.getUserTracks = function(offset, limit, callback) {
    return callSpotifyWebApi(
      'https://api.spotify.com/v1/me/tracks?limit=' + limit + '&offset=' +
      offset, {}, callback);
  };

  /**
   * Get the artist object that corresponds to the ID
   * @param  {id} artist ID
   * @return {promise} ajax promise
   */
  _spotifyApi.prototype.getArtistById = function(id, callback) {
    return callSpotifyWebApi(
      'https://api.spotify.com/v1/artists/' + id, {}, callback);
  };

  return _spotifyApi;
}());

