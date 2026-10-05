const { request, app, tokenFor, auth, createProduct } = require('./helpers');

async function stockOf(token, productId) {
  const res = await request(app).get('/api/products').set(auth(token));
  return Number(res.body.find((p) => p.id === productId).stock_kg);
}

describe('wastage approval workflow', () => {
  let adminToken;
  let cashierToken;

  beforeAll(async () => {
    adminToken = await tokenFor('admin', 'admin123');
    cashierToken = await tokenFor('cashier', 'cashier123');
  });

  test('a cashier report is PENDING and stock is unchanged until approved', async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Pending Test', stock_kg: 10 });

    const report = await request(app)
      .post('/api/wastage')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 2, reason: 'SPOILAGE' });

    expect(report.status).toBe(201);
    expect(report.body.status).toBe('PENDING');
    expect(await stockOf(adminToken, product.id)).toBe(10);
  });

  test("an admin's own report is approved immediately and deducts stock straight away", async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Admin Auto-Approve Test', stock_kg: 10 });

    const report = await request(app)
      .post('/api/wastage')
      .set(auth(adminToken))
      .send({ product_id: product.id, quantity_kg: 3, reason: 'TRIM' });

    expect(report.body.status).toBe('APPROVED');
    expect(await stockOf(adminToken, product.id)).toBe(7);
  });

  test('a cashier cannot approve a report, including their own', async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Cashier Approve Attempt', stock_kg: 10 });
    const report = await request(app)
      .post('/api/wastage')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 1, reason: 'OTHER' });

    const res = await request(app).post(`/api/wastage/${report.body.id}/approve`).set(auth(cashierToken));
    expect(res.status).toBe(403);
  });

  test('approving a pending report deducts stock exactly once; approving again is rejected', async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Double Approve Test', stock_kg: 10 });
    const report = await request(app)
      .post('/api/wastage')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 4, reason: 'EXPIRY' });

    const first = await request(app).post(`/api/wastage/${report.body.id}/approve`).set(auth(adminToken));
    expect(first.status).toBe(200);
    expect(await stockOf(adminToken, product.id)).toBe(6);

    const second = await request(app).post(`/api/wastage/${report.body.id}/approve`).set(auth(adminToken));
    expect(second.status).toBe(409);
    expect(await stockOf(adminToken, product.id)).toBe(6); // unchanged by the second attempt
  });

  test('rejecting a pending report leaves stock completely untouched', async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Reject Test', stock_kg: 10 });
    const report = await request(app)
      .post('/api/wastage')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 2, reason: 'OTHER' });

    const res = await request(app)
      .post(`/api/wastage/${report.body.id}/reject`)
      .set(auth(adminToken))
      .send({ rejection_reason: 'Looked fine to me' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(await stockOf(adminToken, product.id)).toBe(10);
  });

  test('approval is refused if stock has since sold below the wasted amount', async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Sold-Out-From-Under Test', stock_kg: 5 });
    const report = await request(app)
      .post('/api/wastage')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 4, reason: 'SPOILAGE' });

    // Almost all of it gets sold before a manager gets to the approval.
    await request(app).post('/api/sales').set(auth(adminToken)).send({ product_id: product.id, quantity_kg: 4 });
    expect(await stockOf(adminToken, product.id)).toBe(1);

    const approve = await request(app).post(`/api/wastage/${report.body.id}/approve`).set(auth(adminToken));
    expect(approve.status).toBe(409);
    expect(await stockOf(adminToken, product.id)).toBe(1); // untouched by the failed approval
  });

  test('a cashier only sees their own reports; an admin sees everyone\'s', async () => {
    const product = await createProduct(adminToken, { name: 'Wastage Visibility Test', stock_kg: 10 });
    await request(app)
      .post('/api/wastage')
      .set(auth(cashierToken))
      .send({ product_id: product.id, quantity_kg: 1, reason: 'OTHER' });

    const cashierView = await request(app).get('/api/wastage').set(auth(cashierToken));
    expect(cashierView.body.every((w) => w.recorded_by_username === 'cashier')).toBe(true);

    const adminView = await request(app).get('/api/wastage').set(auth(adminToken));
    expect(adminView.body.length).toBeGreaterThanOrEqual(cashierView.body.length);
  });
});
