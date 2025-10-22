const express = require('express');
const router = express.Router();
const userRouter = require('./user.js');
const geminiRouter = require('./gemini.js');
const paymentsRouter = require('./payments.js');
const dashboardRouter = require('./dashboard.js');
const splitRouter = require('./split.js');
const Chatbot = require('./Chatbot.js');
const profileRouter = require('./profile.js');

router.use('/profile', profileRouter);

router.use('/split', splitRouter);
router.use('/payments', paymentsRouter);
router.use('/user', userRouter);
router.use('/gemini', geminiRouter);
router.use('/dashboard', dashboardRouter);
router.use('/chatbot', Chatbot);

module.exports = router;