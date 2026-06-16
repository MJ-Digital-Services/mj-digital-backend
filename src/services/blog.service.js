import Blog from '../models/Blog.js';
import Category from '../models/Category.js';
import { config } from '../config/environment.js';

const getPublicUrl = (key) => {
  if (!key) return null;
  if (key.startsWith('http')) return key;
  return `${config.r2.publicUrl}/${key}`;
};

export const getAllBlogs = async (filters = {}) => {
  const query = {};
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 6;
  const skip = (page - 1) * limit;

  if (filters.isPublished !== undefined) {
    query.isPublished = filters.isPublished === 'true';
  }

  if (filters.category && filters.category !== 'all') {
    const cat = await Category.findOne({ slug: filters.category, isActive: true });
    if (cat) {
      query.category = cat._id;
    } else {
      return { blogs: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
  }

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { excerpt: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .populate('createdBy', 'name email')
      .populate('category', 'name slug')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-relatedPosts')
      .lean(),
    Blog.countDocuments(query),
  ]);

  const resolvedBlogs = blogs.map((blog) => ({
    ...blog,
    coverImage: getPublicUrl(blog.coverImage),
  }));

  return {
    blogs: resolvedBlogs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getBlogBySlug = async (slug) => {
  const blog = await Blog.findOne({ slug, isPublished: true })
    .populate('createdBy', 'name email')
    .populate('category', 'name slug')
    .populate({
      path: 'relatedPosts',
      select: 'title slug coverImage',
      match: { isPublished: true },
    })
    .lean();

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...blog,
    coverImage: getPublicUrl(blog.coverImage),
    relatedPosts: (blog.relatedPosts || [])
      .filter(Boolean)
      .map((p) => ({ ...p, coverImage: getPublicUrl(p.coverImage) })),
  };
};

export const getBlogById = async (blogId) => {
  const blog = await Blog.findById(blogId)
    .populate('createdBy', 'name email')
    .populate('category', 'name slug')
    .populate({
      path: 'relatedPosts',
      select: 'title slug excerpt coverImage publishedAt category',
    });

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  return blog;
};

export const createBlog = async (data, userId) => {
  if (!data.title || !data.slug || !data.excerpt || !data.category) {
    const error = new Error('Title, slug, excerpt and category are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Blog.findOne({ slug: data.slug });
  if (existing) {
    const error = new Error('Blog with this slug already exists');
    error.statusCode = 409;
    throw error;
  }

  const publishedAt = data.isPublished ? new Date() : null;

  const blog = await Blog.create({
    ...data,
    publishedAt,
    createdBy: userId,
  });

  return blog;
};

export const updateBlog = async (blogId, data) => {
  const blog = await Blog.findById(blogId);

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  if (data.slug && data.slug !== blog.slug) {
    const existing = await Blog.findOne({ slug: data.slug });
    if (existing) {
      const error = new Error('Blog with this slug already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  if (data.isPublished && !blog.isPublished) {
    data.publishedAt = new Date();
  }

  Object.assign(blog, data);
  await blog.save();

  return blog;
};

export const deleteBlog = async (blogId) => {
  const blog = await Blog.findById(blogId);

  if (!blog) {
    const error = new Error('Blog not found');
    error.statusCode = 404;
    throw error;
  }

  await blog.deleteOne();
  return blog;
};

export const getBlogsGroupedByCategory = async () => {
  const categories = await Category.find({ isActive: true })
    .sort({ order: 1 })
    .lean();

  const grouped = await Promise.all(
    categories.map(async (cat) => {
      const blogs = await Blog.find({ category: cat._id, isPublished: true })
        .sort({ publishedAt: -1 })
        .limit(6)
        .populate('createdBy', 'name')
        .select('title slug excerpt coverImage publishedAt tags readTime')
        .lean();

      const resolvedBlogs = blogs.map((blog) => ({
        ...blog,
        coverImage: getPublicUrl(blog.coverImage),
      }));

      return { category: cat, blogs: resolvedBlogs };
    })
  );

  return grouped.filter((g) => g.blogs.length > 0);
};