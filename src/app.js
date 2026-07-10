const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/routes');
const usersRoutes = require('./modules/users/routes');
const catalogRoutes = require('./modules/catalog/routes');
const shopsRoutes = require('./modules/shops/routes');
const cartRoutes = require('./modules/cart/routes');
const ordersRoutes = require('./modules/orders/routes');
const deliveryRoutes = require('./modules/delivery/routes');
const paymentsRoutes = require('./modules/payments/routes');
const settlementsRoutes = require('./modules/settlements/routes');
const notificationsRoutes = require('./modules/notifications/routes');
const reportsRoutes = require('./modules/reports/routes');
const adminRoutes = require('./modules/admin/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'kirana-marketplace-prototype' }));

// Each module owns its own auth/RBAC gating internally (see src/middleware),
// so the top-level mount is just: one URL prefix per PRD module.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/settlements', settlementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
