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

        ecs.listServices({cluster: clusterArn}, function(err, data) {
          if (err) { console.log(err, err.stack); return }

          ecs.describeServices({cluster: clusterArn, services: data.serviceArns}, function(err, data) {
            if (err) { console.log(err, err.stack); return }

            data.services.forEach(function(service) {
              switch (service.launchType) {
                case 'EC2':
                  var autoscaling = new AWS.AutoScaling();
                  service.loadBalancers.forEach(function(loadBalancer) {
                    autoscaling.describeAutoScalingGroups({}, function(err, data) {
                      if (err) { console.log(err, err.stack); return }
                      data.AutoScalingGroups.forEach(function(autoScalingGroup) {
                        if (autoScalingGroup.TargetGroupARNs.includes(loadBalancer.targetGroupArn)) {
                          let params = {
                            AutoScalingGroupName: autoScalingGroup.AutoScalingGroupName,
                            DesiredCapacity: 0
                          };
                          autoscaling.setDesiredCapacity(params, function(err, data) {
                            if (err) { console.log(err, err.stack); }
                            else {
                              console.log(data);
                              console.info(`The desired capacity of AutoScalingGroup(${autoScalingGroup.AutoScalingGroupName}) was set to 0`);
                            }
                          });
                        }
                      });
                    });
                  });
                  // break;
                case 'FARGATE':
                  let params = {
                    cluster: clusterArn,
                    service: service.serviceArn,
                    desiredCount: 0
                  };
                  ecs.updateService(params, function(err, data) {
                    if (err) { console.log(err, err.stack); }
                    else {
                      console.debug(data);
                      console.info(`The desired count of the ECS service(${service.serviceArn}) was set to 0`);
                    }
                  });
                  break;
                default:
                  console.warn("Unkonwn LaunchType");
              }
            });
          });
        });
      });
    });
  });
};
