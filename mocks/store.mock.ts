// @ts-ignore
import { Request, Response } from 'express';

export default {
  'GET /store/inventory': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'POST /store/order': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /store/order/{orderId}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'DELETE /store/order/{orderId}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
};
