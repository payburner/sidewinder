const {SidewinderTaskService} = require("@payburner/sidewinder-tasks-client/src/SidewinderTaskService");
const sidewinder = new SidewinderTaskService();
sidewinder.newAddress();
console.log('SEED:' + sidewinder.seed());
