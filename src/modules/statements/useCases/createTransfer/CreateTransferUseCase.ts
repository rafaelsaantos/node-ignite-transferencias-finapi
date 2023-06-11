import { inject } from "tsyringe";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { BalanceError, ReceiverError, SenderError } from "./CreateTranferErrors";
import { ICreateTransferDTO } from "./ICreateTransferDTO";

export class CreateTransferUseCase {
  constructor(
    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository,

    @inject('UsersRepository')
    private usersRepository: IUsersRepository,
  ) { }

  async execute({ amount, description, sender_id, receiver_id }: ICreateTransferDTO) {
    const hasSender = await this.usersRepository.findById(sender_id);
    if (!hasSender) {
      throw new SenderError();
    }

    const hasReceiver = await this.usersRepository.findById(receiver_id);
    if (!hasReceiver) {
      throw new ReceiverError();
    }

    const senderHasBalance = await this.statementsRepository.getUserBalance({
      user_id: sender_id,
    });

    if (amount > senderHasBalance.balance) {
      throw new BalanceError();
    }

    await this.statementsRepository.create({
      user_id: sender_id,
      type: OperationType.WITHDRAW,
      amount,
      description: `Transfer to ${hasReceiver.name}: ${description}`,
    });

    const transferStatement = await this.statementsRepository.create({
      user_id: receiver_id,
      sender_id,
      type: OperationType.TRANSFER,
      amount,
      description,
    });

    return transferStatement;
  }
}
