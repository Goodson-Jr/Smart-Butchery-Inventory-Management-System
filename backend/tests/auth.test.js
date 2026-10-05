const { request, app, tokenFor, auth } = require('./helpers');

describe('auth', () => {
  test('login with correct credentials returns a token and role', async () => {
    const res = await request(app).post('/api/login').send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.role).toBe('admin');
  });

  test('login with wrong password is rejected', async () => {
    const res = await request(app).post('/api/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('login with unknown username is rejected', async () => {
    const res = await request(app).post('/api/login').send({ username: 'nobody', password: 'whatever' });
    expect(res.status).toBe(401);
  });

  test('a protected route rejects a request with no token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
  });

  test('a protected route rejects a garbage token', async () => {
    const res = await request(app).get('/api/products').set(auth('not-a-real-token'));
    expect(res.status).toBe(401);
  });

  test('an admin-only route rejects a cashier with a valid token', async () => {
    const cashierToken = await tokenFor('cashier', 'cashier123');
    const res = await request(app)
      .post('/api/stock-batches')
      .set(auth(cashierToken))
      .send({ product_id: 1, quantity_kg: 1 });
    expect(res.status).toBe(403);
  });
});
