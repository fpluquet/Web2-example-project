import request from 'supertest';
import { app } from '../../src/app.js';
import { createTestUser, expectSuccessResponse, expectErrorResponse } from '../helpers/testHelpers.js';
import '../helpers/testSetup.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const createTodo = (token, title) =>
  request(app).post('/api/todos').set(auth(token)).send({ title });

const createOtherUser = async () => {
  const res = await request(app).post('/api/auth/register').send({
    username: 'otheruser',
    email: 'other@example.com',
    password: 'Password123'
  });
  return res.body.data.token;
};

describe('API /api/todos', () => {
  let token;

  beforeEach(async () => {
    ({ token } = await createTestUser());
  });

  it('should refuse access without authentication', async () => {
    const res = await request(app).get('/api/todos').expect(401);
    expectErrorResponse(res);
  });

  it('should start with an empty list', async () => {
    const res = await request(app).get('/api/todos').set(auth(token)).expect(200);
    expectSuccessResponse(res);
    expect(res.body.data).toEqual([]);
  });

  it('should create a todo with a trimmed title', async () => {
    const res = await createTodo(token, '  Acheter du pain  ').expect(201);
    expectSuccessResponse(res);
    expect(res.body.data).toMatchObject({ title: 'Acheter du pain', completed: false });
    expect(res.body.data).toHaveProperty('id');

    const list = await request(app).get('/api/todos').set(auth(token)).expect(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('should reject an empty or too long title', async () => {
    expectErrorResponse(await createTodo(token, '   ').expect(400), true);
    expectErrorResponse(await createTodo(token, 'a'.repeat(201)).expect(400), true);
  });

  it('should update the title and the status', async () => {
    const { body } = await createTodo(token, 'Tâche');
    const id = body.data.id;

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .set(auth(token))
      .send({ title: 'Tâche modifiée', completed: true })
      .expect(200);

    expect(res.body.data).toMatchObject({ title: 'Tâche modifiée', completed: true });
  });

  it('should reject an update without fields or with a non-boolean status', async () => {
    const { body } = await createTodo(token, 'Tâche');
    const id = body.data.id;

    expectErrorResponse(
      await request(app).put(`/api/todos/${id}`).set(auth(token)).send({}).expect(400),
      true
    );
    expectErrorResponse(
      await request(app).put(`/api/todos/${id}`).set(auth(token)).send({ completed: 'yes' }).expect(400),
      true
    );
  });

  it('should filter by status', async () => {
    const { body } = await createTodo(token, 'Faite');
    await createTodo(token, 'À faire');
    await request(app).put(`/api/todos/${body.data.id}`).set(auth(token)).send({ completed: true });

    const done = await request(app).get('/api/todos?completed=true').set(auth(token)).expect(200);
    expect(done.body.data.map((t) => t.title)).toEqual(['Faite']);

    const todo = await request(app).get('/api/todos?completed=false').set(auth(token)).expect(200);
    expect(todo.body.data.map((t) => t.title)).toEqual(['À faire']);
  });

  it('should delete a todo', async () => {
    const { body } = await createTodo(token, 'À supprimer');
    const id = body.data.id;

    await request(app).delete(`/api/todos/${id}`).set(auth(token)).expect(200);
    await request(app).get(`/api/todos/${id}`).set(auth(token)).expect(404);
  });

  it('should delete only completed todos', async () => {
    const { body } = await createTodo(token, 'Faite');
    await createTodo(token, 'À faire');
    await request(app).put(`/api/todos/${body.data.id}`).set(auth(token)).send({ completed: true });

    const res = await request(app).delete('/api/todos/completed').set(auth(token)).expect(200);
    expect(res.body.data).toEqual({ deleted: 1 });

    const list = await request(app).get('/api/todos').set(auth(token)).expect(200);
    expect(list.body.data.map((t) => t.title)).toEqual(['À faire']);
  });

  it('should isolate todos between users', async () => {
    const { body } = await createTodo(token, 'Privée');
    const id = body.data.id;
    const otherToken = await createOtherUser();

    const list = await request(app).get('/api/todos').set(auth(otherToken)).expect(200);
    expect(list.body.data).toEqual([]);

    await request(app).get(`/api/todos/${id}`).set(auth(otherToken)).expect(404);
    await request(app).put(`/api/todos/${id}`).set(auth(otherToken)).send({ completed: true }).expect(404);
    await request(app).delete(`/api/todos/${id}`).set(auth(otherToken)).expect(404);

    // La todo du propriétaire est intacte
    const own = await request(app).get(`/api/todos/${id}`).set(auth(token)).expect(200);
    expect(own.body.data.completed).toBe(false);
  });
});
