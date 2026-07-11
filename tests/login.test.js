const request = require('supertest');
const app = require('../src/app');
const seed = require('../src/data/seed');

describe('Login API Tests', () => {
  beforeAll(async () => {
    // Seed the database to ensure our users exist
    await seed();
  });

  it('should successfully log in a Customer', async () => {
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        mobile: '9990000001',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('mobile', '9990000001');
    expect(res.body.data.user.roles[0]).toHaveProperty('role', 'customer');
  });

  it('should successfully log in a Shopkeeper', async () => {
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        mobile: '9990000002',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('mobile', '9990000002');
    expect(res.body.data.user.roles[0]).toHaveProperty('role', 'shopkeeper');
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        mobile: '9990000001',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject login for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login/password')
      .send({
        mobile: '0000000000',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(401); // Auth typically returns 401 for bad credentials/user not found
    expect(res.body.success).toBe(false);
  });
});
