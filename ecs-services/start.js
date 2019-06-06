'use strict';

const PublicHoliday = require('public-holiday');
const EcsController = require('ecs-controller');

module.exports.handler = function(event, context) {

  if ((new PublicHoliday(process.env['public_holiday_api'])).isHoliday()) {
    console.info("Scripts are skipped due to holidays.");
    return;
  }

  (new EcsController(process.env['tag_name'])).start();
};
