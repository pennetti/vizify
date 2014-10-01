var vizifyData = (function($) {

  var _sp = new spotifyApi(),

      _data = {},
      _tracks = {},
      _genres = {},
      _genreFamilies = {},
      _artists = { _length: 0 },
      _sortedTracks = {};

  /**
   * Constructor
   */
  var _vizifyData = function() {
    getGenreFamilies();
    getUserLibrary().then(function() {
      getUserStarredPlaylist().then(function() {
        sortTracks();
      });
    });
  };

  $.whenall = function(arr) { return $.when.apply($, arr); };

  /**
   *
   */
  // _vizifyData.prototype.getArtistGenreData = function() {
  function getArtistGenreData() {

    var sortedArtistIds = getSortedArtistIds(),
        numArtists = getNumArtists(),
        promises = [];

    for (var i = 0; i < numArtists; i++) {
      // Ignore field if it starts with an underscore
      if (sortedArtistIds[i].lastIndexOf('_', 0) === 0) { continue; }

      promises.push(
        _sp.getArtistById(sortedArtistIds[i], function() {})
        .then(function(artist) {
          // TODO: if artist has no genres, check the echo nest
          // TODO: get genre data from the echo nest
          if (artist === undefined) {
            return;
          }

          if (artist.genres === undefined) {
            return;
          }

          while (genre = artist.genres.pop()) {

            // TODO: change model to:
            //
            if (genre in _genres) {
              _genres[genre].artist_count++;
              _genres[genre].track_count += _artists[artist.id].track_count;
              _genres[genre].artists.push(artist.name);
              // add artist ids, genre family, track count
            } else {
              _genres[genre] = {};
              _genres[genre].artist_count = 1;
              _genres[genre].track_count = _artists[artist.id].track_count;
              _genres[genre].artists = [artist.name]; // might change to ids
              _genres[genre].family = getGenreFamilyList(genre);
            }
          }
        })
      );
    }

    $.whenall(promises).done(function() {
      // done
    });
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
      _tracks[tracks.items[i].track.id] = tracks.items[i].track;
      _tracks[tracks.items[i].track.id].added_at = tracks.items[i].added_at;
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
        processUserStarredPlaylist(tracks, 0, deferred);
      });
    });

    return deferred;
  }

  /**
   *
   */
  function processUserStarredPlaylist(tracks, offset, userId, deferred) {
    // TODO: add timestamp comparison to take earliest added date
    // TODO: add deferred.notify() here

    offset += tracks.items.length;
    document.getElementById('vizify').innerText =
      Math.round(offset / tracks.total * 100) + '%';

    for (var i = 0; i < tracks.items.length; i++) {
      if (tracks.items[i].track.id in _tracks) {
        _tracks[tracks.items[i].track.id].added_at = tracks.items[i].added_at;
      } else {
        _tracks[tracks.items[i].track.id] = tracks.items[i].track;
        _tracks[tracks.items[i].track.id].added_at = tracks.items[i].added_at;
      }
    }

    if (tracks.next) {
      _sp.getUserStarredTracks(offset, 100, function(tracks) {
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
  function getNumArtists() {
    // Just for testing so the whole collection isn't pulled
    var maxNumArtists = 500;

    return _artists._length < maxNumArtists ? _artists._length : maxNumArtists;
  }

  function sortTracks() {
    buckets = {};

    for (var track in _tracks) {
      if (track) {
        var bucket = _tracks[track].added_at.substring(0, 7);
        if (bucket in buckets) {
          buckets[_tracks[track].added_at.substring(0, 7)]++;
        } else {
          buckets[_tracks[track].added_at.substring(0, 7)] = 1;
        }
      } else {
        console.log('******' + track);
      }
    }

    console.log(buckets);
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
    // Add 'other' family to genre families to include those that are
    // unclassified
    return;
  }

  return _vizifyData;
}(jQuery));
