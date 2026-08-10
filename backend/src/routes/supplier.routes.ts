import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { SupplierController } from '../controllers/supplier.controller';

const router = Router();
router.use(authenticate);

// ── Profile ────────────────────────────────────────────────────────────────────
// GET /api/suppliers/profile
router.get('/profile', SupplierController.getProfile);

// PUT /api/suppliers/profile
router.put('/profile', SupplierController.updateProfile);

// GET /api/suppliers/stats
router.get('/stats', SupplierController.getStats);

// ── Products ───────────────────────────────────────────────────────────────────
// GET  /api/suppliers/products
router.get('/products', SupplierController.listProducts);

// POST /api/suppliers/products
router.post('/products', SupplierController.createProduct);

// GET  /api/suppliers/products/:id
router.get('/products/:id', SupplierController.getProduct);

// PUT  /api/suppliers/products/:id
router.put('/products/:id', SupplierController.updateProduct);

// DELETE /api/suppliers/products/:id
router.delete('/products/:id', SupplierController.deleteProduct);

export default router;
