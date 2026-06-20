const express = require('express');
const router  = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const mfgC = require('../controllers/manufacturingController');
const anC = require('../controllers/analyticsController');
const authC = require('../controllers/authController');
const rfqC  = require('../controllers/rfqController');
const mainC = require('../controllers/mainController');

// ── AUTH ──────────────────────────────────────────────────────────────────────
router.post('/auth/register',         authC.register);
router.post('/auth/login',            authC.login);
router.get ('/auth/me',               auth, authC.me);
router.put ('/auth/profile',          auth, authC.updateProfile);
router.put ('/auth/change-password',  auth, authC.changePassword);
router.put ('/auth/documents',         auth, authC.updateDocuments);

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
router.post('/financing/requests/:financing_request_id/bid',auth, requireRole('investor','admin','owner'), mainC.submitFinancingBid);
router.post('/financing/bids/:bid_id/accept',               auth, mainC.acceptFinancingBid);
router.post('/financing/requests/:financing_request_id/fund-by-platform', auth, requireRole('admin','owner'), mainC.fundByPlatform);

router.get ('/installments',             auth, mainC.listInstallments);
router.post('/installments/:id/pay',     auth, mainC.payInstallment);
router.put ('/installments/:id/confirm', auth, requireRole('admin','owner'), mainC.confirmInstallment);
router.get ('/deals', auth, mainC.listDeals);
router.get ('/financing/agreements', auth, mainC.listAgreements);
router.put ('/financing/requests/:id/sign', auth, mainC.signAgreement);

// Manufacturing (ORDRAX)
router.post('/manufacturing/orders',                 auth, requireRole('buyer','admin','owner'), mfgC.createOrder);
router.get ('/manufacturing/orders',                 auth, mfgC.listOrders);
router.get ('/manufacturing/orders/:id/stages',      auth, mfgC.getStages);
router.put ('/manufacturing/orders/:id/match',       auth, requireRole('admin','owner'), mfgC.matchFactory);
router.put ('/manufacturing/stages/:id/progress',    auth, requireRole('supplier','admin','owner'), mfgC.stageProgress);
router.put ('/manufacturing/stages/:id/qa',          auth, requireRole('admin','owner'), mfgC.stageQA);
router.get ('/manufacturing/factories',              auth, requireRole('admin','owner'), mfgC.listFactories);
router.post('/manufacturing/estimate',               auth, mfgC.estimate);
router.get ('/manufacturing/orders/:id/suggest',     auth, requireRole('admin','owner'), mfgC.suggest);
router.get ('/impact', auth, requireRole('admin','owner','investor'), anC.impact);
router.get ('/financing/portfolio', auth, requireRole('investor','admin','owner'), anC.portfolio);

// ── COMPETITIONS ──────────────────────────────────────────────────────────────
router.get ('/competitions',                          auth, mainC.listCompetitions);
router.post('/competitions',                          auth, requireRole('buyer','admin','owner'), mainC.createCompetition);
router.post('/competitions/:competition_id/bid',      auth, requireRole('supplier'), mainC.submitCompBid);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',   auth, mainC.dashboardStats);
router.get('/notifications',     auth, mainC.getNotifications);
router.put('/notifications/read',auth, mainC.markRead);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.get('/admin/users',           auth, requireRole('admin','owner'), mainC.adminUsers);
router.put('/admin/users/:id/approve',auth,requireRole('admin','owner'), mainC.approveUser);

module.exports = router;
