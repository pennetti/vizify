var vizifyData = (function($) {

  $.whenall = function(arr) { return $.when.apply($, arr); };

  Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
  };

  Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
  };

  var _sp = new spotifyApi(),

      _data = { months: {}, total: 0 },
      _tracks = { total: 0 }, // track -> artist
      _genres = { total: 0 }, // subgenre -> genre
      _genreFamilies = { total: 0 },
      _artists = { total: 0 }; // artist -> subgenre

  /**
   * Constructor
   */
  var _vizifyData = function() {


  };

  /**
   *
   */
  _vizifyData.prototype.getDataObject = function() {

    var deferred = $.Deferred();

    getTracks().then(function(tracks) {
      getData().then(function() {
        buildDataObject();
        deferred.resolve(_data);
      });
    });

    return deferred.promise();
  };

  /**
   *
   */
  function getTracks() {

    var deferred = $.Deferred();

    if (localStorage.getItem('_tracks')) {
      _tracks = localStorage.getObject('_tracks');
      deferred.resolve(_tracks);
    } else {
      getUserLibrary().then(function() {
        getUserStarredPlaylist().then(function() {
          localStorage.setObject('_tracks', _tracks);
          deferred.resolve(_tracks);
        });
      });
    }

    return deferred.promise();
  }

  // helper
  function processTrack(track) {
    _tracks.total++;
    _tracks[track.id] = {};
    _tracks[track.id].artists = [];
    _tracks[track.id].added_at = tracks.items[i].added_at;

    for (var j = 0; j < track.artists.length; j++) {
      _tracks[track.id].artists.push(track.artists[j].id);
    }
  }

  /**
   *
   */
  function getUserLibrary() {

    var deferred = $.Deferred();

    // TODO: add notify() and progress() to deferred
    _sp.getUserTracks(0, 50, function(tracks) {
      processUserLibrary(tracks, 0, deferred);
    });

    return deferred.promise();
  }

  /**
   *
   */
  function processUserLibrary(tracks, offset, deferred) {
    // TODO: add deferred.notify() here

    offset += tracks.items.length;
    document.getElementById('vizify').innerText =
      Math.round(offset / tracks.total * 100) + '%';

    for (var i = 0; i < tracks.items.length; i++) {
      processTrack(tracks.items[i].track);
    }

    if (tracks.next) {
      _sp.getUserTracks(offset, 50, function(tracks) {
        processUserLibrary(tracks, offset, deferred);
      });
    } else {
      deferred.resolve();
      return;
    }
  }

  /**
   *
   */
  function getUserStarredPlaylist() {

    var deferred = $.Deferred();

    _sp.getUserProfile(function(user) {
      _sp.getUserStarredTracks(0, 100, user.id, function(tracks) {
        processUserStarredPlaylist(tracks, 0, user.id, deferred);
      });
    });

    return deferred.promise();
  }

  /**
   *
   */
  function processUserStarredPlaylist(tracks, offset, userId, deferred) {
    // TODO: add timestamp comparison to take earliest added date
    // TODO: add deferred.notify() here
    var track = null;

    offset += tracks.items.length;
    document.getElementById('vizify').innerText =
      Math.round(offset / tracks.total * 100) + '%';

    for (var i = 0; i < tracks.items.length; i++) {
      track = tracks.items[i].track;

      if (track.id in _tracks) {
        _tracks[track.id].added_at = tracks.items[i].added_at;
      } else {
        processTrack(track);
      }
    }

    if (tracks.next) {
      _sp.getUserStarredTracks(offset, 100, userId, function(tracks) {
        processUserStarredPlaylist(tracks, offset, userId, deferred);
      });
    } else {
      deferred.resolve();
      return;
    }
  }

  /**
   *
   */
  function getData() {

    var deferred = $.Deferred();

    getGenreFamilies();

    if (localStorage.getItem('_months')) {
      _months = localStorage.getObject('_months');
    } else {
      getMonths();
      localStorage.setObject('_months', _months);
    }

    if (localStorage.getItem('_artists') && localStorage.getItem('_genres')) {
      _artists = localStorage.getObject('_artists');
      _genres = localStorage.getObject('_genres');
      deferred.resolve();
    } else {
      getArtists().then(function() {
        getGenres();
        localStorage.setObject('_artists', _artists);
        localStorage.setObject('_genres', _genres);
        deferred.resolve();
      });
    }

    return deferred.promise();
  }

  /**
   *
   */
  function getMonths() {
    /**
     *
     *{
     *  "2013-01": [
     *    "TRACK_ID_1",
     *    "TRACK_ID_2",
     *    "TRACK_ID_3"
     *  ],
     *  "2013-02": [],
     *  "2013-03": [],
     *  "total": 0
     *}
     */
    var month = null;

    for (var trackId in _tracks) {
      if (trackId === 'total') { continue; }
      month = _tracks[trackId].added_at.substring(0, 7);

      if (month in _months) {
        _months[month].push(trackId);
      } else {
        _months[month] = [trackId];
        _months.total++;
      }
    }
  }

  /**
   *
   */
  function getArtists() {
    /**
     *
     *{
     *  "ARTIST_ID_1": {
     *    "genres": [
     *      "rock",
     *      "alternative rock",
     *      "classic rock"
     *    ],
     *    "total": 0
     *  },
     *  "ARTIST_ID_1": {},
     *  "ARTIST_ID_1": {},
     *  "total": 0
     *}
     */
    var promises = [],
        artists = {},
        artistId = null;

    for (var trackId in _tracks) {
      if (trackId === 'total') { continue; }

      for (var i = 0; i < _tracks[trackId].artists.length; i++) {
        artistId = _tracks[trackId].artists[i];

        if (artistId === null) { continue; }

        if (artistId in _artists) {
          _artists[artistId].total++;
        } else {
          _artists.total++;
          _artists[artistId] = {};
          _artists[artistId].total = 1;
          promises.push(_sp.getArtistById(artistId, function() {})
            .then(function(artist) {
              _artists[artist.id].genres = artist.genres;
            }));
        }
      }
    }

    return $.whenall(promises);
  }

  /**
   *
   */
  function getGenres() {
    /**
     *
     *{
     *  "album rock": {
     *    "artists": [
     *      "ARTIST_ID_1",
     *      "ARTIST_ID_2",
     *      "ARTIST_ID_3"
     *    ],
     *    "family": [
     *      "rock"
     *    ],
     *    "total": 3
     *  },
     *  "alternative dance": {},
     *  "alternative hip hop": {},
     *  "total": 100
     *}
     */
    var genre = null,
        genres = {};

    for (var artistId in _artists) {
      if (artistId === 'total') { continue; }

      for (var i = 0; i < _artists[artistId].genres.length; i++) {
        genre = _artists[artistId].genres[i];

        if (genre in _genres) {
          _genres[genre].total += _artists[artistId].total;
          _genres[genre].artists.push(artistId);
        } else {
          _genres.total++;
          _genres[genre] = {};
          _genres[genre].artists = [artistId];
          _genres[genre].total = _artists[artistId].total;
          _genres[genre].family = getGenreFamilyList(genre);
        }
      }
    }

    return genres;
  }


  function buildDataObject() {
    /**
     *{
     *  "months": {
     *    "2013-01": {
     *      "genres": {
     *        "rock": {
     *          "subgenres": {
     *            "classic rock": {
     *              "artists": [
     *                "ARTIST_ID_1",
     *                "ARTIST_ID_2",
     *                "ARTIST_ID_3"
     *              ],
     *              "total": 20 // total tracks in subgenre
     *            },
     *            "soft rock": {},
     *            "alternative rock": {}
     *          },
     *          "total": 75 // total tracks in genre
     *        },
     *        "pop": {},
     *        "ska": {}
     *      },
     *      "total": 200 // total tracks in month
     *    },
     *    "2013-02": {},
     *    "2013-03": {}
     *  },
     *  "total": 10000 // total tracks in collection
     *}
     */
    var genre = null,
        genres = null,
        subgenre = null,
        subgenres = null,
        trackIds = null;

    _data.total = _tracks.total;
    _data.months = {};

    for (var month in _months) {
      if (month === 'total') { continue; }

      trackIds = _months[month];
      _data.months[month] = {};
      _data.months[month].total = trackIds.length;
      _data.months[month].genres = {};

      for (var i = 0; i < trackIds.length; i++) {
        for (var j = 0; j < _tracks[trackIds[i]].artists.length; j++) {
          if (_artists[_tracks[trackIds[i]].artists[j]] === undefined) {
            continue;
          }

          for (var k = 0; k < _artists[_tracks[trackIds[i]].artists[j]].genres
            .length; k++) {
            for (var m = 0; m < _genres[_artists[_tracks[trackIds[i]]
              .artists[j]].genres[k]].family.length; m++) {

                genre = _genres[_artists[_tracks[trackIds[i]].artists[j]]
                  .genres[k]].family[m];
                subgenre = _artists[_tracks[trackIds[i]].artists[j]].genres[k];

                if (genre in _data.months[month].genres) {
                  genres = _data.months[month].genres;
                  subgenres = genres[genre].subgenres;

                  genres[genre].total++;

                  if (subgenre in subgenres) {
                    subgenres[subgenre].total++;

                    if (subgenres[subgenre].artists.indexOf(
                        _tracks[trackIds[i]].artists[j]) === -1) {
                        subgenres[subgenre].artists.push(
                          _tracks[trackIds[i]].artists[j]);
                      }
                  } else {
                    subgenres[subgenre] = {};
                    subgenres[subgenre].total = 1;
                    subgenres[subgenre].artists =
                      [_tracks[trackIds[i]].artists[j]];
                  }
                } else {
                  _data.months[month].genres[genre] = {};
                  _data.months[month].genres[genre].total = 1;

                  _data.months[month].genres[genre].subgenres = {};
                  _data.months[month].genres[genre].subgenres[subgenre] = {};
                  _data.months[month].genres[genre].subgenres[subgenre]
                    .total = 1;
                  _data.months[month].genres[genre].subgenres[subgenre]
                    .artists = [_tracks[trackIds[i]].artists[j]];
                }
              }
            }
        }
      }
    }
  }

  /**
   *
   */
  function getGenreFamilies() {
    /**
     *
     *{
     *  "indie pop": {
     *    "family":
     *  },
     *  "indietronica": {},
     *  "indie rock": {},
     *}
     */
    $.getJSON('/js/genre_families.json', function(genres) {
      for (var i = 0; i < genres.length; i++) {
        _genreFamilies[genres[i].name] = {};
        _genreFamilies[genres[i].name].family = genres[i].family;
        // _genreFamilies[genres[i].name].pop = genres[i].pop;
      }
    });
  }

  /**
   *
   */
  function getGenreFamilyList(genre) {
    if (_genreFamilies[genre]) {
      return _genreFamilies[genre].family;
    }
    return ['other'];
  }

  return _vizifyData;
}(jQuery));
