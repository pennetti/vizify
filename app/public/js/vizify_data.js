var vizifyData = (function($) {

  var _sp = new spotifyApi();

  var _artists = {},
      _tracks = {},
      allArtistGenres = {};

  var _vizifyData = function() {

  };

  $.whenall = function(arr) { return $.when.apply($, arr); };

  _vizifyData.prototype.getArtistGenreData = function() {

  };

  function getTracks() {
    _sp.getUserTracks(0, 50, function(tracks) {
      processTracks(tracks, 0);
    });
  }

  function processTracks(tracks, offset) {
    // TODO: collect popularity, count, genre, explicitness and duration

    if (tracks.offset == 0) {
      // No tracks!
    }

    // Update progress
    offset += tracks.items.length;
    document.getElementById('vizify').innerText =
      Math.round(offset / tracks.total * 100) + '%';

    for (var i = 0; i < tracks.items.length; i++) {
      // process track stuff
      while (artist = tracks.items[i].track.artists.pop()) {
        // process artist stuff
        if (artist.id in _artists) {
          _artists[artist.id].track_count++;
        } else {
          _artists[artist.id] = artist;
          _artists[artist.id].track_count = 1;
        }
      }
    }

    if (tracks.next) {
      _sp.getUserTracks(offset, 50, function(tracks) {
        processTracks(tracks, offset);
      });
    } else {
      // return data;
      getGenreData(_artists);
    }
  }

  /**
   * Sorting...
   *
   * Will sort user artists by the number of tracks the user has for
   * that artist in their library.  the logic is that the user will have
   * the most tracks from their favorite artist, but it might be more
   * logical to do a percentage of the total tracks
   *
   * Source: http://stackoverflow.com/a/5200010/854645
   */
  function getSortedArtistIds(artists) {
    return Object.keys(artists).sort(function(a, b) {
      a = artists[a].track_count
      b = artists[b].track_count

      return a < b ? -1 : (a > b ? 1 : 0);
    });
  }

  function getGenreData(artists) {
    // TODO: All tracks have been loaded, put in db and make viz
    // TODO: this function is broken

    var sortedArtistIds = getSortedArtistIds(artists),
        numArtists = Object.keys(artists).length * 0.5,
        artistGenres = [],
        promises = [];

    for (var i = 0; i < numArtists; i++) {
      promises.push(_sp.getArtistById(sortedArtistIds[i], function(artist) {
        artistGenres = artist.genres; // Does this need to be saved?
        // TODO: if artist has no genres, check the echo nest
        while (genre = artistGenres.pop()) {
          if (genre in allArtistGenres) {
            allArtistGenres[genre]++;
          } else {
            allArtistGenres[genre] = 1;
          }
        }
      }));
    }

    $.whenall(promises).done(function() {
      // TODO: move the vizify method, refactor
      console.log(allArtistGenres);
      // vizify(allArtistGenres)
      return allArtistGenres;
    });
  }

  return _vizifyData;
}(jQuery));


