var vizify = (function($) {

  var _vd = new vizifyData()
      _canvas = document.getElementById('vizifyCanvas'),
      _context = _canvas.getContext('2d');
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

        originX = 0,
        originY = 0,
        currentMonthX = null,
        currentMonthY = null,
        currentGenreX = null,
        currentGenreY = null,

        cursorX = 0,
        cursorY = 0,

        colorIndex = 0,
        genreColors = {};

    dataTotal = data.total;
    dataMonths = data.months;

    for (var month in dataMonths) {
      monthTotal = dataMonths[month].total;
      monthGenres = dataMonths[month].genres

      for (var genre in monthGenres) {
        genreTotal = monthGenres[genre].total;
        genreSubgenres = monthGenres[genre].subgenres;

        _context.beginPath();
        _context.moveTo(originX + cursorX, originY + cursorY);
        _context.lineTo(originX + cursorX, originY + cursorY + 100);
        _context.lineWidth = genreTotal * 0.1;
        if (!(genre in genreColors)) {
          genreColors[genre] = _colors[colorIndex];
          colorIndex++;
        }
        _context.strokeStyle = genreColors[genre]
        _context.stroke();

        cursorX += genreTotal * 0.1 * 0.5 + 5;
        cursorY = 0;

        // for (var subgenre in genreSubgenres) {
        //   subgenreTotal = genreSubgenres[subgenre].total;
        //   subgenreArtists = genreSubgenres[subgenre].artists;
        // }
      }

      cursorX += 20;
    }
  }

  return _vizify;
}(jQuery));
