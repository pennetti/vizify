var vizify = (function($) {

  var _vd = new vizifyData();

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

  }

  return _vizify;
}(jQuery));
