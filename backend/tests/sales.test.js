const { request, app, tokenFor, auth, createProduct } = require('./helpers');

async function stockOf(token, productId) {
  const res = await request(app).get('/api/products').set(auth(token));
  return Number(res.body.find((p) => p.id === productId).stock_kg);
}

describe('sales', () => {
  let adminToken;

  beforeAll(async () => {
    adminToken = await tokenFor('admin', 'admin123');
  });

  describe('single sale (POST /sales)', () => {
    test('a normal sale deducts exactly the quantity sold and returns the correct total', async () => {
      const product = await createProduct(adminToken, { name: 'Single Sale Base', price_per_kg: 120, stock_kg: 20 });

      const res = await request(app)
        .post('/api/sales')
        .set(auth(adminToken))
        .send({ product_id: product.id, quantity_kg: 2.5 });

      expect(res.status).toBe(201);
      expect(Number(res.body.total_price)).toBeCloseTo(300, 2); // 2.5 * 120

      const after = await stockOf(adminToken, product.id);
      expect(after).toBeCloseTo(17.5, 3); // 20 - 2.5
    });

    test('selling more than is in stock is rejected and changes nothing', async () => {
      const product = await createProduct(adminToken, { name: 'Oversell Test', stock_kg: 5 });

      const res = await request(app)
        .post('/api/sales')
        .set(auth(adminToken))
        .send({ product_id: product.id, quantity_kg: 9999 });
      expect(res.status).toBe(409);

      const after = await stockOf(adminToken, product.id);
      expect(after).toBe(5);
    });

    test('a sale for an unknown product returns 404', async () => {
      const res = await request(app)
        .post('/api/sales')
        .set(auth(adminToken))
        .send({ product_id: 99999999, quantity_kg: 1 });
      expect(res.status).toBe(404);
    });
  });

  describe('batch checkout (POST /sales/batch)', () => {
    test('a multi-item cart deducts every line and returns lines in cart order with a correct grand total', async () => {
      const a = await createProduct(adminToken, { name: 'Batch Item A', price_per_kg: 100, stock_kg: 20 });
      const b = await createProduct(adminToken, { name: 'Batch Item B', price_per_kg: 50, stock_kg: 20 });

      const res = await request(app)
        .post('/api/sales/batch')
        .set(auth(adminToken))
        .send({
          items: [
            { product_id: a.id, quantity_kg: 2 },
            { product_id: b.id, quantity_kg: 3 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.lines).toHaveLength(2);
      expect(res.body.lines[0].product_id).toBe(a.id); // cart order preserved, not sorted-by-id order
      expect(res.body.lines[1].product_id).toBe(b.id);
      expect(Number(res.body.grand_total)).toBeCloseTo(2 * 100 + 3 * 50, 2);

      expect(await stockOf(adminToken, a.id)).toBeCloseTo(18, 3);
      expect(await stockOf(adminToken, b.id)).toBeCloseTo(17, 3);
    });

    test('if one line in the cart cannot be fulfilled, the ENTIRE cart rolls back -- including lines that would have succeeded', async () => {
      const ok = await createProduct(adminToken, { name: 'Batch Rollback OK Item', stock_kg: 20 });
      const short = await createProduct(adminToken, { name: 'Batch Rollback Short Item', stock_kg: 1 });

      const res = await request(app)
        .post('/api/sales/batch')
        .set(auth(adminToken))
        .send({
          items: [
            { product_id: ok.id, quantity_kg: 5 }, // would succeed on its own
            { product_id: short.id, quantity_kg: 9999 }, // cannot possibly succeed
          ],
        });

      expect(res.status).toBe(409);
      // The first item must NOT have been deducted despite being processed first.
      expect(await stockOf(adminToken, ok.id)).toBe(20);
      expect(await stockOf(adminToken, short.id)).toBe(1);
    });

    test('an empty cart is rejected', async () => {
      const res = await request(app).post('/api/sales/batch').set(auth(adminToken)).send({ items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /sales/today', () => {
    test("today's summary reflects a sale just made and is open to a cashier", async () => {
      const product = await createProduct(adminToken, { name: 'Todays Summary Test', price_per_kg: 10, stock_kg: 50 });
      await request(app).post('/api/sales').set(auth(adminToken)).send({ product_id: product.id, quantity_kg: 4 });

      const cashierToken = await tokenFor('cashier', 'cashier123');
      const res = await request(app).get('/api/sales/today').set(auth(cashierToken));

      expect(res.status).toBe(200);
      expect(Number(res.body.total_kg_sold)).toBeGreaterThanOrEqual(4);
    });
  });
});
