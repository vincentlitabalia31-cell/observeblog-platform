import { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';
import Post from '../models/Post';
import User from '../models/User';

export interface PublicPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  coverImage?: string;
  author: string;
  authorId: string;
  category: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  featured: boolean;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  bio: string;
  affiliation: string;
  createdAt: string;
}

function serializePost(post: any): PublicPost {
  return {
    id: post._id.toString(),
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    slug: post.slug,
    coverImage: post.coverImage || undefined,
    author: post.author,
    authorId: post.authorId?.toString(),
    category: post.category || post.topics?.[0] || 'Campus Life',
    tags: post.tags?.length ? post.tags : post.topics || [],
    status: post.status || (post.published ? 'published' : 'draft'),
    featured: !!post.featured,
    published: !!post.published,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : undefined,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };
}

function serializeProfile(user: any): PublicProfile {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'user',
    bio: user.bio || '',
    affiliation: user.affiliation || '',
    createdAt: user.createdAt.toISOString()
  };
}

export async function getRecentPosts(limit = 8): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find({ $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }] })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return posts.map(serializePost);
}

export async function getFeaturedPosts(limit = 3): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find({ status: 'published', published: true, featured: true })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return posts.map(serializePost);
}

export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  if (!process.env.MONGODB_URI) return null;
  await connectToDatabase();
  const post = await Post.findOne({
    slug,
    $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }]
  }).lean();
  return post ? serializePost(post) : null;
}

export async function getAllPublicPosts(): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find({ $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }] })
    .sort({ publishedAt: -1 })
    .lean();
  return posts.map(serializePost);
}

export async function getPostsByCategory(category: string): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find({
    $and: [
      { $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }] },
      {
        $or: [
          { category: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { topics: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        ]
      }
    ]
  })
    .sort({ publishedAt: -1 })
    .lean();
  return posts.map(serializePost);
}

export async function getArchiveData() {
  const posts = await getAllPublicPosts();
  const categories = Array.from(new Set(posts.map((post) => post.category))).sort();
  return { posts, categories };
}

export async function getProfileWithPosts(id: string) {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const user = await User.findById(id).lean();
  if (!user) return null;
  const posts = await Post.find({
    authorId: id,
    $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }]
  })
    .sort({ publishedAt: -1 })
    .lean();
  return { profile: serializeProfile(user), posts: posts.map(serializePost) };
}

export async function getPostsForAuthor(authorId: string): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(authorId)) return [];
  await connectToDatabase();
  const posts = await Post.find({ authorId }).sort({ updatedAt: -1 }).lean();
  return posts.map(serializePost);
}

export async function getEditablePost(id: string, userId: string, role: 'user' | 'admin'): Promise<PublicPost | null> {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const post = await Post.findById(id).lean();
  if (!post) return null;
  const serialized = serializePost(post);
  if (role !== 'admin' && serialized.authorId !== userId) return null;
  return serialized;
}

export async function getAdminData() {
  if (!process.env.MONGODB_URI) return { posts: [], users: [] };
  await connectToDatabase();
  const [posts, users] = await Promise.all([
    Post.find({}).sort({ updatedAt: -1 }).limit(100).lean(),
    User.find({}).sort({ createdAt: -1 }).select('-password').limit(100).lean()
  ]);

  return {
    posts: posts.map(serializePost),
    users: users.map(serializeProfile)
  };
}
