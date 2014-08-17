
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes/routes')
  , http = require('http')
  , path = require('path')
  , api = require('./routes/api');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
app.use(express.favicon(path.join(__dirname, 'public/images/favicon.ico')));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
app.get('/api/sections/:id/:course', api.sections);
app.get('/api/enrollment/:ccn', api.enrollment);
app.get('/api/autocomplete', routes.autocomplete);

app.get('/search', routes.search);
app.get('/about', function(req, res) { res.render('about', { title: 'About', semester: process.env.ENROLLMENT_PERIOD }) });
app.get('/contact', function(req, res) { res.render('contact', { title: 'Contact'}) });

app.get('/:id/:course', routes.course);
app.get('/:id', routes.department);
app.get('/', routes.index);

app.get('*', function(req, res) { res.render('404', { title: 'Errorrrrrrrr'}); })

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  api.casAuth(function(error) {
    if(!error)
      console.log('Authentication request with CalNet Authentication Service successful');
    else
      console.error(error);
  });
});
