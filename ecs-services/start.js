'use strict';

const AWS = require('aws-sdk');
const PublicHoliday = require('public-holiday');

module.exports.handler = function(event, context) {
  var ecs = new AWS.ECS();
  var tagName = process.env['tag_name'];
  var enabledValues = ['ON', 'On', 'on', 'TRUE', 'True', 'true', '1'];

  var holiday = new PublicHoliday(process.env['public_holiday_api']);
  if (holiday.isHoliday()) {
    console.info("Scripts are skipped due to holidays.");
    return;
  }

  ecs.listClusters({}, function(err, data) {
    if (err) { console.log(err, err.stack); return }

    data.clusterArns.forEach(function(clusterArn) {

      ecs.listTagsForResource({ resourceArn: clusterArn }, function(err, data) {
        if (err) { console.log(err, err.stack); return; }

        var tags = {};
        data.tags.forEach(function(tag) { tags[tag.key] = tag.value; });
        if (!tags[tagName] || !enabledValues.includes(tags[tagName])) return;

        var cluster = clusterArn.split("/")[1];
        ecs.listServices({cluster: cluster}, function(err, data) {
          if (err) { console.log(err, err.stack); return }

          data.serviceArns.forEach(function(serviceArn) {
            var service = serviceArn.split("/")[1];
            var desiredCount = tags['default-desired-count'] || 1;
            ecs.updateService({cluster: cluster, service: service, desiredCount: desiredCount}, function(err, data) {
              if (err) console.log(err, err.stack);
              else     console.log(data);
            });
          });
        });
      });
    });
  });
};
