import express from 'express';
import request from 'supertest';
import forecastRouter from '../../src/routes/forecastRoute';
import * as forecastController from '../../src/controllers/forecastController';

jest.mock('../../src/controllers/forecastController');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/forecast', forecastRouter);
  return app;
};

describe('forecast routes', () => {
  const app = buildApp();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /coffee-availability/:machineId/:recipeId returns success shape', async () => {
    (forecastController.calculateCoffeeAvailability as any).mockImplementation((req: any, res: any) => {
      res.status(200).json({ success: true, message: 'ok', data: { foo: 'bar' }, timestamp: new Date().toISOString() });
    });

    const res = await request(app).get('/api/forecast/coffee-availability/m1/r1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ foo: 'bar' });
  });

  it('GET /machine/:machineId returns success shape', async () => {
    (forecastController.getMachineForecast as any).mockImplementation((req: any, res: any) => {
      res.status(200).json({ success: true, message: 'ok', data: { recipes: [] }, timestamp: new Date().toISOString() });
    });
    const res = await request(app).get('/api/forecast/machine/m1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toEqual([]);
  });

  it('GET /low-stock/:machineId passes threshold query', async () => {
    (forecastController.getLowStockWarnings as any).mockImplementation((req: any, res: any) => {
      expect(req.query.threshold).toBe('15');
      res.status(200).json({ success: true, message: 'ok', data: { warnings: [] }, timestamp: new Date().toISOString() });
    });
    const res = await request(app).get('/api/forecast/low-stock/m1?threshold=15');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /all-machines returns success shape', async () => {
    (forecastController.getAllMachinesForecast as any).mockImplementation((req: any, res: any) => {
      res.status(200).json({ success: true, message: 'ok', data: { machines: [] }, timestamp: new Date().toISOString() });
    });
    const res = await request(app).get('/api/forecast/all-machines');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

