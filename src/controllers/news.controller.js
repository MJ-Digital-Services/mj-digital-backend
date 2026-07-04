import { asyncHandler } from '../utils/asyncHandler.js';
import * as newsService from '../services/news.service.js';

export const getAllNews = asyncHandler(async (req, res) => {
  const result = await newsService.getAllNews(req.query);
  res.status(200).json({ success: true, data: result });
});

export const getNewsBySlug = asyncHandler(async (req, res) => {
  const item = await newsService.getNewsBySlug(req.params.slug);
  res.status(200).json({ success: true, data: item });
});

export const getNewsById = asyncHandler(async (req, res) => {
  const item = await newsService.getNewsById(req.params.id);
  res.status(200).json({ success: true, data: item });
});

export const createNews = asyncHandler(async (req, res) => {
  const item = await newsService.createNews(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'News article created successfully', data: item });
});

export const updateNews = asyncHandler(async (req, res) => {
  const item = await newsService.updateNews(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'News article updated successfully', data: item });
});

export const deleteNews = asyncHandler(async (req, res) => {
  await newsService.deleteNews(req.params.id);
  res.status(200).json({ success: true, message: 'News article deleted successfully' });
});