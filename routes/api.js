
/*
 * API calls
 */

var cheerio = require('cheerio')
  , request = require('request')
  , semester = process.env.SEMESTER
  , year = process.env.YEAR
  , casUsername = process.env.USERNAME
  , casPassword = process.env.PASSWORD;



/*
 * GET course section listings.
 * route: /api/sections/:id/:course
 * route example: /api/sections/math/53
 */

exports.sections = function(req, res) {
  var id = req.params.id;
  var course = req.params.course;
  exports.loadSectionList(id, course, function(result) {
    res.set('Cache-Control','private');
    res.json(result);
  });
}

// queries osoc.berkeley.edu for all course listings for a given course
// returns an array of objects containing course data
exports.loadSectionList = function(id,course,callback) {
  var courses = [];
  var url = "http://osoc.berkeley.edu/OSOC/osoc?p_term=" + semester + "&p_course=" + course + "&p_dept=" + id;

  request.get(url, function(error, res, body) {
    if(!error && res.statusCode == 200) {
      var $ = cheerio.load(body);
      var end = $('table').length - 1;
      var index = 0;

      $('table').slice(1,end).each(function() {
        var data = {};
        data.index = index;
        var section = $(this).find('tr:nth-of-type(1) td:nth-of-type(3)').text().trim();
        space = section.lastIndexOf(' ');
        for(var i = 0; i < 2; i++) {
          space = section.lastIndexOf(' ', space-1);
        }
        section_id = section.substring(space+1);
        var sectionIndex = section.indexOf(course.toUpperCase());
        if(section.charAt(sectionIndex-1) == ' ' && section.charAt(sectionIndex+course.length) == ' ') {
          data.section = section_id;
          data.instructor = $(this).find('tr:nth-of-type(3) td:nth-of-type(2)').text();
          var restrictions = $(this).find('tr:nth-of-type(8) td:nth-of-type(2)').text();
          var location = $(this).find('tr:nth-of-type(2) td:nth-of-type(2)').text();
          if(location != "CANCELLED" && restrictions != "CURRENTLY NOT OPEN") {
            var locationArray = location.split(", ");
            data.time = locationArray[0];
            data.location = locationArray[1];
            data.ccn = $(this).find('input[name="_InField2"]').val();
            courses.push(data);
            index++;
          }
        }
      });
      callback(courses);
    }
    else
      console.log('Error: ' + error);
  });
}

/*
 * GET course section listings.
 * route: /api/enrollment/:ccn
 * route example: /api/enrollment/53802
 */

exports.enrollment = function(req, res) {
  var ccn = req.params.ccn;
  exports.loadEnrollmentData(ccn, function(result) {
    res.set('Cache-Control','private');
    res.json(result);
  });
}

// queries telebears.berkeley.edu with ccn parameter and parses result
// returns an object containing enrollment data
exports.loadEnrollmentData = function(ccn,callback) {
  var url = 'https://telebears.berkeley.edu/enrollment-osoc/osc';
  request(
    {
      url: url,
      qs: {
        _InField1:'RESTRIC',
        _InField2: ccn,
        _InField3: year
      },
      headers: {
        'Referer': 'http://osoc.berkeley.edu/OSOC/osoc?p_term=FL&x=0&p_classif=--+Choose+a+Course+Classification+--&p_deptname=--+Choose+a+Department+Name+--&p_presuf=--+Choose+a+Course+Prefix%2fSuffix+--&y=0'
      },
      jar: true
    },
    function(error, res, body) {
    if (!error && res.statusCode == 200) {
      if(res.request.host == 'auth.berkeley.edu') {
        console.log('auth');
        exports.casAuth(function(error) {
          if(!error)
            exports.loadEnrollmentData(ccn, callback);
          else
            console.error(error);
        });
      }
      else {
        var $ = cheerio.load(body);
        var divText = $('blockquote:first-of-type div.layout-div').text();
        divText = divText.replace(/(\r\n|\n|\r)/gm,"");
        divText = divText.replace(/\s+/g," ");
        divText = divText.substring(1);
        var textArray = divText.split(" ");
        var enrollData = {};
        enrollData.ccn = parseInt(ccn,10);
        enrollData.enroll = parseInt(textArray[0],10);
        enrollData.enrollLimit = parseInt(textArray[8],10);
        if(textArray[21] != null) {
          enrollData.waitlist = parseInt(textArray[10],10);
          enrollData.waitlistLimit = parseInt(textArray[21]);
        }
        callback(enrollData);
      }
    }
    else {
      console.error(error);
    }
  })
}

// authenticate with CAS on server startup
exports.casAuth = function(next) {
  var uri = 'https://auth.berkeley.edu/cas/login';
  request(
    {
      url: uri,
      jar: true
    },
    function(error, res, body) {
      if (!error && res.statusCode == 200) {
        var $ = cheerio.load(body);
        var lt = $('input[name="lt"]').val();
        request(
          {
            url: uri,
            method: 'POST',
            form: {
              username: casUsername,
              password: casPassword,
              lt: lt,
              execution: 'e1s1',
              _eventId: 'submit'
            },
            followAllRedirects: true,
            jar: true
          },
          function(error, res, body) {
            if (!error && res.statusCode == 200) {
              next();
            }
            else {
              next(error);
            }
          }
        );
      } else {
        next(error);
      }
    }
  );
}