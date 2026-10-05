const request = require('supertest');
const app = require('../src/app');

async function login(username, password) {
  const res = await request(app).post('/api/login').send({ username, password });
  return res;
}

async function tokenFor(username, password) {
  const res = await login(username, password);
  if (res.status !== 200) {
    throw new Error(`login as ${username} failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// Creates a fresh product via the real API (as admin) so stock-mutating
// tests never share rows with other test files. Returns the full product
// as GET /products would show it.
async function createProduct(adminToken, overrides = {}) {
  const categories = await request(app).get('/api/categories').set(auth(adminToken));
  const categoryId = overrides.category_id || categories.body[0].id;

  const body = {
    ...overrides,
    category_id: categoryId,
    name: overrides.name || `Test Product ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    price_per_kg: overrides.price_per_kg ?? 100,
  };

  const created = await request(app).post('/api/products').set(auth(adminToken)).send(body);
  if (created.status !== 201) {
    throw new Error(`createProduct failed: ${created.status} ${JSON.stringify(created.body)}`);
  }

  if (overrides.stock_kg) {
    const stocked = await request(app)
      .post('/api/stock-batches')
      .set(auth(adminToken))
      .send({ product_id: created.body.id, quantity_kg: overrides.stock_kg });
    if (stocked.status !== 201) {
      throw new Error(`createProduct stock-in failed: ${stocked.status} ${JSON.stringify(stocked.body)}`);
    }
  }

  const products = await request(app).get('/api/products').set(auth(adminToken));
  return products.body.find((p) => p.id === created.body.id);
}

module.exports = { app, request, login, tokenFor, auth, createProduct };
