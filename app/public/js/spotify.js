var spotifyApi = (function () {

  var _access_token = '';

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  // constructor
  var _spotifyApi = function() {
    _access_token = getHashParams().access_token;
  };

  /**
   * Make an ajax call to the Spotify Web API
   * @param  {url} Spotify Web API URL
   * @param  {data} data to send in the api call
   * @param  {callback} callback function for api call
   * @return {ajax} ajax promise
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
   * @return {ajax} ajax promise
   */
  _spotifyApi.prototype.getUserProfile = function(callback) {
    return callSpotifyWebApi(
      'https://api.spotify.com/v1/me', {}, callback);
  };

  /**
   * Get tracks in the user collection
   * @param  {offset} index of first object to return
   * @param  {limit} number of tracks to return, max 50
   * @return {ajax} ajax promise
   */
  _spotifyApi.prototype.getUserTracks = function(offset, limit, callback) {
    return callSpotifyWebApi(
      'https://api.spotify.com/v1/me/tracks?limit=' + limit + '&offset=' +
      offset, {}, callback);
  };

  /**
   * Get the artist object that corresponds to the ID
   * @param  {id} artist ID
   * @return {ajax} ajax promise
   */
  _spotifyApi.prototype.getArtistById = function(id, callback) {
    return callSpotifyWebApi(
      'https://api.spotify.com/v1/artists/' + id, {}, callback);
  };

  return _spotifyApi;
}());

