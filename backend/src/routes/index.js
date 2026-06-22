const express = require('express');
const router  = express.Router();
const { auth, requireRole, requirePermission } = require('../middleware/auth');
const mfgC = require('../controllers/manufacturingController');
const accountC = require('../controllers/accountController');
const anC = require('../controllers/analyticsController');
const secC = require('../controllers/secondaryController');
const walletC = require('../controllers/walletController');
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

// ── ACCOUNT USERS & PERMISSIONS ───────────────────────────────────────────────
router.get   ('/account/members',     auth, requirePermission('manage_users'), accountC.listMembers);
router.post  ('/account/members',     auth, requirePermission('manage_users'), accountC.addMember);
router.put   ('/account/members/:id', auth, requirePermission('manage_users'), accountC.updateMember);
router.delete('/account/members/:id', auth, requirePermission('manage_users'), accountC.removeMember);
router.get   ('/account/activity',    auth, requirePermission('manage_users'), accountC.activity);

// ── CATEGORIES ────────────────────────────────────────────────────────────────
router.get('/categories', auth, mainC.getCategories);

// ── RFQs ──────────────────────────────────────────────────────────────────────
router.get ('/rfqs',                    auth, rfqC.list);
router.post('/rfqs',                    auth, requireRole('buyer'), requirePermission('rfqs'), rfqC.create);
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
router.post('/invoices',                auth, requireRole('buyer','supplier'), requirePermission('invoices'), mainC.createInvoice);

// ── FINANCING ─────────────────────────────────────────────────────────────────
router.post('/financing/request',                           auth, requirePermission('financing'), mainC.requestFinancing);
router.get ('/financing/requests',                          auth, mainC.listFinancingRequests);
router.post('/financing/requests/:financing_request_id/bid',auth, requireRole('investor','admin','owner'), requirePermission('invest'), mainC.submitFinancingBid);
router.post('/financing/bids/:bid_id/accept',               auth, mainC.acceptFinancingBid);
router.post('/financing/requests/:financing_request_id/fund-by-platform', auth, requireRole('admin','owner'), mainC.fundByPlatform);

router.get ('/installments',             auth, mainC.listInstallments);
router.post('/installments/:id/pay',     auth, requirePermission('installments'), mainC.payInstallment);
router.put ('/installments/:id/confirm', auth, requireRole('admin','owner'), requirePermission('approve_payments'), mainC.confirmInstallment);
router.get ('/deals', auth, mainC.listDeals);
router.get ('/financing/agreements', auth, mainC.listAgreements);
router.put ('/financing/requests/:id/sign', auth, mainC.signAgreement);

// Manufacturing (ORDRAX)
router.post('/manufacturing/orders',                 auth, requireRole('buyer','admin','owner'), requirePermission('manufacturing'), mfgC.createOrder);
router.get ('/manufacturing/orders',                 auth, mfgC.listOrders);
router.get ('/manufacturing/orders/:id/stages',      auth, mfgC.getStages);
router.put ('/manufacturing/orders/:id/match',       auth, requireRole('admin','owner'), mfgC.matchFactory);
router.put ('/manufacturing/stages/:id/progress',    auth, requireRole('supplier','admin','owner'), mfgC.stageProgress);
router.put ('/manufacturing/stages/:id/qa',          auth, requireRole('admin','owner'), requirePermission('qa'), mfgC.stageQA);
router.put ('/manufacturing/stages/:id/receive',     auth, requireRole('buyer','admin','owner'), mfgC.stageReceive);
router.get ('/manufacturing/factories',              auth, mfgC.listFactories);
router.post('/manufacturing/estimate',               auth, mfgC.estimate);
router.get ('/manufacturing/orders/:id/suggest',     auth, requireRole('admin','owner'), mfgC.suggest);
router.post('/manufacturing/orders/:id/offers',      auth, requireRole('supplier'), mfgC.submitOffer);
router.get ('/manufacturing/orders/:id/offers',      auth, requireRole('buyer','admin','owner'), mfgC.listOffers);
router.put ('/manufacturing/offers/:id/accept',      auth, requireRole('buyer','admin','owner'), mfgC.acceptOffer);
router.post('/manufacturing/orders/:id/finance',     auth, requireRole('buyer','admin','owner'), mfgC.financeOrder);
router.post('/manufacturing/orders/:id/review',      auth, requireRole('buyer','admin','owner'), mfgC.submitReview);
router.post('/manufacturing/orders/:id/disputes',    auth, requireRole('buyer','admin','owner'), mfgC.raiseDispute);
router.get ('/manufacturing/orders/:id/disputes',    auth, mfgC.getDisputes);
router.put ('/manufacturing/disputes/:id/resolve',   auth, requireRole('admin','owner'), requirePermission('disputes'), mfgC.resolveDispute);
router.get ('/impact', auth, requireRole('admin','owner','investor'), anC.impact);
router.get ('/analytics/dashboard', auth, requireRole('admin','owner'), anC.dashboard);
router.get ('/financing/portfolio', auth, requireRole('investor','admin','owner'), anC.portfolio);
router.get ('/financing/auto-invest', auth, requireRole('investor','admin','owner'), mainC.getAutoInvest);
router.put ('/financing/auto-invest', auth, requireRole('investor','admin','owner'), mainC.setAutoInvest);

// Secondary market
router.get ('/secondary/listings',        auth, secC.listListings);
router.post('/secondary/listings',        auth, requireRole('investor','admin','owner'), requirePermission('invest'), secC.createListing);
router.post('/secondary/listings/:id/buy',auth, requireRole('investor','admin','owner'), requirePermission('invest'), secC.buyListing);
router.get ('/secondary/my-positions',    auth, requireRole('investor','admin','owner'), secC.myPositions);

// ── COMPETITIONS ──────────────────────────────────────────────────────────────
router.get ('/competitions',                          auth, mainC.listCompetitions);
router.post('/competitions',                          auth, requireRole('buyer','admin','owner'), mainC.createCompetition);
router.post('/competitions/:competition_id/bid',      auth, requireRole('supplier'), mainC.submitCompBid);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
router.get('/dashboard/stats',   auth, mainC.dashboardStats);
router.post('/installments/settle/:request_id',        auth, requireRole('buyer','admin','owner'), mainC.settleEarly);
router.put ('/installments/settle/:request_id/confirm', auth, requireRole('admin','owner'), requirePermission('approve_payments'), mainC.confirmSettlement);
router.get('/wallet/ledger',     auth, walletC.ledger);
router.get('/notifications',     auth, mainC.getNotifications);
router.put('/notifications/read',auth, mainC.markRead);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.get('/admin/users',           auth, requireRole('admin','owner'), mainC.adminUsers);
router.put('/admin/users/:id/approve',auth,requireRole('admin','owner'), requirePermission('review_accounts'), mainC.approveUser);
router.post('/admin/test-email',     auth, requireRole('admin','owner'), mainC.testEmail);

module.exports = router;
