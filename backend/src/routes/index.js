const express = require('express');
const router  = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const authC = require('../controllers/authController');
const rfqC  = require('../controllers/rfqController');
const mainC = require('../controllers/mainController');

// ── AUTH ──────────────────────────────────────────────────────────────────────
router.post('/auth/register',         authC.register);
router.post('/auth/login',            authC.login);
router.get ('/auth/me',               auth, authC.me);
router.put ('/auth/profile',          auth, authC.updateProfile);
router.put ('/auth/change-password',  auth, authC.changePassword);

// ── CATEGORIES ────────────────────────────────────────────────────────────────
router.get('/categories', auth, mainC.getCategories);

// ── RFQs ──────────────────────────────────────────────────────────────────────
router.get ('/rfqs',                    auth, rfqC.list);
router.post('/rfqs',                    auth, requireRole('buyer'), rfqC.create);
router.get ('/rfqs/:id',                auth, rfqC.get);
router.put ('/rfqs/:id',                auth, requireRole('buyer'), rfqC.update);
router.delete('/rfqs/:id',              auth, requireRole('buyer'), rfqC.remove);
router.get ('/rfqs/:id/quotes',         auth, rfqC.getQuotes);
router.post('/rfqs/:id/award/:quote_id',auth, requireRole('buyer'), rfqC.award);

// ── QUOTES ────────────────────────────────────────────────────────────────────
router.post('/rfqs/:rfq_id/quotes',     auth, requireRole('supplier'), mainC.submitQuote);
router.get ('/my-quotes',               auth, requireRole('supplier'), mainC.myQuotes);

// ── INVOICES ──────────────────────────────────────────────────────────────────
router.get ('/invoices',                auth, mainC.listInvoices);
router.post('/invoices',                auth, requireRole('buyer','supplier'), mainC.createInvoice);

// ── FINANCING ─────────────────────────────────────────────────────────────────
router.post('/financing/request',                           auth, mainC.requestFinancing);
router.get ('/financing/requests',                          auth, mainC.listFinancingRequests);
router.post('/financing/requests/:financing_request_id/bid',auth, requireRole('investor','admin'), mainC.submitFinancingBid);
router.post('/financing/bids/:bid_id/accept',               auth, mainC.acceptFinancingBid);

// ── COMPETITIONS ──────────────────────────────────────────────────────────────
router.get ('/competitions',                          auth, mainC.listCompetitions);
router.post('/competitions',                          auth, requireRole('buyer','admin'), mainC.createCompetition);
router.post('/competitions/:competition_id/bid',      auth, requireRole('supplier'), mainC.submitCompBid);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',   auth, mainC.dashboardStats);
router.get('/notifications',     auth, mainC.getNotifications);
router.put('/notifications/read',auth, mainC.markRead);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.get('/admin/users',           auth, requireRole('admin'), mainC.adminUsers);
router.put('/admin/users/:id/approve',auth,requireRole('admin'), mainC.approveUser);

module.exports = router;
