// @ts-ignore
import { Request, Response } from 'express';

export default {
  'PUT /pet': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'POST /pet': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /pet/findByStatus': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /pet/findByTags': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'GET /pet/{petId}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'POST /pet/{petId}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'DELETE /pet/{petId}': (req: Request, res: Response) => {
    res.status(200).send({});
  },
  'POST /pet/{petId}/uploadImage': (req: Request, res: Response) => {
    res.status(200).send({});
  },
};
