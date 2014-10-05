var vizifyData = (function($) {

  $.whenall = function(arr) { return $.when.apply($, arr); };

  function roughSizeOfObject( object ) {

      var objectList = [];
      var stack = [ object ];
      var bytes = 0;

      while ( stack.length ) {
          var value = stack.pop();

          if ( typeof value === 'boolean' ) {
              bytes += 4;
          }
          else if ( typeof value === 'string' ) {
              bytes += value.length * 2;
          }
          else if ( typeof value === 'number' ) {
              bytes += 8;
          }
          else if
          (
              typeof value === 'object'
              && objectList.indexOf( value ) === -1
          )
          {
              objectList.push( value );

              for( var i in value ) {
                  stack.push( value[ i ] );
              }
          }
      }
      return bytes;
  }

  Storage.prototype.setObject = function(key, value) {
    console.log(key, roughSizeOfObject(value) / 1000000);
    this.setItem(key, JSON.stringify(value));
  };

  Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
  };

  var _sp = new spotifyApi(),

      _data = { months: {}, total: 0 },
      _tracks = { total: 0 }, // (trackId, {track})
      _genres = { total: 0 }, // (subgenre, {family, artists})
      _months = { total: 0 }, // (month, [trackId])
      _genreFamilies = { total: 0 },
      _artists = { total: 0 };

  /**
   * Constructor
   */
  var _vizifyData = function() {
    getTracks().then(function(tracks) {
      getData().then(function() {
        console.log('_tracks', localStorage.getObject('_tracks'));
        console.log('_months', _months);
        console.log('_artists', _artists);
        console.log('_genres', _genres);
        getDataObject();
        console.log('_data', _data);
      });
    });
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
    }

    if (localStorage.getItem('_artists')) {
      _artists = localStorage.getObject('_artists');
      localStorage.setObject('_genres', _genres);
      deferred.resolve();
    } else {
      getArtists().then(function() {
        getGenres();
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
    var genre = null;

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
  }


  function getDataObject() {
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
    var subgenre = null,
        genreFamily = null,
        trackIds = null;
    // TODO: totals are all wrong
    _data.total = _tracks.total;
    _data.months = {};

    console.log('*');

    for (var month in _months) {
      trackIds = _months[month];
      _data.months[month] = {};
      _data.months[month].total = trackIds.length;
      _data.months[month].genres = {};
      for (var i = 0; i < trackIds.length; i++) {
        for (var j = 0; j < _tracks[trackIds[i]].artists.length; j++) {
          if (_artists[_tracks[trackIds[i]].artists[j]] === undefined) {
            console.log(trackIds[i]);
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
                  _data.months[month].genres[genre].total +=
                    _genres[_artists[_tracks[trackIds[i]].artists[j]]
                    .genres[k]].total;

                  if (subgenre in _data.months[month].genres[genre].subgenres) {
                    _data.months[month].genres[genre].subgenres[subgenre]
                      .total += _genres[_artists[_tracks[trackIds[i]]
                      .artists[j]].genres[k]].total;
                    _data.months[month].genres[genre].subgenres[subgenre]
                      .artists.push(_tracks[trackIds[i]].artists[j]);
                  } else {
                    _data.months[month].genres[genre].subgenres[subgenre] = {};
                    _data.months[month].genres[genre].subgenres[subgenre]
                      .total = _genres[_artists[_tracks[trackIds[i]].artists[j]]
                      .genres[k]].total;
                    _data.months[month].genres[genre].subgenres[subgenre]
                      .artists = [_tracks[trackIds[i]].artists[j]];
                  }
                } else {
                  _data.months[month].genres[genre] = {};
                  _data.months[month].genres[genre].total =
                    _genres[_artists[_tracks[trackIds[i]].artists[j]]
                    .genres[k]].total;
                  _data.months[month].genres[genre].subgenres = {};

                  _data.months[month].genres[genre].subgenres[subgenre] = {};
                  _data.months[month].genres[genre].subgenres[subgenre].total =
                    _genres[_artists[_tracks[trackIds[i]].artists[j]].genres[k]]
                    .total;
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
   * Sorting...
   *
   * Will sort user _artists by the number of tracks the user has for
   * that artist in their library.  the logic is that the user will have
   * the most tracks from their favorite artist, but it might be more
   * logical to do a percentage of the total tracks
   *
   * Source: http://stackoverflow.com/a/5200010/854645
   */
  function getSortedArtistIds() {
    return Object.keys(_artists).sort(function(a, b) {

      a = _artists[a].track_count;
      b = _artists[b].track_count;

      return a < b ? -1 : (a > b ? 1 : 0);
    });
  }

  /**
   *
   */
  function getGenreFamilies() {
    $.getJSON('/js/genre_families.json', function(genreFamilies) {
      for (var i = 0; i < genreFamilies.length; i++) {
        _genreFamilies[genreFamilies[i].name] = {};
        _genreFamilies[genreFamilies[i].name].family = genreFamilies[i].family;
        // _genreFamilies[genreFamilies[i].name].pop = genreFamilies[i].pop;
      }
    });
  }

  function getGenreFamilyList(genre) {
    if (_genreFamilies[genre]) {
      return _genreFamilies[genre].family;
    }
    // TODO: Add 'other' family to genre families to include those that are
    // unclassified
    return ['other'];
  }

  return _vizifyData;
}(jQuery));
