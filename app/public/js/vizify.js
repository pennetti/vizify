var vizify = (function($) {

  var _vd = new vizifyData(),
      _canvas = document.getElementById('vizifyCanvas'),
      _ctx = _canvas.getContext('2d'),
      // TODO: need more colors, determine number of genres
      // TODO: make color less boring
      // http://stackoverflow.com/a/309193/854645
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

  /**
   *
   */
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

    // dynamic resizing
    _ctx.canvas.width = window.innerWidth;
    _ctx.canvas.height = window.innerHeight;

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

        vizWidth = _canvas.width,
        vizHeight = _canvas.height,

        originX = 0.0,
        originY = 0.0,
        currentMonthX = null,
        currentMonthY = null,
        currentGenreX = null,
        currentGenreY = null,

        cursorX = 0.0,
        cursorY = 0.0,
        lineWidth = 0.0,
        genreLineWidth = 0.0, //move this up
        topSeparatorWidth = 0.0,

        colorIndex = 0,
        genreMetaData = {}; // color, cursor, total

    dataTotal = data.total;
    dataMonths = data.months;
    sortedMonths = Object.keys(dataMonths).sort();

    lineWidth = (_ctx.canvas.width * 0.7) / dataTotal;
    topSeparatorWidth = (_ctx.canvas.width * 0.3) / (sortedMonths.length - 1);

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

    var cursor = 0;
    for (var i = 0; i < sortedGenres.length; i++) {
      genre = genreMetaData[sortedGenres[i]];
      genre.cursorX = cursor;
      cursor += genre.total * lineWidth;
      // cursor += 40; // save as constant space b/n months BTM_SEPARATOR
    }

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
        genreLineWidth = lineWidth * genreTotal;

        _ctx.beginPath();

        cursorX += genreLineWidth * 0.5;
        genreMetaData[genre].cursorX += genreLineWidth * 0.5;

        _ctx.moveTo(originX + cursorX, originY + cursorY);
        _ctx.lineTo(originX + cursorX, vizHeight / 4);
        // TODO: y coordinate based on line color
        _ctx.arcTo(
          originX + cursorX + ((genreMetaData[genre].cursorX - cursorX) / 4),
          vizHeight / 2,
          originX + cursorX + ((genreMetaData[genre].cursorX - cursorX) / 2),
          vizHeight / 2,
          vizHeight / 8);
        // _ctx.lineTo(
        //   originX + genreMetaData[genre].cursorX,
        //   vizHeight / 2);
        _ctx.arcTo(
          originX + cursorX +
            (3 * (genreMetaData[genre].cursorX - cursorX) / 4),
          vizHeight / 2,
          originX + genreMetaData[genre].cursorX,
          3 * vizHeight / 4,
          vizHeight / 8);
        _ctx.lineTo(originX + genreMetaData[genre].cursorX, vizHeight);

        _ctx.globalAlpha = 0.5;
        _ctx.lineWidth = genreLineWidth;
        // _ctx.lineJoin = 'round';
        _ctx.strokeStyle = genreMetaData[genre].color;
        _ctx.stroke();

        genreMetaData[genre].cursorX += genreLineWidth * 0.5;
        cursorX += genreLineWidth * 0.5;
        cursorY = 0;

        // for (var subgenre in genreSubgenres) {
        //   subgenreTotal = genreSubgenres[subgenre].total;
        //   subgenreArtists = genreSubgenres[subgenre].artists;
        // }
      }
      // console.log(genreMetaData);

      cursorX += topSeparatorWidth;  // TOP_SEPARATOR
    }
  }

  return _vizify;
}(jQuery));
