const { request, app, tokenFor, auth, createProduct } = require('./helpers');

describe('reports', () => {
  let adminToken;
  let cashierToken;

  beforeAll(async () => {
    adminToken = await tokenFor('admin', 'admin123');
    cashierToken = await tokenFor('cashier', 'cashier123');
  });

  test('all three report endpoints are admin-only', async () => {
    const sales = await request(app).get('/api/reports/sales').set(auth(cashierToken));
    const profit = await request(app).get('/api/reports/profit').set(auth(cashierToken));
    const usage = await request(app).get('/api/reports/stock-usage').set(auth(cashierToken));
    expect(sales.status).toBe(403);
    expect(profit.status).toBe(403);
    expect(usage.status).toBe(403);
  });

  test('an admin gets all three reports successfully, with sane default date ranges', async () => {
    const sales = await request(app).get('/api/reports/sales').set(auth(adminToken));
    const profit = await request(app).get('/api/reports/profit').set(auth(adminToken));
    const usage = await request(app).get('/api/reports/stock-usage').set(auth(adminToken));

    expect(sales.status).toBe(200);
    expect(profit.status).toBe(200);
    expect(usage.status).toBe(200);

    // Default range should be the last 7 days (inclusive), same as the
    // documented behaviour in reportRoutes.js.
    const from = new Date(sales.body.from);
    const to = new Date(sales.body.to);
    const diffDays = Math.round((to - from) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(6);
  });

  test('profit report counts a product with no cost_per_kg in missing_cost_products', async () => {
    await createProduct(adminToken, { name: 'No Cost Product' });
    const res = await request(app).get('/api/reports/profit').set(auth(adminToken));
    expect(res.body.missing_cost_products).toBeGreaterThanOrEqual(1);
  });

  test('a sale made today is reflected in the sales report and the profit report', async () => {
    const product = await createProduct(adminToken, {
      name: 'Report Sale Reflection Test',
      price_per_kg: 100,
      cost_per_kg: 60,
      stock_kg: 10,
    });
    await request(app).post('/api/sales').set(auth(adminToken)).send({ product_id: product.id, quantity_kg: 2 });

    const sales = await request(app).get('/api/reports/sales').set(auth(adminToken));
    const totalRevenue = sales.body.days.reduce((sum, d) => sum + Number(d.revenue), 0);
    expect(totalRevenue).toBeGreaterThanOrEqual(200);

    const profit = await request(app).get('/api/reports/profit').set(auth(adminToken));
    const totalProfit = profit.body.days.reduce((sum, d) => sum + Number(d.estimated_profit), 0);
    // At least this one sale's profit (100-60)*2 = 80 must be in there somewhere.
    expect(totalProfit).toBeGreaterThanOrEqual(80);
  });

  test('stock-usage report shows received/sold/wasted for a product touched today', async () => {
    // No initial stock_kg here -- createProduct would do its own stock-in,
    // which would double-count against the explicit one below.
    const product = await createProduct(adminToken, { name: 'Stock Usage Report Test' });
    await request(app).post('/api/stock-batches').set(auth(adminToken)).send({ product_id: product.id, quantity_kg: 5 });
    await request(app).post('/api/sales').set(auth(adminToken)).send({ product_id: product.id, quantity_kg: 3 });

    const res = await request(app).get('/api/reports/stock-usage').set(auth(adminToken));
    const row = res.body.products.find((p) => p.id === product.id);
    expect(row).toBeDefined();
    expect(Number(row.total_received_kg)).toBeCloseTo(5, 3);
    expect(Number(row.total_sold_kg)).toBeCloseTo(3, 3);
  });
});
