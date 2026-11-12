import request from 'supertest';
import { app } from '../../src/app.js';
import '../helpers/testSetup.js';

describe('GET /', () => {
  it('should return welcome message', async () => {
    const res = await request(app)
      .get('/')
      .expect(200);
    
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('API RESTful avec Node.js et Express');
  });
});