module.exports = function (PushRegistration) {
  var async = require('async');
  var randomWord = require('random-word');

  PushRegistration.beforeCreate = function (next) {
    PushRegistration.find({where: {deviceToken: PushRegistration.deviceToken}}, function (err, pr) {
      if (err) {
        return next(err);
      }

      if (pr) {
        async.forEach(pr, function (item, cb) {
          PushRegistration.destroyById(item.id, function (err, pr) {
            if (err) {
              return cb(err);
            }

            cb();
          });
        }, function (err) {
          if (err) {
            return next(err);
          }

          next();
        });
      } else {
        next();
      }
    });
  };

  PushRegistration.sendTest = function (userId, cb) {
    var Push = PushRegistration.app.models.Push;
    var Notification = PushRegistration.app.models.Notification;

    var notification = new Notification({
      expirationInterval: 3600,
      alert: {
        body: 'HELLO, ' + userId
      },
      messageFrom: 'HELLO'
    });

    Push.notifyByQuery({userId: userId}, notification, function (err) {
      if (err) {
        PushRegistration.app.logger.error('PushRegistration(%s).notifyByQuery Error: %j', userId, err);
      } else {
        PushRegistration.app.logger.debug('PushRegistration(%s)->PN.HELLO {pid:%s}', userId, process.pid);

        cb(null, {status: 'OK'});
      }
    });
  }

  PushRegistration.sendSeriesTest = function (userId, amount, cb) {
    var Push = PushRegistration.app.models.Push;
    var Notification = PushRegistration.app.models.Notification;

    var i;
    var notification = [];

    for (i = 0; i < amount; i++) {
      notification[i] = new Notification({
        expirationInterval: 3600,
        alert: {
          body: randomWord() + " - " + i
        },
        messageFrom: 'iCars',
        'content-available': 1,
        retryLimit: 5
      });
    }

    async.forEach(notification, function (notice, cb) {
      Push.notifyByQuery({userId: userId}, notice, function (err) {
        if (err) {
          PushRegistration.app.logger.error('PushRegistration(%s).notifyByQuery Error: %j', userId, err);
          cb(err);
        } else {
          PushRegistration.app.logger.debug('PushRegistration(%s)->PN.[%s] {pid:%s}', userId, notice.alert.body, process.pid);
          cb(null);
        }
      });
    }, function(err){
      if( err ) {
        console.log(err);
        cb(err);
      } else {
        cb(null, {status: 'OK'});
      }
    });
  }

  PushRegistration.clean = function(cb) {
    PushRegistration.destroyAll(function(err, info){
      if(err) {
        return cb(err);
      }

      cb(null, {deleted_rows: info});
    });
  }

  PushRegistration.remoteMethod(
    'clean',
    {
      description: 'Removes ALL Push Registrations',
      returns: {
        root: true
      },
      http: {
        verb: 'DELETE'
      }
    });

  PushRegistration.remoteMethod(
    'sendTest',
    {
      description: 'Send a sample PushNotification',
      accepts: [
        {
          arg: 'userId',
          type: 'any',
          description: 'userId of PushRegistrant',
          required: true
        }
      ],
      returns: {
        root: true
      },
      http: {
        verb: 'POST'
      }
    });

  PushRegistration.remoteMethod(
    'sendSeriesTest',
    {
      description: 'Send a series of sample PushNotifications',
      accepts: [
        {
          arg: 'userId',
          type: 'any',
          description: 'userId of PushRegistrant',
          required: true
        },
        {
          arg: 'amount',
          type: 'number',
          description: 'series amount',
          required: true
        }
      ],
      returns: {
        root: true
      },
      http: {
        verb: 'POST'
      }
    });
};
