
/*
 * GET listing of all courses from schedule.berkeley.edu
 */

var cheerio = require('cheerio')
  , request = require('request')
  , mongojs = require('mongojs')
  , term = process.env.SEMESTER
  , appId = process.env.BERKELEY_APP_ID
  , appKey = process.env.BERKELEY_APP_KEY;

if(process.env.MONGOHQ_URL)
  var mongourl = process.env.MONGOHQ_URL
else
  var mongourl = 'mydb';

var db = mongojs(mongourl, ['departments']);

exports.load = function() {
  var url = "http://osoc.berkeley.edu/OSOC/osoc?p_term="+term+"&p_list_all=Y";
  var result = [];
  var deptData = {};
  var gotAbb = false;
  var initialized = false;
  var first = true;

  console.log('Loading new listing of courses');
  db.departments.remove({}, false, function(error) {
    if(!error) {
      request.get(url, function(error, resp, body) {
        if(!error && resp.statusCode == 200) {
          var $ = cheerio.load(body);
          var length = $('table table tr').length;
          $('table table tr').slice(1).each(function(index) {
            var department = $(this).find('td[colspan="3"]');
            if(department.length > 0 || first) {
              if(initialized) {
                result.push(deptData);
              }
              gotAbb = false;
              deptData = {};
              deptData.courses = [];
              if(first) {
                deptData.name = 'African American Studies';
                first = false;
              }
              else {
                deptData.name = department.text();
              }
              initialized = true;
            }
            else if(index == length - 2) {
              result.push(deptData);
            }
            else {
              var course = {};

              if(!gotAbb) {
                deptData.abbreviation = $(this).find('td:nth-of-type(1)').text();
                gotAbb = true;
              }

              course.course = $(this).find('td:nth-of-type(2)').text().trim();
              if(course.course != '999') {
                course.title = $(this).find('td:nth-of-type(3)').text();
                deptData.courses.push(course);
              }
            }
          });

          var count = 0;

          for(var i = 0; i < result.length; i++) {
            var url = 'https://apis-dev.berkeley.edu/cxf/asws/department?departmentCode='+result[i].abbreviation+'&_type=json&app_id='+appId+'&app_key='+appKey;

            function getDepartmentName() {
              var index = i;

              request(url, function(error, response, body) {
                if(!error && response.statusCode == 200) {
                  result[index].name = JSON.parse(body).CanonicalDepartment[0].departmentName;
                  db.departments.save(result[index], function(err, saved) {
                    if(err || !saved) console.log('DB error');
                  });
                  count++;
                  if(count == result.length) {      
                    console.log('Finished loading new courses, count: ' + count);
                  }
                }
                else
                  console.error(error);
              });
            }

            getDepartmentName();
          }
        }
        else
          console.error(error);
      });
    } else {
      console.error(error);
    }
  });
}