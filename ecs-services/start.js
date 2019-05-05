'use strict';

const AWS = require('aws-sdk');
const request = require('sync-request');
const jschardet = require('jschardet');
const Iconv = require('iconv').Iconv;

module.exports.handler = function(event, context) {
  var ecs = new AWS.ECS();
  var tagName = process.env['tag_name'];
  var enabledValues = ['ON', 'On', 'on', 'TRUE', 'True', 'true', '1'];

  // Check Public Holiday
  var response = request('GET', process.env['public_holiday_api']);
  let detectResult = jschardet.detect(response.body);
  console.log("charset: " + detectResult.encoding);
  let iconv = new Iconv(detectResult.encoding, 'UTF-8//TRANSLIT//IGNORE');
  let convertedString = iconv.convert(response.body).toString();
  console.log(convertedString);
  if (JSON.parse(convertedString).publicHoliday) {
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
