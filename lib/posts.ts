import { Types } from 'mongoose';
import { connectToDatabase } from './mongodb';
import Post from '../models/Post';
import User from '../models/User';
import Comment from '../models/Comment';
import PostInteraction from '../models/PostInteraction';
import NewsletterSubscriber from '../models/NewsletterSubscriber';
import { getRoleForUser } from './roles';

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
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'returned';
  adminNotes?: string;
  featured: boolean;
  published: boolean;
  publishedAt?: string;
  reviewedAt?: string;
  rejectedAt?: string;
  returnedAt?: string;
  featuredAt?: string;
  statusChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  email: string;
  role: 'contributor' | 'admin';
  bio: string;
  affiliation: string;
  suspended: boolean;
  createdAt: string;
}

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  name?: string;
  frequency: 'immediate' | 'daily' | 'weekly';
  active: boolean;
  createdAt: string;
}

export interface PublicComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface AdminData {
  posts: PublicPost[];
  users: PublicProfile[];
  subscribers: NewsletterSubscriberRow[];
  comments: PublicComment[];
  stats: {
    totalPosts: number;
    pendingPosts: number;
    publishedPosts: number;
    rejectedPosts: number;
    totalUsers: number;
    totalComments: number;
    pendingComments: number;
    subscribers: number;
  };
}

function normalizePostStatus(post: any): PublicPost['status'] {
  if (['draft', 'pending', 'published', 'rejected', 'returned'].includes(post.status)) {
    return post.status;
  }

  return post.published ? 'published' : 'draft';
}

function serializePost(post: any): PublicPost {
  const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
  const updatedAt = post.updatedAt ? new Date(post.updatedAt) : createdAt;

  return {
    id: post._id.toString(),
    title: post.title || 'Untitled essay',
    excerpt: post.excerpt || '',
    content: post.content || '',
    slug: post.slug || post._id.toString(),
    coverImage: post.coverImage || undefined,
    author: post.author || 'Unknown author',
    authorId: post.authorId?.toString(),
    category: post.category || post.topics?.[0] || 'Campus Life',
    tags: post.tags?.length ? post.tags : post.topics || [],
    status: normalizePostStatus(post),
    adminNotes: post.adminNotes || undefined,
    featured: !!post.featured,
    published: !!post.published,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    reviewedAt: post.reviewedAt ? new Date(post.reviewedAt).toISOString() : undefined,
    rejectedAt: post.rejectedAt ? new Date(post.rejectedAt).toISOString() : undefined,
    returnedAt: post.returnedAt ? new Date(post.returnedAt).toISOString() : undefined,
    featuredAt: post.featuredAt ? new Date(post.featuredAt).toISOString() : undefined,
    statusChangedAt: post.statusChangedAt ? new Date(post.statusChangedAt).toISOString() : undefined,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString()
  };
}

function serializeComment(comment: any): PublicComment {
  return {
    id: comment._id.toString(),
    postId: comment.postId?.toString(),
    authorId: comment.authorId?.toString(),
    authorName: comment.authorName,
    body: comment.body,
    parentId: comment.parentId?.toString(),
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}

function serializeProfile(user: any): PublicProfile {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'contributor',
    bio: user.bio || '',
    affiliation: user.affiliation || '',
    suspended: !!user.suspended,
    createdAt: user.createdAt.toISOString()
  };
}

/** Public visibility: published flag AND status (legacy posts included). */
export const publicPostVisibilityFilter = {
  $or: [{ status: 'published', published: true }, { status: { $exists: false }, published: true }]
};

export async function getRecentPosts(limit = 8): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find(publicPostVisibilityFilter)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return posts.map(serializePost);
}

export async function getFeaturedPosts(limit = 3): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find({ ...publicPostVisibilityFilter, featured: true })
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
    ...publicPostVisibilityFilter
  }).lean();
  return post ? serializePost(post) : null;
}

export async function getAllPublicPosts(): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find(publicPostVisibilityFilter).sort({ publishedAt: -1 }).lean();
  return posts.map(serializePost);
}

export async function searchPublicPosts(query: string): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  const cleanQuery = query.trim();
  if (!cleanQuery) return getAllPublicPosts();
  await connectToDatabase();
  const expression = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const posts = await Post.find({
    $and: [
      publicPostVisibilityFilter,
      {
        $or: [
          { title: expression },
          { excerpt: expression },
          { content: expression },
          { category: expression },
          { tags: expression },
          { author: expression }
        ]
      }
    ]
  })
    .sort({ publishedAt: -1 })
    .limit(50)
    .lean();
  return posts.map(serializePost);
}

