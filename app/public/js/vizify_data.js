var VizifyData = (function($) {

  // TODO: make this functional
  // TODO: track artists with unclassified genres
  // TODO: add data object for cumulative data
  // TODO: move large api calls to 'spotify.js'
  var vizifyData = {};

  var _months = Object.create(null),   // months -> tracks
      _tracks = Object.create(null),   // tracks -> artists
      _artists = Object.create(null),  // artists -> subgenres
      _subgenres = Object.create(null),   // subgenres -> genres
      _genreFamilies = Object.create(null);

  Object.defineProperty(_tracks, 'total', {
    value: 0, writable: true, enumerable: false
  });

  /**
   * Get all tracks and structure data object for visualization
   * @return {Promise} resolved when data object is returned
   */
  vizifyData.getTrackDataObject = function() {

    if (localStorage.getItem('trackData')) {
      return $.Deferred().promise(localStorage.getObject('trackData'));
    }

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

    getUserLibrary().then(function() {
      getUserStarredPlaylist().then(function() {
        deferred.resolve();
      })
      .progress(function(percentComplete) {
        progressBar('userStarredPlaylistProgressBar', percentComplete);
      });
    })
    .progress(function(percentComplete) {
      progressBar('userLibraryProgressBar', percentComplete);
    });

    return deferred.promise();
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
   *
   */
  function getTrackData() {

    var deferred = $.Deferred();

    getGenreFamilies();
    getTracksByMonth();
    getArtists().then(function() {
      getArtistSubgenres();
      deferred.resolve();
    })
    .progress(function(percentComplete) {
      progressBar('genreDataProgressBar', percentComplete);
    });

    return deferred.promise();
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
  function getTracksByMonth() {

    var month = null;

    for (var trackId in _tracks) {
      month = _tracks[trackId].added_at.substring(0, 7);

      if (_months[month]) {
        _months[month].push(trackId);
      } else {
        _months[month] = [trackId];
      }
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

    var promises = [],
        artistIds = [],
        artistId = null,
        deferred = $.Deferred();

    for (var trackId in _tracks) {

      for (var i = 0; i < _tracks[trackId].artists.length; i++) {
        artistId = _tracks[trackId].artists[i];

        if (!(artistId in _artists)) {
          artistIds.push(artistId);
        }
      }
    }

    for (var j = 0, max = 50; j < artistIds.length; j += max) {
      promises.push(SpotifyApi.getArtistsByIds(
        artistIds.slice(j, j + max).join(','), function(response) {
          processArtists(response.artists);
          deferred.notify(Math.round(j / artistIds.length * 100));
        }));
    }

    $.whenall(promises).done(function() {
      deferred.resolve();
    });

    return deferred.promise();
  }

  function processArtists(artists) {
    for (var i = 0, artist = null; i < artists.length; i++) {
      artist = artists[i];

      _artists[artist.id] = artist.genres;
    }
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
  function getArtistSubgenres() {
    for (var artistId in _artists) {

      for (var i = 0, subgenre = null; i < _artists[artistId].length; i++) {
        subgenre = _artists[artistId][i];

        if (subgenre in _subgenres) {
          _subgenres[subgenre].push(artistId);
        } else {
          _subgenres[subgenre] = [artistId];
        }
      }
    }
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
  function buildTrackDataObject() {

    if (localStorage.getItem('trackData')) {
      return localStorage.getObject('trackData');
    }

    var genre = null,
        genres = null,
        subgenre = null,
        subgenres = null,
        tracks = null,
        artist = null,
        artists = null,
        monthGenres = null,
        genreSubgenres = null,
        trackData = Object.create(null);

    trackData.total = _tracks.total;
    trackData.months = Object.create(null);

    for (var month in _months) {
      tracks = _months[month];

      trackData.months[month] = Object.create(null);
      trackData.months[month].total = tracks.length;
      trackData.months[month].genres = Object.create(null);

      for (var i = 0; i < tracks.length; i++) {
        artists = _tracks[tracks[i]].artists;

        for (var j = 0; j < artists.length; j++) {
          subgenres = _artists[artists[j]];

          for (var k = 0; k < subgenres.length; k++) {
            genres = getSubgenreFamilies(subgenres[k]);

            for (var m = 0; m < genres.length; m++) {
              genre = genres[m];
              subgenre = subgenres[k];

              if (genre in trackData.months[month].genres) {
                monthGenres = trackData.months[month].genres;
                genreSubgenres = monthGenres[genre].subgenres;

                monthGenres[genre].total++;

                if (subgenre in genreSubgenres) {
                  genreSubgenres[subgenre].total++;

                  if (genreSubgenres[subgenre].artists.indexOf(artists[j]) === -1) {
                    genreSubgenres[subgenre].artists.push(artists[j]);
                  }
                } else {
                  genreSubgenres[subgenre] = Object.create(null);
                  genreSubgenres[subgenre].total = 1;
                  genreSubgenres[subgenre].artists = [artists[j]];
                }
              } else {
                trackData.months[month].genres[genre] = Object.create(null);
                trackData.months[month].genres[genre].total = 1;
                trackData.months[month].genres[genre].subgenres = Object.create(null);
                trackData.months[month].genres[genre].subgenres[subgenre] = Object.create(null);
                trackData.months[month].genres[genre].subgenres[subgenre].total = 1;
                trackData.months[month].genres[genre].subgenres[subgenre].artists = [artists[j]];
              }
            }
          }
        }
      }
    }

    localStorage.setObject('trackData', trackData);
    return trackData;
  }

  /**
   * Returns the family genre of a given subgenre
   * @param {string} subgenre for which to retrieve genre family
   * @return {array} array of genre families
   */
  function getSubgenreFamilies(genre) {
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
