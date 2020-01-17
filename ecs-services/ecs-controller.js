const AWS = require('aws-sdk');

var EcsController = function(tagName) {
  this.tagName = tagName;
  this.enabledValues = ['ON', 'On', 'on', 'TRUE', 'True', 'true', '1'];
}

EcsController.prototype.start = async function() {
  var ecs = new AWS.ECS();

  var clusters = await ecs.listClusters({}).promise();
  for (var clusterArn of clusters.clusterArns) {
    var clasterTags = await ecs.listTagsForResource({resourceArn: clusterArn}).promise();
    var clusterSwitchValue = this.getTagValue(this.tagName, clasterTags.tags);
    var clusterDesiredCount = this.getTagValue('default-desired-count', clasterTags.tags);
    var services = await ecs.listServices({cluster: clusterArn}).promise();

    for (var serviceArn of services.serviceArns) {
      var serviceTags = await ecs.listTagsForResource({resourceArn: serviceArn}).promise();
      var serviceSwitchValue = this.getTagValue(this.tagName, serviceTags.tags);
      var serviceDesiredCount = this.getTagValue('default-desired-count', serviceTags.tags);
      var switchValue = serviceSwitchValue || clusterSwitchValue;
      var desiredCount = serviceDesiredCount || clusterDesiredCount || 1;

      console.debug(`ClusterSwitchValue: ${clusterSwitchValue}`);
      console.debug(`ServiceSwitchValue: ${serviceSwitchValue}`);
      console.debug(`SwitchValue: ${switchValue}`);
      console.debug(`ClusterDesiredCount: ${clusterDesiredCount}`);
      console.debug(`ServiceDesiredCount: ${serviceDesiredCount}`);
      console.debug(`DesiredCount: ${desiredCount}`);

      if (!this.enabledValues.includes(switchValue)) continue;
      
      // UpdateService
      let params = {
        cluster: clusterArn,
        service: serviceArn,
        desiredCount: desiredCount
      };
      ecs.updateService(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else     console.log(data);
      });
    }
  }
};

EcsController.prototype.stop = async function() {
  var ecs = new AWS.ECS();
  
  console.log(this.tagName);
  
  var clusters = await ecs.listClusters({}).promise();
  for (var clusterArn of clusters.clusterArns) {
    var clasterTags = await ecs.listTagsForResource({resourceArn: clusterArn}).promise();
    var clusterSwitchValue = this.getTagValue(this.tagName, clasterTags.tags);
    var desiredCount = 0;
    var services = await ecs.listServices({cluster: clusterArn}).promise();

    for (var serviceArn of services.serviceArns) {
      var serviceTags = await ecs.listTagsForResource({resourceArn: serviceArn}).promise();
      var serviceSwitchValue = this.getTagValue(this.tagName, serviceTags.tags);
      var switchValue = serviceSwitchValue || clusterSwitchValue;

      console.debug(`ClusterSwitchValue: ${clusterSwitchValue}`);
      console.debug(`ServiceSwitchValue: ${serviceSwitchValue}`);
      console.debug(`SwitchValue: ${switchValue}`);
      console.debug(`DesiredCount: ${desiredCount}`);

      if (!this.enabledValues.includes(switchValue)) continue;
      
      // UpdateService
      let params = {
        cluster: clusterArn,
        service: serviceArn,
        desiredCount: desiredCount
      };
      ecs.updateService(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else     console.log(data);
      });
    }
  }
};

EcsController.prototype.getTagValue = function(key, tags) {
  for (var tag of tags) {
    if (tag.key == key) return tag.value;
  }
  return null;
};

module.exports = EcsController;
