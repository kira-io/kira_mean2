var express = require('express')
  , path = require('path')
  , app = express()
  , config = require('./config/mongoose')
  , request = require('request')
  , isbot = require('is-bot')
  , externalip = require('externalip');
// configure environments
app.configure(function(){
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.bodyParser()); //to allow handling of POST data
  app.use(express.cookieParser()); //to allow session handling
  app.use(express.session({secret: 'monkey'})); //for using sessions
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
})
// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}
var users = {};

// This setting is needed on heroku so that we have access to
// the visitor's ip addresses. Remove it if you don't use heroku:

// app.enable('trust proxy');

// sudo npm i externalip AND require above
externalip(function (err, ip) {    //require externalip and get users external_ip
      console.log(ip); // => 8.8.8.8
      external_ip = ip
  });

// This is the special tracking url, which you should embed in an img on your site:

app.get('/ping', function (req, res) {
  
    // The /ping url has been requested by a web scanning bot.
    // We don't want to count it as a visitor so we will ignore it

    if(isbot(req.headers['user-agent'])){
        return res.send('Bad robot!');
    }

    // var ip = req.ip;    //this is from original code
    // console.log('IP', ip)

    // FreeGeoIP has a very simple api

  request('http://www.geoplugin.net/json.gp?ip=' + external_ip, function (e, r, body) {
    //use external_ip instead of ip
    try {
      var data = JSON.parse(body);
      console.log("\n\n\nDATA\n\n\n", data)
    }
    catch(e){
      return;
    }

    if (!e && r.statusCode == 200) {
      if(data.geoplugin_countryName){

        // Store the users in an object with their ip as a unique key

        users[external_ip]={  //change ip to external_ip
          timestamp : new Date(),
          latitude : data.geoplugin_latitude,
          longitude: data.geoplugin_longitude,
          country: data.geoplugin_countryName
        };
        console.log("\n\n\nUSERS\n\n\n", users)

      }
    }
    if(e){
      console.error(e);
    }
  });
  
  res.send('Done');

});

app.get('/online', function (req, res) {
  // console.log(req)

  var data = [],
    list = [];

  // How many minutes to consider an ip address online after /ping is visited
    // Currently it if 5 minutes. Feel free to change it

  var onlineInMinutes = 10;

  for (var key in users) {

    if (!users.hasOwnProperty(key)) continue;

    if (new Date - users[key]['timestamp'] < 1000 * 60 * onlineInMinutes){

            data.push({
                latitude: users[key]['latitude'],
                longitude: users[key]['longitude'],
                country : users[key]['country']
            });

        }

        // If a user hasn't visited for more than 6 hours
        // remove him from the users array.
        if (new Date - users[key]['timestamp'] > 1000*60*60*6){
            delete users[key];
        }

  }

  // Iterate all entries,
  // remove those with repeating country names
  // and place them in an array of objects with a corresponding count number

  data.forEach(function (a) {

    // If the country is already in the list, increase the count and return.

        for(var i=0; i<list.length; i++){
      if(list[i].countryName == a.country) {
        list[i].usersOnline++;
        return;
      }
    }

    // Otherwise, add a new country to the list

    list.push({
      latitude : a.latitude,
      longitude : a.longitude,
      countryName: a.country,
      usersOnline: 1
    });

  });


  // Sort the countries by number of users online

  list.sort(function (a,b) {

    if (a.usersOnline > b.usersOnline)
      return -1;
    if (a.usersOnline < b.usersOnline)
      return 1;
    return 0;

  });

  // Send our json response.
  // coordinates contains the information about all users
  // countriesList contains information without repeating country names and is sorted

  res.send({
    coordinates: data,
    countriesList: list
  });

  console.log('\n\n\nONLINE/DATA\n\n\n', data)
  console.log('\n\n\nONLINE/LIST\n\n\n', list)

});


var server = app.listen(process.env.PORT || 7777);
var io = require('socket.io').listen(server); // this tells socket.io to use our express server
require('./config/routes')(app, io);
console.log("Express server listening on port 7777");
