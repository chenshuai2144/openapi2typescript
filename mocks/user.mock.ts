// @ts-ignore
import { Request, Response } from 'express';

export default {
  'POST /user': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'POST /user/createWithArray': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'POST /user/createWithList': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /user/login': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /user/logout': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /user/{username}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'PUT /user/{username}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'DELETE /user/{username}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
};
