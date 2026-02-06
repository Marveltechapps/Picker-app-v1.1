const express = require('express');
const cors = require('cors');
const { isDbConnected } = require('./config/db');
const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const documentsRoutes = require('./routes/documents.routes');
const verifyRoutes = require('./routes/verify.routes');
const trainingRoutes = require('./routes/training.routes');
const shiftsRoutes = require('./routes/shifts.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const walletRoutes = require('./routes/wallet.routes');
const bankRoutes = require('./routes/bank.routes');
const notificationRoutes = require('./routes/notification.routes');
const faqRoutes = require('./routes/faq.routes');
const supportTicketRoutes = require('./routes/supportTicket.routes');
const pushTokenRoutes = require('./routes/pushToken.routes');
const sampleRoutes = require('./routes/sample.routes');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, db: isDbConnected() });
});

function requireDb(req, res, next) {
  if (isDbConnected()) return next();
  res.status(503).json({
    success: false,
    message: 'Database unavailable',
  });
}

app.use(requireDb);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/documents', documentsRoutes);
app.use('/verify', verifyRoutes);
app.use('/training', trainingRoutes);
app.use('/shifts', shiftsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/wallet', walletRoutes);
app.use('/bank', bankRoutes);
app.use('/notifications', notificationRoutes);
app.use('/faqs', faqRoutes);
app.use('/support', supportTicketRoutes);
app.use('/api/push-tokens', pushTokenRoutes);
app.use('/api/samples', sampleRoutes);

app.use(errorHandler);

module.exports = app;
