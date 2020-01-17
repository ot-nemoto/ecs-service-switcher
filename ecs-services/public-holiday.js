const request = require('sync-request');
const jschardet = require('jschardet');
const Iconv = require('iconv').Iconv;

var PublicHoliday = function(url) {
  this.request_uri = url + '/holiday';
};

PublicHoliday.prototype.isHoliday = function() {
  try {
    var response = request('GET', this.request_uri);
    var detectResult = jschardet.detect(response.body);
    console.log("charset: " + detectResult.encoding);
    var iconv = new Iconv(detectResult.encoding, 'UTF-8//TRANSLIT//IGNORE');
    var convertedString = iconv.convert(response.body).toString();
    console.log(convertedString);
    if (JSON.parse(convertedString).publicHoliday) {
      return true;
    }
  } catch(e) {
    console.warn(e.message);
  }
  return false;
};

module.exports = PublicHoliday;