import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/test-reset-flow.mjs <email>');
  process.exit(1);
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/observing-india';
await mongoose.connect(uri);

const token = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const expires = new Date(Date.now() + 60 * 60 * 1000);

await mongoose.connection.collection('users').updateOne(
  { email },
  { $set: { passwordResetToken: tokenHash, passwordResetExpires: expires } }
);

const res = await fetch('http://localhost:3000/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, password: 'BrandNewPass123!' })
});
const data = await res.json();
console.log('reset status', res.status, data);

const user = await mongoose.connection.collection('users').findOne({ email });
const passwordOk = await bcrypt.compare('BrandNewPass123!', user.password);
const tokenCleared = !user.passwordResetToken;

console.log('password updated', passwordOk, 'token cleared', tokenCleared);
await mongoose.disconnect();

if (res.status !== 200 || !passwordOk || !tokenCleared) {
  process.exit(1);
}
