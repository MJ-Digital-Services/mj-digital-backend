import News from '../models/News.js';
import { config } from '../config/environment.js';

const getPublicUrl = (key) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${config.r2.publicUrl}/${key}`;
};

export const getAllNews = async (filters = {}) => {
  const query = {};
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 6;
  const skip = (page - 1) * limit;

  if (filters.isPublished !== undefined) {
    query.isPublished = filters.isPublished === 'true';
  }

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { excerpt: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const [news, total] = await Promise.all([
    News.find(query)
      .populate('createdBy', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-relatedPosts')
      .lean(),
    News.countDocuments(query),
  ]);

  const resolvedNews = news.map((item) => ({
    ...item,
    coverImage: getPublicUrl(item.coverImage),
  }));

  return {
    news: resolvedNews,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getNewsBySlug = async (slug) => {
  const item = await News.findOne({ slug, isPublished: true })
    .populate('createdBy', 'name email')
    .populate({
      path: 'relatedPosts',
      select: 'title slug coverImage',
      match: { isPublished: true },
    })
    .lean();

  if (!item) {
    const error = new Error('News article not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...item,
    coverImage: getPublicUrl(item.coverImage),
    relatedPosts: (item.relatedPosts || [])
      .filter(Boolean)
      .map((p) => ({ ...p, coverImage: getPublicUrl(p.coverImage) })),
  };
};

export const getNewsById = async (newsId) => {
  const item = await News.findById(newsId)
    .populate('createdBy', 'name email')
    .populate({
      path: 'relatedPosts',
      select: 'title slug excerpt coverImage publishedAt',
    });

  if (!item) {
    const error = new Error('News article not found');
    error.statusCode = 404;
    throw error;
  }

  return item;
};

export const createNews = async (data, userId) => {
  if (!data.title || !data.slug || !data.excerpt) {
    const error = new Error('Title, slug and excerpt are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await News.findOne({ slug: data.slug });
  if (existing) {
    const error = new Error('News article with this slug already exists');
    error.statusCode = 409;
    throw error;
  }

  const publishedAt = data.isPublished ? new Date() : null;

  const item = await News.create({
    ...data,
    publishedAt,
    createdBy: userId,
  });

  return item;
};

export const updateNews = async (newsId, data) => {
  const item = await News.findById(newsId);

  if (!item) {
    const error = new Error('News article not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.slug && data.slug !== item.slug) {
    const existing = await News.findOne({ slug: data.slug });
    if (existing) {
      const error = new Error('News article with this slug already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  if (data.isPublished && !item.isPublished) {
    data.publishedAt = new Date();
  }

  Object.assign(item, data);
  await item.save();

  return item;
};

export const deleteNews = async (newsId) => {
  const item = await News.findById(newsId);

  if (!item) {
    const error = new Error('News article not found');
    error.statusCode = 404;
    throw error;
  }

  await item.deleteOne();
  return item;
};