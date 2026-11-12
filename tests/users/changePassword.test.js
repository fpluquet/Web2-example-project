import request from 'supertest';
import { app } from '../../src/app.js';
import { 
  createTestUser, 
  attemptLogin, 
  changePassword, 
  expectSuccessResponse, 
  expectErrorResponse 
} from '../helpers/testHelpers.js';
import '../helpers/testSetup.js';

describe('PUT /api/users/change-password', () => {
  let authToken;
  let userId;
  
  beforeEach(async () => {
    const user = await createTestUser();
    authToken = user.token;
    userId = user.userId;
  });

  it('should change password successfully', async () => {
    const changePasswordData = {
      currentPassword: 'Password123',
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456'
    };

    const res = await changePassword(authToken, changePasswordData).expect(200);
    expectSuccessResponse(res, 'Mot de passe modifié avec succès');

    // Vérifier que l'ancien mot de passe ne fonctionne plus
    const loginRes = await attemptLogin('test@example.com', 'Password123').expect(401);
    expectErrorResponse(loginRes);

    // Vérifier que le nouveau mot de passe fonctionne
    const newLoginRes = await attemptLogin('test@example.com', 'NewPassword456').expect(200);
    expectSuccessResponse(newLoginRes);
  });

  it('should not change password with wrong current password', async () => {
    const changePasswordData = {
      currentPassword: 'WrongPassword',
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456'
    };

    const res = await changePassword(authToken, changePasswordData).expect(400);
    expectErrorResponse(res);
    expect(res.body).toHaveProperty('message', 'L\'ancien mot de passe est incorrect');
  });

  it('should not change password when new password is same as current', async () => {
    const changePasswordData = {
      currentPassword: 'Password123',
      newPassword: 'Password123',
      confirmPassword: 'Password123'
    };

    const res = await changePassword(authToken, changePasswordData).expect(400);
    expectErrorResponse(res);
    expect(res.body).toHaveProperty('message', 'Le nouveau mot de passe doit être différent de l\'ancien');
  });

  it('should not change password with invalid new password', async () => {
    const changePasswordData = {
      currentPassword: 'Password123',
      newPassword: '123', // Trop court
      confirmPassword: '123'
    };

    const res = await changePassword(authToken, changePasswordData).expect(400);
    expectErrorResponse(res, true);
  });

  it('should not change password when passwords do not match', async () => {
    const changePasswordData = {
      currentPassword: 'Password123',
      newPassword: 'NewPassword456',
      confirmPassword: 'DifferentPassword789'
    };

    const res = await changePassword(authToken, changePasswordData).expect(400);
    expectErrorResponse(res, true);
  });

  it('should not change password without authentication', async () => {
    const changePasswordData = {
      currentPassword: 'Password123',
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456'
    };

    const res = await request(app)
      .put('/api/users/change-password')
      .send(changePasswordData)
      .expect(401);

    expectErrorResponse(res);
  });

  it('should not change password with missing fields', async () => {
    const changePasswordData = {
      newPassword: 'NewPassword456',
      confirmPassword: 'NewPassword456'
      // currentPassword manquant
    };

    const res = await changePassword(authToken, changePasswordData).expect(400);
    expectErrorResponse(res, true);
  });
});