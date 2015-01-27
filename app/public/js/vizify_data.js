var VizifyData = (function($) {

  // TODO: make this functional
  // TODO: track artists with unclassified genres
  // TODO: add data object for cumulative data
  // TODO: move large api calls to 'spotify.js'
  var vizifyData = {};

  var _months = Object.create(null),
      _tracks = Object.create(null),   // track -> artist
      _artists = Object.create(null),  // artist -> subgenre
      _genres = Object.create(null),   // subgenre -> genre
      _genreFamilies = Object.create(null),
      _trackData = Object.create(null);

  Object.defineProperty(_tracks, 'total', {
    value: 0, writable: true, enumerable: false
  });
  Object.defineProperty(_months, 'total', {
    value: 0, writable: true, enumerable: false
  });
  Object.defineProperty(_artists, 'total', {
    value: 0, writable: true, enumerable: false
  });
  Object.defineProperty(_genres, 'total', {
    value: 0, writable: true, enumerable: false
  });
  Object.defineProperty(_trackData, 'total', {
    value: 0, writable: true, enumerable: false
  });

  /**
   * Get all tracks and structure data object for visualization
   * @return {Promise} resolved when data object is returned
   */
  vizifyData.getTrackDataObject = function() {
    return getTracks().then(function() {
      return getTrackData().then(function() {
        return buildTrackDataObject();
      });
    });
  };

  /**
   * @return {promise}
   */
  function getTracks() {

    var deferred = $.Deferred();

    if (localStorage.getItem('_tracks')) {
      _tracks = localStorage.getObject('_tracks');
      progressBar('userStarredPlaylistProgressBar', 100);
      progressBar('userLibraryProgressBar', 100);
      deferred.resolve(_tracks);
    } else {
      getUserLibrary().then(function() {
        getUserStarredPlaylist().then(function() {
          localStorage.setObject('_tracks', _tracks);
          deferred.resolve(_tracks);
        }).progress(function(percentComplete) {
          progressBar('userStarredPlaylistProgressBar', percentComplete);
        });
      }).progress(function(percentComplete) {
        progressBar('userLibraryProgressBar', percentComplete);
      });
    }

    return deferred.promise();
  }

  function processTracks(tracks) {
    for (var i = 0, track = null; i < tracks.items.length; i++) {
      track = tracks.items[i].track;

      if (track.id in _tracks) {
        _tracks[track.id].added_at =
          minDate(_tracks[track.id].added_at, tracks.items[i].added_at);
      } else {
        _tracks.total += 1;
        _tracks[track.id] = {
          artists: [],
          added_at: tracks.items[i].added_at
        };

        for (var j = 0; j < track.artists.length; j++) {
          if (track.artists[j].id) {  // fix error where artist ID is 'null'
            _tracks[track.id].artists.push(track.artists[j].id);
          }
        }
      }
    }
  }

  function minDate(a, b) {
    a = new Date(a).getTime();
    b = new Date(b).getTime();

    return new Date(Math.min(a, b)).toISOString();
  }

  /**
   * @return {promise}
   */
  function getUserLibrary() {

    var deferred = $.Deferred();

    SpotifyApi.getUserTracks(0, function(tracks) {
      processUserLibrary(tracks, 0, deferred);
    });

    return deferred.promise();
  }

  /**
   * @param {object}
   * @param {number}
   * @param {deferred}
   */
  function processUserLibrary(tracks, offset, deferred) {
    offset += tracks.items.length;
    deferred.notify(Math.round(offset / tracks.total * 100));

    processTracks(tracks);

    if (tracks.next) {
      SpotifyApi.getUserTracks(offset, function(tracks) {
        processUserLibrary(tracks, offset, deferred);
      });
    } else {
      deferred.resolve();
    }
  }

  /**
   *
   */
  function getUserStarredPlaylist() {

    var deferred = $.Deferred();

    SpotifyApi.getUserProfile(function(user) {
      SpotifyApi.getUserStarredTracks(0, user.id, function(tracks) {
        processUserStarredPlaylist(tracks, 0, user.id, deferred);
      });
    });

    return deferred.promise();
  }

  /**
   * @param {object}
   * @param {number}
   * @param {string}
   * @param {promise}
   * @return {promise}
   */
  function processUserStarredPlaylist(tracks, offset, userId, deferred) {
    offset += tracks.items.length;
    deferred.notify(Math.round(offset / tracks.total * 100));

    processTracks(tracks);

    if (tracks.next) {
      SpotifyApi.getUserStarredTracks(offset, userId, function(tracks) {
        processUserStarredPlaylist(tracks, offset, userId, deferred);
      });
    } else {
      deferred.resolve();
    }
  }

  /**
   *
   */
  function getTrackData() {

    var deferred = $.Deferred();

    getGenreFamilies();

    // if (localStorage.getItem('_months')) {
    //   _months = localStorage.getObject('_months');
    // } else {
      getMonths();
    //   localStorage.setObject('_months', _months);
    // }

    // if (localStorage.getItem('_artists')) {
    //   _artists = localStorage.getObject('_artists');
    //   progressBar('genreDataProgressBar', 100);
    //   if (localStorage.getItem('_genres')) {
    //     _genres = localStorage.getObject('_genres');
    //   } else {
        // getGenres();
        // localStorage.setObject('_genres', _genres);
      // }
      // deferred.resolve();
    // } else {
      getArtists().then(function() {
        getGenres();
        // localStorage.setObject('_genres', _genres);
        // localStorage.setObject('_artists', _artists);
        deferred.resolve();
      }).progress(function(percentComplete) {
        progressBar('genreDataProgressBar', percentComplete);
      });
    // }

    return deferred.promise();
  }

  /**
   * @example
   * {
   *   "2013-01": [
   *     "TRACK_ID_1",
   *     "TRACK_ID_2",
   *     "TRACK_ID_3"
   *   ],
   *   "2013-02": [],
   *   "2013-03": [],
   *   "total": 0
   * }
   *
   */
  function getMonths() {

    var month = null;

    for (var trackId in _tracks) {
      month = _tracks[trackId].added_at.substring(0, 7);

      if (_months[month]) {
        _months[month].push(trackId);
      } else {
        _months[month] = [trackId];
        _months.total++;
      }
    }
  }

  function processArtists(artists) {
    for (var i = 0, artist = null; i < artists.length; i++) {
      artist = artists[i];
      if (!_artists[artist.id]) {
        _artists[artist.id] = { total: 1 };
      }
      _artists[artist.id].genres = artist.genres;
    }
  }

  /**
   *
   * @example
   * {
   *   "ARTIST_ID_1": {
   *     "genres": [
   *       "rock",
   *       "alternative rock",
   *       "classic rock"
   *     ],
   *     "total": 0
   *   },
   *   "ARTIST_ID_1": {},
   *   "ARTIST_ID_1": {},
   *   "total": 0
   * }
   */
  function getArtists() {

    var artists = {},
        // progress = 0,
        promises = [],
        artistIds = [],
        artistId = null,
        MAX_ARTISTS = 50,
        // progressTotal = 0,
        deferred = $.Deferred();

    for (var trackId in _tracks) {

      for (var i = 0; i < _tracks[trackId].artists.length; i++) {
        // progressTotal++;
        artistId = _tracks[trackId].artists[i];

        if (artistId in _artists) {
          // progress++;
          _artists[artistId].total++;
        } else {
          _artists.total++;
          _artists[artistId] = { total: 1 };

          artistIds.push(artistId);
        }
      }
    }

    for (i = 0; i < artistIds.length; i += MAX_ARTISTS) {
      promises.push(SpotifyApi.getArtistsByIds(
        artistIds.slice(i, i + MAX_ARTISTS).join(','), function(response) {
          processArtists(response.artists);
        }));
    }

    $.whenall(promises).done(function() {
      deferred.resolve();
    });

    return deferred.promise();
  }

  /**
   *
   * @example
   * {
   *   "album rock": {
   *     "artists": [
   *       "ARTIST_ID_1",
   *       "ARTIST_ID_2",
   *       "ARTIST_ID_3"
   *     ],
   *     "family": [
   *       "rock"
   *     ],
   *     "total": 3
   *   },
   *   "alternative dance": {},
   *   "alternative hip hop": {},
   *   "total": 100
   * }
   */
  function getGenres() {

    var genre = null,
        genres = {};

    getGenreFamilies();

    for (var artistId in _artists) {

      for (var i = 0; i < _artists[artistId].genres.length; i++) {
        genre = _artists[artistId].genres[i];

        if (genre in _genres) {
          _genres[genre].total += _artists[artistId].total;
          _genres[genre].artists.push(artistId);
        } else {
          _genres.total++;
          _genres[genre] = {
            artists: [artistId],
            total: _artists[artistId].total,
            family: getGenreFamilyList(genre)
          };
        }
      }
    }

    return genres;
  }

  /**
   * @param {deferred}
   * @example
   * {
   *   "months": {
   *     "2013-01": {
   *       "genres": {
   *         "rock": {
   *           "subgenres": {
   *             "classic rock": {
   *               "artists": [
   *                 "ARTIST_ID_1",
   *                 "ARTIST_ID_2",
   *                 "ARTIST_ID_3"
   *               ],
   *               "total": 20 // total tracks in subgenre
   *             },
   *             "soft rock": {},
   *             "alternative rock": {}
   *           },
   *           "total": 75 // total tracks in genre
   *         },
   *         "pop": {},
   *         "ska": {}
   *       },
   *       "total": 200 // total tracks in month
   *     },
   *     "2013-02": {},
   *     "2013-03": {}
   *   },
   *   "total": 10000 // total tracks in collection
   * }
   */
  function buildTrackDataObject(deferred) {
    // TODO: clean up, use object notation rather than dot
    var genre = null,
        genres = null,
        subgenre = null,
        subgenres = null,
        trackIds = null,
        artist = null,
        artists = null,
        progress = 0;

    _trackData.total = _tracks.total;
    _trackData.months = {};

    for (var month in _months) {

      trackIds = _months[month];
      progress += trackIds.length;
      // deferred.notify(Math.round(progress / _trackData.total * 100));

      _trackData.months[month] = {
        total: trackIds.length,
        genres: {}
      };

      for (var i = 0; i < trackIds.length; i++) {
        artists = _tracks[trackIds[i]].artists;

        for (var j = 0; j < artists.length; j++) {

          artist = _artists[artists[j]];

          for (var k = 0; k < artist.genres.length; k++) {
            for (var m = 0; m < _genres[_artists[_tracks[trackIds[i]]
              .artists[j]].genres[k]].family.length; m++) {
                genre = _genres[artist.genres[k]].family[m];
                subgenre = artist.genres[k];

                if (genre in _trackData.months[month].genres) {
                  genres = _trackData.months[month].genres;
                  subgenres = genres[genre].subgenres;

                  genres[genre].total++;

                  if (subgenre in subgenres) {
                    subgenres[subgenre].total++;

                    if (subgenres[subgenre].artists
                      .indexOf(artists[j]) === -1) {
                        subgenres[subgenre].artists.push(artists[j]);
                      }
                  } else {
                    subgenres[subgenre] = {
                      total: 1,
                      artists: [artists[j]]
                    };
                  }
                } else {
                  _trackData.months[month].genres[genre] = { total: 1 };
                  _trackData.months[month].genres[genre].subgenres = {
                    subgenre: {
                      total: 1,
                      artists: [artists[j]]
                    }
                  };
                }
              }
            }
        }
      }
    }
    console.log('data: ', _trackData);
  }

  /**
   *
   * @example
   * {
   *   "indie pop": {
   *     "family": "pop"
   *   },
   *   "indietronica": {},
   *   "indie rock": {},
   * }
   */
  function getGenreFamilies() {
    $.getJSON('/js/genre_families.json', function(genres) {
      for (var i = 0; i < genres.length; i++) {
        _genreFamilies[genres[i].name] = {
          family: genres[i].family
          // pop: genres[i].pop   // popularity
        };
      }
    });
  }

  /**
   * Returns the family genre of a given subgenre
   * @param {string} subgenre for which to retrieve genre family
   * @return {array} array of genre families
   */
  function getGenreFamilyList(genre) {
    if (_genreFamilies[genre]) {
      return _genreFamilies[genre].family;
    }
    return ['other'];
  }

  /**
   * @param {string} id of progress bar
   * @param {number} percentage of progress completed
   */
  function progressBar(progressBarId, percentComplete) {
    $('#' + progressBarId)
      .css('width', percentComplete + '%')
      .attr('aria-valuenow', percentComplete);
      // .text(percentComplete + '%');
  }

  return vizifyData;
}(jQuery));
