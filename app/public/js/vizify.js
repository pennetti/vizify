var vizify = (function($) {

  var _vd = new vizifyData(),
      _canvas = document.getElementById('vizifyCanvas'),
      _ctx = _canvas.getContext('2d'),
      _colors = [ // http://flatuicolors.com/
        '#E74C3C', '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6',
        '#F1C40F', '#27AE60', '#2980B9', '#C0392B', '#16A085', '#8E44AD',
        '#34495E', '#D35400', '#95A5A6', '#F39C12'];

  /**
   * Constructor
   */
  var _vizify = function() {};

  /**
   * @return {promise} resolved when visualization is drawn
   */
  _vizify.prototype.getVisualization = function() {
  // TODO: don't need to get data object every time screen is redrawn

    var deferred = $.Deferred();

    _vd.getDataObject().then(function(data) {
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

        // vizWidth = _canvas.width,
        // vizHeight = _canvas.height,
        i = 0,

        originX = 0,
        originY = 0,
        currentMonthX = null,
        currentMonthY = null,
        currentGenreX = null,
        currentGenreY = null,

        cursorX = 0,
        cursorY = 0,
        lineWidth = 0,
        arcRadius = 0,
        genreLineWidth = 0,
        topPaddingX = 0,
        topPaddingY = 0,
        btmPaddingX = 0,
        btmPaddingY = 0,

        colorIndex = 0,
        genreMetadata = {};

    dataTotal = data.total;
    dataMonths = data.months;
    sortedMonths = Object.keys(dataMonths).sort();

    arcRadius = 0;
    lineWidth = (_ctx.canvas.width * 0.75) / (2 * dataTotal);
    topPaddingX = (_ctx.canvas.width * 0.3) / (sortedMonths.length - 1);
    topPaddingY = _ctx.canvas.height / 8;
    btmPaddingX = (_ctx.canvas.width * 0.3) * 0.5;
    btmPaddingY = (7 * _ctx.canvas.height) / 8;

    // Get genre metadata
    for (i = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      for (var monthGenre in dataMonths[month].genres) {
        if (monthGenre in genreMetadata) {
          genreMetadata[monthGenre].total +=
            dataMonths[month].genres[monthGenre].total;
        } else {
          genreMetadata[monthGenre] = {
            total: dataMonths[month].genres[monthGenre].total,
            color: _colors[colorIndex],
            order: colorIndex,  // make new variable?
            cursorX: 0,
            cursorY: 0
          };
          colorIndex++;
        }
      }
    }

    // Sort by chronological order added to the collection
    // TODO: check if order is guaranteed for object keys
    sortedGenres = Object.keys(genreMetadata).sort(function(a, b) {
      return genreMetadata[a].order - genreMetadata[b].order;
    });

    for (i = 0, cursorY = topPaddingY + arcRadius; i < sortedGenres.length; i++) {
      genre = genreMetadata[sortedGenres[i]];
      genre.cursorY = cursorY;
      cursorY += genre.total * lineWidth *
        (3 * _ctx.canvas.height / (4 * lineWidth * dataTotal * 2));
    }

    // Sort from largest to smallest genre total
    sortedGenres = Object.keys(genreMetadata).sort(function(a, b) {
      return -(genreMetadata[a].total - genreMetadata[b].total);
    });

    for (i = 0, cursorX = btmPaddingX; i < sortedGenres.length; i++) {
      genre = genreMetadata[sortedGenres[i]];
      genre.cursorX = cursorX;
      cursorX += genre.total * lineWidth;
    }

    for (i = 0, cursorX = 0, cursorY = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      monthTotal = dataMonths[month].total;
      monthGenres = dataMonths[month].genres;
      sortedMonthGenres = Object.keys(monthGenres).sort(function(a, b) {
        return -(monthGenres[a].total - monthGenres[b].total);
      });

      // _ctx.font = '10px Verdana';
      // _ctx.fillStyle = '#2c3e50';
      // console.log(month, cursorX, cursorY+50);
      // _ctx.fillText(month, cursorX, cursorY+10);

      for (var j = 0; j < sortedMonthGenres.length; j++) {
        genre = sortedMonthGenres[j];
        genreData = genreMetadata[genre];
        genreTotal = monthGenres[genre].total;
        genreLineWidth = lineWidth * genreTotal;
        genreSubgenres = monthGenres[genre].subgenres;

        _ctx.beginPath();

        cursorX += genreLineWidth * 0.5;
        genreData.cursorX += genreLineWidth * 0.5;
        genreData.cursorY += genreLineWidth * 0.1;

        _ctx.moveTo(originX + cursorX, originY + cursorY);

        _ctx.lineTo(originX + cursorX, topPaddingY);
        _ctx.lineTo(originX + cursorX, genreData.cursorY - arcRadius);
        _ctx.arcTo(
          originX + cursorX + ((genreData.cursorX - cursorX) / 4),
          originY + genreData.cursorY,
          originX + cursorX + ((genreData.cursorX - cursorX) / 2),
          originY + genreData.cursorY,
          arcRadius);
        _ctx.lineTo(
          originX + genreData.cursorX,
          originY + genreData.cursorY);
        _ctx.arcTo(
          originX + genreData.cursorX,
          originY + genreData.cursorY,
          originX + genreData.cursorX,
          originY + genreData.cursorY + arcRadius,
          arcRadius);
        _ctx.lineTo(originX + genreData.cursorX, _ctx.canvas.height);

        _ctx.globalAlpha = 0.9;
        _ctx.lineWidth = genreLineWidth;
        _ctx.strokeStyle = genreData.color;
        _ctx.stroke();

        genreData.cursorX += genreLineWidth * 0.5;
        genreData.cursorY += genreLineWidth * 0.5;
        cursorX += genreLineWidth * 0.5;

        // for (var subgenre in genreSubgenres) {
        //   subgenreTotal = genreSubgenres[subgenre].total;
        //   subgenreArtists = genreSubgenres[subgenre].artists;
        // }
      }

      cursorX += topPaddingX;
    }
  }

  return _vizify;
}(jQuery));
