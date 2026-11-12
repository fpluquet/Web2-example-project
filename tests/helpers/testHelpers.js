import request from 'supertest';
import { app } from '../../src/app.js';

// Helper functions for creating test requests
export const createTestUser = async () => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123'
  };

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  return {
    token: registerRes.body.data.token,
    userId: registerRes.body.data.user.id
  };
};

export const attemptLogin = (email, password) => {
  return request(app)
    .post('/api/auth/login')
    .send({ email, password });
};

export const changePassword = (token, passwordData) => {
  return request(app)
    .put('/api/users/change-password')
    .set('Authorization', `Bearer ${token}`)
    .send(passwordData);
};

// Helper functions for assertions
export const expectSuccessResponse = (response, message = null) => {
  expect(response.body).toHaveProperty('success', true);
  if (message) {
    expect(response.body).toHaveProperty('message', message);
  }
};

export const expectErrorResponse = (response, hasErrors = false) => {
  expect(response.body).toHaveProperty('success', false);
  if (hasErrors) {
    expect(response.body).toHaveProperty('errors');
  }
};