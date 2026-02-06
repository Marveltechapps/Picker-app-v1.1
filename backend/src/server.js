require('./config/env');
const { connectDB } = require('./config/db');
const { loadOtpConfig, getSmsProvider, getTwilioConfig } = require('./config/otp.config');
const env = require('./config/env');
const app = require('./app');

// Load OTP/SMS config at startup so path and provider state are logged. Restart backend after config.json changes.
loadOtpConfig();
const smsProvider = getSmsProvider();
const twilio = getTwilioConfig();
const twilioConfigured = !!(twilio.accountSid && twilio.authToken && twilio.phoneNumber);
console.log('[OTP] SMS provider:', smsProvider, '| Twilio configured:', twilioConfigured, twilioConfigured ? `| From: ${(twilio.phoneNumber || '').slice(-4)}` : '');

const PORT = env.PORT;
const HOST = process.env.HOST || '0.0.0.0';

connectDB().catch((err) => {
  console.error('[db] Initial connection failed:', err.message);
});

const server = app.listen(PORT, HOST, () => {
  console.log('[server] Listening on', HOST + ':' + PORT, '(reachable from LAN for Expo Go)');
});

server.on('error', (err) => {
  console.error('[server] Failed to listen:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('[server] Port', PORT, 'already in use. Set PORT in .env or stop the other process.');
  }
  process.exitCode = 1;
});
