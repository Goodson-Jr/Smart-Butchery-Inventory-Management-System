const { request, app, tokenFor, auth, createProduct } = require('./helpers');

describe('stock-in', () => {
  let adminToken;
  let cashierToken;

  beforeAll(async () => {
    adminToken = await tokenFor('admin', 'admin123');
    cashierToken = await tokenFor('cashier', 'cashier123');
  });

  test('admin adding stock increases stock_kg by exactly the amount added', async () => {
    const product = await createProduct(adminToken, { name: 'Stock-In Base', stock_kg: 10 });
    expect(Number(product.stock_kg)).toBe(10);

    const res = await request(app)
      .post('/api/stock-batches')
      .set(auth(adminToken))
      .send({ product_id: product.id, quantity_kg: 7.5 });
    expect(res.status).toBe(201);

    const after = (await request(app).get('/api/products').set(auth(adminToken))).body.find(
      (p) => p.id === product.id
    );
    expect(Number(after.stock_kg)).toBeCloseTo(17.5, 3);
  });

  test('a cashier cannot add stock', async () => {
    const product = await createProduct(adminToken, { name: 'Cashier Stock Attempt' });
    const res = await request(app)
      .post('/api/stock-batches')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 5 });
    expect(res.status).toBe(403);
  });

  test('stock-in rejects a non-positive quantity', async () => {
    const product = await createProduct(adminToken, { name: 'Negative Stock Attempt' });
    const res = await request(app)
      .post('/api/stock-batches')
      .set(auth(adminToken))
      .send({ product_id: product.id, quantity_kg: -5 });
    expect(res.status).toBe(400);
  });

  test('stock-in for a non-existent product returns 404', async () => {
    const res = await request(app)
      .post('/api/stock-batches')
      .set(auth(adminToken))
      .send({ product_id: 99999999, quantity_kg: 5 });
    expect(res.status).toBe(404);
  });
});
