import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import blogRoutes from './routes/blog.routes.js';
import categoryRoutes from './routes/category.routes.js';
import contentRoutes from './routes/content.routes.js';
import { protect } from './middlewares/auth.js';
import { restrictTo } from './middlewares/auth.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'MJ Digital API running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/admin/content', contentRoutes);
app.use('/api/v1/admin/blogs', blogRoutes);
app.use('/api/v1/admin/categories', categoryRoutes);

app.use(errorHandler);

export default app;