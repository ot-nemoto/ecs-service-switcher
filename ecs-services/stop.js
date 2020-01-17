'use strict';

const PublicHoliday = require('./public-holiday.js');
const EcsController = require('./ecs-controller.js');

module.exports.handler = function(event, context) {

  if ((new PublicHoliday(process.env['public_holiday_api'])).isHoliday()) {
    console.info("Scripts are skipped due to holidays.");
    return;
  }

  (new EcsController(process.env['tag_name'])).stop();
};
