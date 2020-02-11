import * as request from 'supertest';
import app from '../src/app';

test("/", async () => {
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(200);
});