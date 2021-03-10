const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({
  origin: "https://admin.gatmauel.com",
});
const webpush = require("web-push");

const serviceAccount = require("./serviceAccount.json");
const adminConfig = JSON.parse(process.env.FIREBASE_CONFIG);
adminConfig.credential = admin.credential.cert(serviceAccount);
admin.initializeApp(adminConfig);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.sendPushData = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    webpush.setVapidDetails(
      "mailto:gatmauel9300@gmail.com",
      functions.config().webpush.publickey,
      functions.config().webpush.privatekey
    );

    admin
      .database()
      .ref("subscription")
      .once("value")
      .then((AllData) => {
        AllData.forEach((sub) => {
          const pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh,
            },
          };
          webpush
            .sendNotification(pushConfig, JSON.stringify(req.body))
            .catch((err) => {
              functions.logger.log(err.message, err);

              sub.ref.remove();
            });
        });

        return res.status(201).end();
      })
      .catch((err) => {
        functions.logger.error(err.message, err);

        return res.status(500).end();
      });
  });
});
