// exports.getRateLimitRemaining =

function getRateLimitRemaining() {
  $.ajax({
    type: 'GET',
    crossDomain: true,
    // headers: {
    //   'Access-Control-Allow-Origin': '*',
    //   'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    // },
    url: 'http://developer.echonest.com/api/v4/artist/profile?api_key=VO9NDXU6IZBMOMI2X&name=weezer',
    beforeSend: function(xhr) {
      xhr.withCredentials = true;
      jQuery.ajaxSettings.traditional = true;
    },
    success: function(data, textStatus, response) {
      console.log(data);
      console.log(textStatus);
      console.log(response.getAllResponseHeaders());
      console.log(response.getAllResponseHeaders());
      console.log(response.getResponseHeader('X-Ratelimit-Remaining'));

    },
    async: false,
    complete: function (XMLHttpRequest, textStatus) {
        var headers = XMLHttpRequest.getAllResponseHeaders();
        console.log('******');
        console.log(headers);
    },
    error: function(response) {
      console.log(response);
    }
  });
}