var vizifyData = (function($) {

  $.whenall = function(arr) { return $.when.apply($, arr); };

  var _sp = new spotifyApi(),

      _data = { months:{}, total: 0 },
      _tracks = { total: 0 }, // (trackId, {track})
      _genres = { total: 0 }, // (subgenre, {family, artists})
      _months = { total: 0 }, // (month, [trackId])
      _genreFamilies = { total: 0 },
      _artists = { total: 0 };

  /**
   * Constructor
   */
  var _vizifyData = function() {
    getTracks().then(function() {
      getData().then(function() {
        console.log('_tracks', _tracks);
        console.log('_months', _months);
        console.log('_artists', _artists);
        console.log('_genres', _genres);
      });
    });
  };

  /**
   *
   */
  function getTracks() {

    var deferred = $.Deferred();

    getUserLibrary().then(function() {
      getUserStarredPlaylist().then(function() {
        deferred.resolve();
      });
    });

    return deferred;
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
      _tracks.total++;
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
        processUserStarredPlaylist(tracks, 0, user.id, deferred);
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
        _tracks.total++;
        _tracks[tracks.items[i].track.id] = tracks.items[i].track;
        _tracks[tracks.items[i].track.id].added_at = tracks.items[i].added_at;
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
    getMonths();
    getArtists().then(function() {
      getGenres();
      deferred.resolve();
    });

    return deferred;
  }

  /**
   *
   */
  function getMonths() {

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

    var track = null,
        promises = [];

    for (var trackId in _tracks) {

      if (trackId === 'total') { continue; }

      track = _tracks[trackId];

      for (var i = 0; i < track.artists.length; i++) {

        // if (track.artists[i].id in _artists) {
        //   _artists[track.artists[i].id].total++;
        // } else {
          promises.push(
            _sp.getArtistById(track.artists[i].id, function() {})
              .then(function(artist) {
                if (artist.id in _artists) {
                  _artists[artist.id].total++;
                } else {
                  _artists[artist.id] = artist;
                  _artists[artist.id].total = 1;
                  _artists.total++;
                }
              }));
        // }
      }
    }

    return $.whenall(promises);
  }

  /**
   *
   */
  function getGenres() {

    var genre = null,
        artist = null;

    for (var artistId in _artists) {

      if (artistId === 'total') { continue; }

      artist = _artists[artistId];

      for (var i = 0; i < artist.genres.length; i++) {

        genre = artist.genres[i];

        if (genre in _genres) {
          _genres[genre].total += artist.total;
          _genres[genre].artists.push(artist.id);
          // add artist ids, genre family, track count
        } else {
          _genres[genre] = {};
          _genres[genre].total = artist.total;
          _genres[genre].artists = [artist.id];
          _genres[genre].family = getGenreFamilyList(genre);
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
    return;
  }

  return _vizifyData;
}(jQuery));
