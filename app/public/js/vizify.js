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

    // TODO: why is canvas off by so much??
    // console.log(_ctx.canvas.width, dataTotal);
    arcRadius = 0; // normalize?
    lineWidth = (_ctx.canvas.width * 0.7) / (dataTotal * 2);
    topPaddingX = (_ctx.canvas.width * 0.3) / (sortedMonths.length - 1);
    topPaddingY = _ctx.canvas.height / 8;
    btmPaddingX = (_ctx.canvas.width * 0.3) * 0.5;
    btmPaddingY = (7 * _ctx.canvas.height) / 8;

    // Get genre metadata
    for (var i = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      for (var genre in dataMonths[month].genres) {
        if (genre in genreMetadata) {
          genreMetadata[genre].total += dataMonths[month].genres[genre].total;
        } else {
          genreMetadata[genre] = {};
          genreMetadata[genre].total = dataMonths[month].genres[genre].total;
          genreMetadata[genre].color = _colors[colorIndex];
          genreMetadata[genre].order = colorIndex;  // make new variable?
          genreMetadata[genre].cursorX = 0;
          genreMetadata[genre].cursorY = 0;
          colorIndex++;
        }
      }
    }

    // Sort by chronological order added to the collection
    // TODO: check if order is guaranteed for object keys
    sortedGenres = Object.keys(genreMetadata).sort(function(a, b) {
      return genreMetadata[a].order - genreMetadata[b].order;
    });


    // Sort from largest to smallest
    sortedGenres = Object.keys(genreMetadata).sort(function(a, b) {
      return -(genreMetadata[a].total - genreMetadata[b].total);
    });
    for (var i = 0, cursorY = topPaddingY + arcRadius; i < sortedGenres.length; i++) {
      genre = genreMetadata[sortedGenres[i]];
      genre.cursorY = cursorY;
      // TODO: normalize this to the viz height
      cursorY += genre.total * lineWidth * 0.5;
    }

    for (var i = 0, cursorX = btmPaddingX; i < sortedGenres.length; i++) {
      genre = genreMetadata[sortedGenres[i]];
      genre.cursorX = cursorX;
      cursorX += genre.total * lineWidth;
    }

    for (var i = 0, cursorX = 0, cursorY = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      monthTotal = dataMonths[month].total;
      monthGenres = dataMonths[month].genres;
      sortedMonthGenres = Object.keys(monthGenres).sort(function(a, b) {
        return -(monthGenres[a].total - monthGenres[b].total);
      });

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
        // console.log(cursorX, genreData.cursorX);
        _ctx.lineTo(
          originX + genreData.cursorX,
          originY + genreData.cursorY);
        _ctx.arcTo(
          originX + genreData.cursorX,
          originY + genreData.cursorY,
          originX + genreData.cursorX,
          originY + genreData.cursorY + arcRadius,
          arcRadius);
        _ctx.lineTo(originX + genreData.cursorX, vizHeight);

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
