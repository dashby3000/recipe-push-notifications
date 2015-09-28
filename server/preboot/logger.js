module.exports = function (server) {
//Install Winston logging
  server.logger = require('winston');
  server.logger.level = server.get('logger').level;
};
