const { request, app, tokenFor, auth, createProduct } = require('./helpers');

describe('products & categories', () => {
  let adminToken;
  let cashierToken;

  beforeAll(async () => {
    adminToken = await tokenFor('admin', 'admin123');
    cashierToken = await tokenFor('cashier', 'cashier123');
  });

  test('GET /products includes category_name via the join, not just category_id', async () => {
    const product = await createProduct(adminToken, { name: 'Category Join Test' });
    expect(product.category_name).toEqual(expect.any(String));
    expect(product.category_name.length).toBeGreaterThan(0);
  });

  test('creating a product rejects a non-positive price', async () => {
    const categories = await request(app).get('/api/categories').set(auth(adminToken));
    const res = await request(app)
      .post('/api/products')
      .set(auth(adminToken))
      .send({ category_id: categories.body[0].id, name: 'Bad Price', price_per_kg: 0 });
    expect(res.status).toBe(400);
  });

  test('creating a product rejects an unknown category_id', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(auth(adminToken))
      .send({ category_id: 999999, name: 'Orphan', price_per_kg: 50 });
    expect(res.status).toBe(400);
  });

  test('a cashier cannot create a product', async () => {
    const categories = await request(app).get('/api/categories').set(auth(cashierToken));
    const res = await request(app)
      .post('/api/products')
      .set(auth(cashierToken))
      .send({ category_id: categories.body[0].id, name: 'Should Fail', price_per_kg: 50 });
    expect(res.status).toBe(403);
  });

  test('two products cannot share a barcode', async () => {
    const barcode = `bc-${Date.now()}`;
    await createProduct(adminToken, { name: 'First Barcode Owner', barcode });

    const categories = await request(app).get('/api/categories').set(auth(adminToken));
    const res = await request(app)
      .post('/api/products')
      .set(auth(adminToken))
      .send({ category_id: categories.body[0].id, name: 'Second Barcode Claimant', price_per_kg: 50, barcode });
    expect(res.status).toBe(409);
  });

  test('deactivating a product hides it from the default list but not from ?all=true', async () => {
    const product = await createProduct(adminToken, { name: 'Soft Delete Test' });

    const deactivate = await request(app)
      .put(`/api/products/${product.id}`)
      .set(auth(adminToken))
      .send({ is_active: false });
    expect(deactivate.status).toBe(204);

    const defaultList = await request(app).get('/api/products').set(auth(adminToken));
    expect(defaultList.body.find((p) => p.id === product.id)).toBeUndefined();

    const allList = await request(app).get('/api/products?all=true').set(auth(adminToken));
    const found = allList.body.find((p) => p.id === product.id);
    expect(found).toBeDefined();
    expect(found.is_active).toBe(0);
  });

  test('a cashier using ?all=true still only sees active products', async () => {
    const product = await createProduct(adminToken, { name: 'Cashier All Param Test' });
    await request(app).put(`/api/products/${product.id}`).set(auth(adminToken)).send({ is_active: false });

    const res = await request(app).get('/api/products?all=true').set(auth(cashierToken));
    expect(res.body.find((p) => p.id === product.id)).toBeUndefined();
  });
});
