import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateTransferUseCase } from "./CreateTransferUseCase";

export class CreateTransferController {
  async execute(request: Request, response: Response) {
    const { amount, description } = request.body;
    const { id: sender_id } = request.user;
    const { receiver_id } = request.params;

    const createTranferUseCase = container.resolve(CreateTransferUseCase);
    const transfer = await createTranferUseCase.execute({
      sender_id,
      receiver_id,
      amount,
      description,
    });

    return response.status(201).json(transfer);

  }
}
