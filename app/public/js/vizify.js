var Vizify = (function($, svg) {

  // TODO: move to util module to keep DRY
  // TODO: bug where paths stop being drawn on mouseover
  // TODO: 429 errors
  //
  var vizify = {};

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

  var svgCanvas = svg.select('#vizifySvg')
    .append('svg:svg')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight);

  var _vd = VizifyData,
      _data = null,
      _colors = [ // http://flatuicolors.com/
        '#E74C3C', '#2ECC71', '#3498DB', '#E67E22', '#1ABC9C', '#9B59B6',
        '#F1C40F', '#27AE60', '#2980B9', '#C0392B', '#16A085', '#8E44AD',
        '#34495E', '#D35400', '#95A5A6', '#F39C12'],
      _monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];

  /**
   *
   * @return {promise} resolved when visualization is drawn
   */
  vizify.getVisualization = function() {

    var deferred = $.Deferred();

    if (localStorage.getItem('_data')) {
      _data = localStorage.getObject('_data');
      draw(_data);
      drawSvg(_data);
      deferred.resolve();
    } else {
      _vd.getTrackDataObject().then(function(data) {
        _data = data;
        localStorage.setObject('_data', _data);
        draw(_data);
        drawSvg(_data);
        deferred.resolve();
      });
    }

    return deferred.promise();
  };

  /**
   *
   */
  vizify.draw = function() {
    draw(_data);
    drawSvg(_data);
  };

  /**
   * @param {object}
   */
  function draw(data) {
    return;
    // TODO: dynamic resizing

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
        originY = window.innerHeight / 10,
        vizWidth = window.innerWidth - originX,
        vizHeight = window.innerHeight - originY,

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

    dataTotal = data.total || 0;
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
    }

    for (i = 0, cursorX = 0, cursorY = 0; i < sortedMonths.length; i++) {
      month = sortedMonths[i];
      monthTotal = dataMonths[month].total;
      monthGenres = dataMonths[month].genres;
      sortedMonthGenres = Object.keys(monthGenres).sort(function(a, b) {
        return -(monthGenres[a].total - monthGenres[b].total);
      });

      for (j = 0; j < sortedMonthGenres.length; j++) {
        genre = sortedMonthGenres[j];
        genreData = genreMetadata[genre];
        genreTotal = monthGenres[genre].total;
        genreLineWidth = lineWidth * genreTotal;
        genreSubgenres = monthGenres[genre].subgenres;

        cursorX += genreLineWidth * 0.5;
        genreData.cursorX += genreLineWidth * 0.5;
        genreData.cursorY += genreLineWidth * 0.1; // could be normalized

        var path = [
          { x: originX + cursorX, y: originY + cursorY },
          { x: originX + cursorX, y: topPaddingY },
          { x: originX + cursorX, y: topPaddingY },
          {
            x: (originX + cursorX + ((genreData.cursorX - cursorX) / 4)),
            y: originY + genreData.cursorY
          },
          {
            x: originX + cursorX + ((genreData.cursorX - cursorX) / 2),
            y: originY + genreData.cursorY
          },
          { x: originX + genreData.cursorX, y: originY + genreData.cursorY },
          // { x: originX + genreData.cursorX, y: originY + genreData.cursorY },
          { x: originX + genreData.cursorX, y: originY + btmPaddingY },
          { x: originX + genreData.cursorX, y: originY + btmPaddingY },
          { x: originX + genreData.cursorX, y: 9 * vizHeight / 10 }
        ];

        var lineFunction = svg.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate('basis');

        var path = svgCanvas.append('path')
          .style('opacity', 0.8)
          .attr('d', lineFunction(path))
          .attr('stroke', genreData.color)
          .attr('stroke-width', genreLineWidth)
          .attr('fill', 'none')

          .on('mouseover', function() {
            svg.select(this)
              .transition()
              // .duration(100)
              .attr('stroke-opacity', 0.5);
          })
          .on('mouseout', function() {
            svg.select(this)
              .transition()
              .duration(500)
              .attr('stroke-opacity', 1.0);
          });

        var totalLength = path.node().getTotalLength();

        path.attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition().duration(5000)
          // .ease('linear')
          .attr('stroke-dashoffset', 0);

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

  function drawSvg(data) {

  }

  function path(points) {

  }

  return vizify;
}(jQuery, d3));
