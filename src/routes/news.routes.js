import express from 'express';
import {
  getAllNews, getNewsBySlug, getNewsById,
  createNews, updateNews, deleteNews,
} from '../controllers/news.controller.js';
import { protect, restrictTo } from '../middlewares/auth.js';

const router = express.Router();

// Public
router.get('/', getAllNews);
router.get('/id/:id', getNewsById);
router.get('/:slug', getNewsBySlug);

// Admin only
router.use(protect);
router.use(restrictTo('admin', 'editor'));
router.post('/', createNews);
router.patch('/:id', updateNews);
router.delete('/:id', deleteNews);

export default router;