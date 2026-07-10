/**
 * Firebase Cloud Messaging (FCM) helper — server-side push notifications.
 * Docs: https://firebase.google.com/docs/cloud-messaging/send-message
 *
 * Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
 * to enable real push. Absent keys → mock mode (logs to console only).
 */

let app = null;
let messaging = null;
let isMock = false;

function getMessaging() {
  if (messaging) return messaging;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[fcm] Firebase env vars not set — push notifications disabled (mock mode)');
    isMock = true;
    return null;
  }

  const admin = require('firebase-admin');
  if (!app) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped newlines from env var
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  messaging = admin.messaging(app);
  return messaging;
}

/**
 * Send a push notification to a single device FCM token.
 * Silently swallows errors so push never blocks the main flow.
 */
async function sendToToken(token, { title, body, data = {} }) {
  if (!token) return;

  const msgClient = getMessaging();
  if (isMock || !msgClient) {
    console.log(`[fcm:mock] → ${token.slice(0, 10)}… | ${title}: ${body}`);
    return;
  }

  try {
    await msgClient.send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    console.error('[fcm] Failed to send push notification:', err.message);
  }
}

/**
 * Send to multiple tokens (batch, max 500 per call per FCM limit).
 */
async function sendMulticast(tokens, { title, body, data = {} }) {
  if (!tokens || tokens.length === 0) return;

  const msgClient = getMessaging();
  if (isMock || !msgClient) {
    console.log(`[fcm:mock] multicast → ${tokens.length} device(s) | ${title}: ${body}`);
    return;
  }

  try {
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
    await Promise.all(
      chunks.map((chunk) =>
        msgClient.sendEachForMulticast({
          tokens: chunk,
          notification: { title, body },
          data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        })
      )
    );
  } catch (err) {
    console.error('[fcm] Multicast failed:', err.message);
  }
}

module.exports = { sendToToken, sendMulticast };