export async function getPostsByCategory(category: string): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI) return [];
  await connectToDatabase();
  const posts = await Post.find({
    $and: [
      publicPostVisibilityFilter,
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
    ...publicPostVisibilityFilter
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

export async function getBookmarkedPostsForUser(userId: string): Promise<PublicPost[]> {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(userId)) return [];
  await connectToDatabase();
  const bookmarks = await PostInteraction.find({ userId, type: 'bookmark' }).sort({ createdAt: -1 }).lean();
  const ids = bookmarks.map((bookmark) => bookmark.postId);
  if (!ids.length) return [];
  const posts = await Post.find({
    _id: { $in: ids },
    ...publicPostVisibilityFilter
  }).lean();
  return posts.map(serializePost);
}

export async function getPostEngagement(postId: string, userId?: string) {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(postId)) {
    return { likes: 0, bookmarks: 0, liked: false, bookmarked: false };
  }
  await connectToDatabase();
  const [likes, bookmarks, mine] = await Promise.all([
    PostInteraction.countDocuments({ postId, type: 'like' }),
    PostInteraction.countDocuments({ postId, type: 'bookmark' }),
    userId && Types.ObjectId.isValid(userId)
      ? PostInteraction.find({ postId, userId }).select('type').lean()
      : Promise.resolve([])
  ]);
  const types = new Set(mine.map((item: any) => item.type));
  return { likes, bookmarks, liked: types.has('like'), bookmarked: types.has('bookmark') };
}

export async function getApprovedComments(postId: string): Promise<PublicComment[]> {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(postId)) return [];
  await connectToDatabase();
  const comments = await Comment.find({ postId, status: 'approved' }).sort({ createdAt: 1 }).lean();
  return comments.map(serializeComment);
}

export async function getEditablePost(id: string, userId: string, role: 'contributor' | 'admin'): Promise<PublicPost | null> {
  if (!process.env.MONGODB_URI || !Types.ObjectId.isValid(id)) return null;
  await connectToDatabase();
  const post = await Post.findById(id).lean();
  if (!post) return null;
  const serialized = serializePost(post);
  if (role !== 'admin' && serialized.authorId !== userId) return null;
  if (role !== 'admin' && !['draft', 'returned'].includes(serialized.status)) return null;
  return serialized;
}

export async function getAdminData(): Promise<AdminData> {
  if (!process.env.MONGODB_URI) {
    return {
      posts: [],
      users: [],
      subscribers: [],
      comments: [],
      stats: {
        totalPosts: 0,
        pendingPosts: 0,
        publishedPosts: 0,
        rejectedPosts: 0,
        totalUsers: 0,
        totalComments: 0,
        pendingComments: 0,
        subscribers: 0
      }
    };
  }
  await connectToDatabase();
  const [reviewPosts, recentPosts, users, newsletterRows, comments, totalPosts, pendingPosts, publishedPosts, rejectedPosts, totalUsers, totalComments, pendingComments, subscribers] =
    await Promise.all([
    Post.find({ status: { $in: ['pending', 'returned'] } }).sort({ updatedAt: -1 }).limit(60).lean(),
    Post.find({ status: { $nin: ['pending', 'returned'] } }).sort({ updatedAt: -1 }).limit(40).lean(),
    User.find({}).sort({ createdAt: -1 }).select('-password').limit(100).lean(),
    NewsletterSubscriber.find({}).sort({ createdAt: -1 }).limit(100).lean(),
    Comment.find({}).sort({ updatedAt: -1 }).limit(100).lean(),
    Post.countDocuments({}),
    Post.countDocuments({ status: 'pending' }),
    Post.countDocuments({ status: 'published', published: true }),
    Post.countDocuments({ status: 'rejected' }),
    User.countDocuments({}),
    Comment.countDocuments({}),
    Comment.countDocuments({ status: 'pending' }),
    NewsletterSubscriber.countDocuments({ active: true })
  ]);
  const posts = [...reviewPosts, ...recentPosts];

  const profiles = await Promise.all(
    users.map(async (user) => {
      const profile = serializeProfile(user);
      return { ...profile, role: await getRoleForUser(profile.id, profile.email) };
    })
  );

  return {
    posts: posts.map(serializePost),
    users: profiles,
    subscribers: newsletterRows.map((row: any) => ({
      id: row._id.toString(),
      email: row.email,
      name: row.name || undefined,
      frequency: ['immediate', 'daily', 'weekly'].includes(row.frequency) ? row.frequency : 'weekly',
      active: !!row.active,
      createdAt: row.createdAt.toISOString()
    })),
    comments: comments.map(serializeComment),
    stats: {
      totalPosts,
      pendingPosts,
      publishedPosts,
      rejectedPosts,
      totalUsers,
      totalComments,
      pendingComments,
      subscribers
    }
  };
}
