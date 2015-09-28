var cluster = require('cluster');

module.exports = function (app) {
  if (cluster.isMaster) {
    var fs = require('fs');
    var path = require('path');
    var async = require('async');

    var Application = app.models.Application;
    var PushModel = app.models.Push;

    PushModel.on('error', function (err) {
      app.logger.error('PushNotification->error: %j', err);
    });

    PushModel.on('transmissionError', function (code, notification, recipient) {
      app.logger.error('PushNotification->transmissionError: %j', code, notification, recipient);
    });

    var pushConfig = app.get('push');

    async.each(pushConfig, function (pc, cb) {
      if (pc.pushSettings.apns) {
        pc.pushSettings.apns.certData = readCredentialsFile(pc.pushSettings.apns.certData);
        pc.pushSettings.apns.keyData = readCredentialsFile(pc.pushSettings.apns.keyData);
      }

      updateOrCreateApp(pc, function (err, appModel) {
        if (err) {
          throw err;
        }
        app.logger.debug('Application id: %j', appModel.id);

        cb();
      });
    }, function (err) {
      if (err) {
        throw err;
      }

      app.logger.info('PushNotification Initialized. {pid:%s}', process.pid);
    });

    //------------------
    function readCredentialsFile(name) {
      return fs.readFileSync(path.resolve(__dirname, '../credentials/push', name), 'UTF-8');
    }

    function updateOrCreateApp(config, cb) {
      Application.findOne({
          where: {
            name: config.name
          }
        },
        function (err, result) {
          if (err) {
            cb(err);
          }

          if (result) {
            app.logger.debug('PushNotification->updateOrCreateApp: %s {pid:%s}', result.id, process.pid);
            result.updateAttributes(config, cb);
          } else {
            app.logger.debug('PushNotification->registerApp {pid:%s}', process.pid);
            return registerApp(config, cb);
          }
        });
    }

    function registerApp(config, cb) {
      app.logger.debug('PushNotification->registerApp: %s {pid:%s}', config.name, process.pid);
      // Required to set the app id to a fixed value so that we don't have to change the client settings

      Application.beforeSave = function (next) {
        if (this.name === config.name) {
          this.id = config.id;
        }
        next();
      };

      Application.register(
        config.userId,
        config.name, {
          description: config.description,
          pushSettings: config.pushSettings
        },
        function (err, app) {
          if (err) {
            return cb(err);
          }

          return cb(null, app);
        }
      );
    }
  }
};
