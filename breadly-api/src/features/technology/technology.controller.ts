import { Request, Response, Router } from 'express';
import {
  getAllTechnologies,
  getTechnologyById,
  postTechnology,
} from './technology.service';
import { Technology } from './technology.types';

const technologyController = Router();

technologyController.get('/', async (_: Request, res: Response) =>
  res.status(200).json(await getAllTechnologies()),
);

technologyController.post('/', async (req: Request, res: Response) => {
  const persistedTechnology = await postTechnology(req.body as Technology);

  res.status(200).json(persistedTechnology);
});

technologyController.get('/:id', async (req: Request, res: Response) => {
  const result = await getTechnologyById(String(req.params.id));

  if (result) {
    res.send(result);
  } else {
    res.status(404).end();
  }
});

export { technologyController };
