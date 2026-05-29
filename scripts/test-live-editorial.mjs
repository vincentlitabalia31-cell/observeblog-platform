const base = 'https://observeblog-platform.vercel.app';

async function req(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 120) };
}

const checks = [
  ['GET', '/', null, 200],
  ['GET', '/posts', null, 200],
  ['GET', '/search?q=essay', null, 200],
  ['GET', '/archive', null, 200],
  ['GET', '/api/posts', null, 200],
  ['PATCH', '/api/admin/posts/507f1f77bcf86cd799439011', { action: 'publish' }, 401],
  ['DELETE', '/api/admin/subscribers/507f1f77bcf86cd799439011', null, 401],
  ['PATCH', '/api/admin/users/507f1f77bcf86cd799439011', { action: 'suspend' }, 401],
  ['POST', '/api/posts', { title: 't', excerpt: 'e', content: 'c' }, 401]
];

let failed = 0;
for (const [method, path, body, expect] of checks) {
  const { status, text } = await req(method, path, body);
  const ok = status === expect;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${method} ${path} -> ${status} (expected ${expect}) ${text}`);
}

const home = await fetch(base);
const html = await home.text();
const hasFeatured = /featured|Featured/i.test(html);
console.log(`Homepage loaded (${html.length} bytes), featured markup present: ${hasFeatured}`);
process.exit(failed ? 1 : 0);
