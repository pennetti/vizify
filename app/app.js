var fs = require('fs'),
    secret = require('./secret'),
    express = require('express'),
    request = require('request'),
    querystring = require('querystring'),
    cookieParser = require('cookie-parser');

    // spotifyApi = require('./en.js'), not yet implemented
    // genresJson = require('./genres.json');  // JSON.parse(genresJson)
    // Using 'require' on the json file so it is only loaded once

var client_id = secret.client_id, // Your client id
    redirect_uri = 'http://localhost:8888/callback', // Your redirect uri
    client_secret = secret.client_secret; // Your client secret

var app = express();

var state_key = 'spotify_auth_state';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
function generateRandomString(length) {
  var text = '',
      possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
        '0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16),
      scope = 'user-read-private ' + 'user-read-email ' +
        'user-library-read ' + 'playlist-read-private';

  res.cookie(state_key, state);

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    })
  );
});

app.get('/callback', function(req, res) {

  var code = req.query.code || null,
      state = req.query.state || null,
      storedState = req.cookies ? req.cookies[state_key] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      })
    );
  } else {
    res.clearCookie(state_key);

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
        client_id: client_id,
        client_secret: client_secret
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // requests here

        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          })
        );
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          })
        );
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  var refresh_token = req.query.refresh_token;

  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' +
      client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
