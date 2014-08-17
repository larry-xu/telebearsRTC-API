telebearsRTC
============

Berkeley real-time course enrollment data

This website provides a means for UC Berkeley students to easily access real-time course enrollment information from telebears. Most other course scheduling websites only provide daily updates to enrollment information, which can be pretty useless when it comes time to actually registering for your classes, resulting in haphazardly coming up with some sort of backup plan on the spot. With this tool, you can keep checking enrollment data throughout the day or over the course of several days and immediately see when spots open up.

Technologies Used
-----------------

- **Server**: Node.js & Express
- **Database**: MongoDB
- **MVC Framework**: Angular.js
- **Pre-processor**: Jade and Stylus
- **CSS Framework**: ZURB Foundation
- **Web Scrapers**: cheerio and request

Hosted on Microsoft Azure (because Heroku and Openshift were having problems with outbound https requests to Cal's server for some reason)