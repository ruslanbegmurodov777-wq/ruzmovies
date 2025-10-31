import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { protect, admin } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', categoryController.getAllCategories);

// Admin/Owner only routes
router.post('/', protect, admin, categoryController.createCategory);
router.put('/:id', protect, admin, categoryController.updateCategory);
router.delete('/:id', protect, admin, categoryController.deleteCategory);
router.post('/reorder', protect, admin, categoryController.reorderCategories);

export default router;
