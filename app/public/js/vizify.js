var vizify = (function($) {

  var _vd = new vizifyData(),
      _canvas = document.getElementById('vizifyCanvas'),
      _ctx = _canvas.getContext('2d'),
      // 16 colors for 15 genre families and a misc. family
      // http://flatuicolors.com/
      // ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085',
      // '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22',
      // '#e74c3c', '#ecf0f1', '#95a5a6', '#f39c12', '#d35400', '#c0392b',
      // '#bdc3c7', '#7f8c8d']
      _colors = [
        '#E74C3C', '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6',
        '#F1C40F', '#27AE60', '#2980B9', '#C0392B', '#16A085', '#8E44AD',
        '#34495E', '#D35400', '#95A5A6', '#F39C12'];

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
        topPadding = 0.0,
        btmPadding = 0.0,

        colorIndex = 0,
        genreMetaData = {}; // color, cursor, total

    dataTotal = data.total;
    dataMonths = data.months;
    sortedMonths = Object.keys(dataMonths).sort();

    // TODO: why is canvas off by so much??
    lineWidth = (_ctx.canvas.width * 0.7) / (dataTotal * 2);
    topPadding = (_ctx.canvas.width * 0.3) / (sortedMonths.length - 1);
    btmPadding = (_ctx.canvas.width * 0.3) * 0.5;

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

    var cursor = btmPadding;
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
      console.log(sortedMonthGenres.length);
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

        _ctx.globalAlpha = 0.9;
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

      cursorX += topPadding;  // TOP_SEPARATOR
    }
  }

  return _vizify;
}(jQuery));
