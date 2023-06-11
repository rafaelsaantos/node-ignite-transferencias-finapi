import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe("Create a statement", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
  });

  it("Should be able to create a deposit.", async () => {
    const user: ICreateUserDTO = {
      name: "logan",
      email: "logan@email.com",
      password: "1234",
    };
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    const statement = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Depositing 100 R$.",
    });

    expect(statement).toHaveProperty("id");
    expect(statement.amount).toEqual(100);
  });

  it("Should be able to create a withdraw.", async () => {
    const user: ICreateUserDTO = {
      name: "gunner",
      email: "gunner@email.com",
      password: "1234",
    };
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Depositing 100 R$.",
    });

    const withdraw = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.WITHDRAW,
      amount: 60,
      description: "Withdrawing 60 R$.",
    });

    expect(withdraw).toHaveProperty("id");
  });

  it("Should not be able to create a statement (deposit/withdraw) for an inexistent user.", () => {
    expect(async () => {
      await createStatementUseCase.execute({
        user_id: "NotExistsID",
        type: OperationType.DEPOSIT,
        amount: 500,
        description: "Depositing 500 R$.",
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });

  it("Should not be able to create a withdraw when user has insufficient funds.", async () => {
    const user = await createUserUseCase.execute({
      name: "danny",
      email: "danny@email.com",
      password: "1234",
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 50,
      description: "Depositing 50 R$.",
    });

    await expect(createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.WITHDRAW,
      amount: 100,
      description: "Withdrawing 100 R$.",
    })).rejects.toEqual(new CreateStatementError.InsufficientFunds());
  });

  it("Should be able to create a transfer.", async () => {
    const user1 = await createUserUseCase.execute({
      name: "robbie",
      email: "robbie@email.com",
      password: "1234"
    })

    const user2 = await createUserUseCase.execute({
      name: "carl",
      email: "carl@email.com",
      password: "1234"
    })

    await createStatementUseCase.execute({
      user_id: user1.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Depositing 100 R$.",
    });

    const statement = await createStatementUseCase.execute({
      user_id: user2.id as string,
      sender_id: user1.id as string,
      type: OperationType.TRANSFER,
      amount: 50,
      description: "Transfer 50 R$ to user 2.",
    });

    expect(statement).toHaveProperty("id");
    expect(statement.amount).toEqual(50);
  });
});
