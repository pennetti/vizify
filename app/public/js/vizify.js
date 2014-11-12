var vizify = (function($) {

  // TODO: move to util module to keep DRY
  /**
   * Store a JSON object in local storage
   * @param {key} local storage object key
   * @param {value} JSON object
   */
  Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
  };

  /**
   * Retrieve a JSON object from local storage
   * @param {string} key of local storage object to return
   * @return {object} JSON object value stored at given key
   */
  Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
  };

  var _vd = new vizifyData(),
      _data = null,
      _canvas = document.getElementById('vizifyCanvas'),
      _ctx = _canvas.getContext('2d'),
      _colors = [ // http://flatuicolors.com/
        '#E74C3C', '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6',
        '#F1C40F', '#27AE60', '#2980B9', '#C0392B', '#16A085', '#8E44AD',
        '#34495E', '#D35400', '#95A5A6', '#F39C12'],
      _monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];

  /**
   * @constructor
   */
  var _vizify = function() {};

  /**
   *
   * @return {promise} resolved when visualization is drawn
   */
  _vizify.prototype.getVisualization = function() {

    var deferred = $.Deferred();

    if (localStorage.getItem('_data')) {
      _data = localStorage.getObject('_data');
      draw(_data);
      deferred.resolve();
    } else {
      _vd.getDataObject().then(function(data) {
        _data = data;
        localStorage.setObject('_data', _data);
        draw(_data);
        deferred.resolve();
      });
    }

    return deferred.promise();
  };

  /**
   *
   */
  _vizify.prototype.draw = function() {
    draw(_data);
  };

  /**
   * @param {object}
   */
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

        year = 0,
        month = null,
        sortedMonths = null,
        genre = null,
        sortedGenres = null,
        sortedMonthGenres = null,

        originX = 0,
        originY = _ctx.canvas.height / 10,
        vizWidth = _ctx.canvas.width - originX,
        vizHeight = _ctx.canvas.height - originY,

        i = 0,
        j = 0,

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
        // TODO: normalize font size
        fontSize = null,
        genreMetadata = {};

    dataTotal = data.total;
    dataMonths = data.months;
    sortedMonths = Object.keys(dataMonths).sort();

    // TODO: clean this up
    arcRadius = 0;
    lineWidth = vizWidth * 0.75 / (2 * dataTotal);
    topPaddingX = vizWidth * 0.3 / (sortedMonths.length - 1);
    topPaddingY = 2.5 * vizHeight / 10;
    btmPaddingX = vizWidth * 0.3 * 0.5;
    btmPaddingY = 7 * vizHeight / 10;

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
            order: colorIndex,
            color: _colors[colorIndex++],
            cursorX: 0,
            cursorY: 0
          };
        }
      }
    }

    // Sort by chronological order added to the collection
    // TODO: check if order is guaranteed for object keys
    sortedGenres = Object.keys(genreMetadata).sort(function(a, b) {
      return genreMetadata[a].order - genreMetadata[b].order;
    });

    for (i = 0, cursorY = topPaddingY + arcRadius; i < sortedGenres.length;
      i++) {
        genre = genreMetadata[sortedGenres[i]];
        genre.cursorY = cursorY;
        cursorY += genre.total * lineWidth *
          (2 * vizHeight / (5 * lineWidth * dataTotal * 2));
      }

    // Sort from largest to smallest genre total
    sortedGenres = Object.keys(genreMetadata).sort(function(a, b) {
      return -(genreMetadata[a].total - genreMetadata[b].total);
    });

    for (i = 0, cursorX = btmPaddingX; i < sortedGenres.length; i++) {
      genre = genreMetadata[sortedGenres[i]];
      genre.cursorX = cursorX;
      cursorX += genre.total * lineWidth;

      _ctx.save();
      _ctx.font = '10px Verdana';  // font should scale
      _ctx.fillStyle = '#2c3e50';
      _ctx.rotate(Math.PI / 2);
      _ctx.fillText(sortedGenres[i], vizHeight, -genre.cursorX);
      _ctx.restore();
    }

    for (i = 0, cursorX = 0, cursorY = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      monthTotal = dataMonths[month].total;
      monthGenres = dataMonths[month].genres;
      sortedMonthGenres = Object.keys(monthGenres).sort(function(a, b) {
        return -(monthGenres[a].total - monthGenres[b].total);
      });

      _ctx.save();
      _ctx.font = '10px Verdana';  // font should scale
      _ctx.fillStyle = '#2c3e50';
      if (parseInt(month.substring(0, 4), 10) > year) {
        year = parseInt(month.substring(0, 4), 10);
        _ctx.fillText(year, cursorX, 10);
      }
      _ctx.rotate(Math.PI / 2);
      _ctx.fillText('      ' +
        _monthNames[parseInt(month.substring(5, 7), 10) - 1].substring(0, 1),
        0, -cursorX);
      _ctx.restore();

      for (j = 0; j < sortedMonthGenres.length; j++) {
        genre = sortedMonthGenres[j];
        genreData = genreMetadata[genre];
        genreTotal = monthGenres[genre].total;
        genreLineWidth = lineWidth * genreTotal;
        genreSubgenres = monthGenres[genre].subgenres;

        cursorX += genreLineWidth * 0.5;
        genreData.cursorX += genreLineWidth * 0.5;
        genreData.cursorY += genreLineWidth * 0.1; // could be normalized

        _ctx.beginPath();
        _ctx.moveTo(originX + cursorX, originY + cursorY);

        _ctx.lineTo(originX + cursorX, topPaddingY);
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
          originY + btmPaddingY,
          arcRadius);
        _ctx.lineTo(originX + genreData.cursorX, 9 * vizHeight / 10);

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
