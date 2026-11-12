import request from 'supertest';
import { app } from '../../src/app.js';
import { expectSuccessResponse, expectErrorResponse } from '../helpers/testHelpers.js';
import '../helpers/testSetup.js';

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expectSuccessResponse(res);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(userData.email);
  });

  it('should not register user with invalid email', async () => {
    const userData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'Password123'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(400);

    expectErrorResponse(res, true);
  });
});