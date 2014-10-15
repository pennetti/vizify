var vizify = (function($) {

  //@ http://jsfromhell.com/array/shuffle [v1.0]
  function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i),
      x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };

  var _vd = new vizifyData(),
      _canvas = document.getElementById('vizifyCanvas'),
      _context = _canvas.getContext('2d'),
      // TODO: need more colors, determine number of genres
      // TODO: make color less boring
      _colors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#000000', '#800000', '#008000', '#000080', '#808000', '#800080',
        '#008080', '#808080', '#C00000', '#00C000', '#0000C0', '#C0C000',
        '#C000C0', '#00C0C0', '#C0C0C0', '#400000', '#004000', '#000040',
        '#404000', '#400040', '#004040', '#404040', '#200000', '#002000',
        '#000020', '#202000', '#200020', '#002020', '#202020', '#600000',
        '#006000', '#000060', '#606000', '#600060', '#006060', '#606060',
        '#A00000', '#00A000', '#0000A0', '#A0A000', '#A000A0', '#00A0A0',
        '#A0A0A0', '#E00000', '#00E000', '#0000E0', '#E0E000', '#E000E0',
        '#00E0E0', '#E0E0E0'];

  // _colors = shuffle(_colors);

  var _vizify = function() {

  };


  _vizify.prototype.getVisualization = function() {

    var deferred = $.Deferred();

    _vd.getDataObject().then(function(data) {
      console.log(data);
      draw(data);
      deferred.resolve();
    });

    return deferred.promise();
  };

  function draw(data) {

    var dataTotal = null,
        dataMonths = null,
        monthTotal = null,
        monthGenres = null,
        genreTotal = null,
        genreSubgenres = null,
        subgenreTotal = null,
        subgenreArtists = null,

        month = null,
        sortedMonths = null,
        genre = null,
        sortedGenres = null,
        sortedMonthGenres = null,

        vizWidth = _canvas.width - 100,
        vizHeight = _canvas.height - 100,

        originX = 100,
        originY = 0,
        currentMonthX = null,
        currentMonthY = null,
        currentGenreX = null,
        currentGenreY = null,

        cursorX = 0,
        cursorY = 0,

        colorIndex = 0,
        genreMetaData = {}; // color, cursor, total

    dataTotal = data.total;
    dataMonths = data.months;
    sortedMonths = Object.keys(dataMonths).sort();

    for (var i = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      for (var genre in dataMonths[month].genres) {
        if (genre in genreMetaData) {
          genreMetaData[genre].total += dataMonths[month].genres[genre].total;
        } else {
          genreMetaData[genre] = {};
          genreMetaData[genre].total = dataMonths[month].genres[genre].total;
          genreMetaData[genre].color = _colors[colorIndex];
          genreMetaData[genre].cursorX = 0;
          genreMetaData[genre].cursorY = vizHeight;
          colorIndex++;
        }
      }
    }

    sortedGenres = Object.keys(genreMetaData).sort(function(a, b) {
      return -(genreMetaData[a].total - genreMetaData[b].total);
    });

    for (var i = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      monthTotal = dataMonths[month].total;
      monthGenres = dataMonths[month].genres;
      sortedMonthGenres = Object.keys(monthGenres).sort(function(a, b) {
        return -(monthGenres[a].total - monthGenres[b].total);
      });

      for (var j = 0; j < sortedMonthGenres.length; j++) {
        genre = sortedMonthGenres[j];
        genreTotal = monthGenres[genre].total;
        genreSubgenres = monthGenres[genre].subgenres;

        _context.beginPath();
        _context.moveTo(originX + cursorX, originY + cursorY);
        _context.lineTo(originX + cursorX, originY + cursorY + 100);
        // _context.quadraticCurveTo();
        // TODO: normalize data (gnereTotal)
        _context.lineWidth = genreTotal * 0.1;
        console.log(genre, genreMetaData[genre].color);
        _context.strokeStyle = genreMetaData[genre].color;
        _context.stroke();

        cursorX += _context.lineWidth * 0.5;
        cursorY = 0;

        // for (var subgenre in genreSubgenres) {
        //   subgenreTotal = genreSubgenres[subgenre].total;
        //   subgenreArtists = genreSubgenres[subgenre].artists;
        // }
      }
      // console.log(genreMetaData);

      cursorX += 80;
    }
  }

  return _vizify;
}(jQuery));
