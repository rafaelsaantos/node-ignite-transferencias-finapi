import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let getStatementOperationUseCase: GetStatementOperationUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;

describe("Get statement operation", () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("Should be able to get a statement operation.", async () => {
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
      amount: 300,
      description: "Depositing 300 R$.",
    });

    const statementInfo = await getStatementOperationUseCase.execute({
      user_id: token.user.id as string,
      statement_id: statement.id as string,
    });

    expect(statementInfo).toHaveProperty("id");
  });

  it("Should not be able to get a statement operation for an inexistent user.", () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: "NotExistsID",
        statement_id: "statement_id",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it("Should not be able to get an inexistent statement operation.", () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "Spencer",
        email: "spencer@email.com",
        password: "1234",
      };

      await createUserUseCase.execute(user);

      const token = await authenticateUserUseCase.execute({
        email: user.email,
        password: user.password,
      });

      await getStatementOperationUseCase.execute({
        user_id: token.user.id as string,
        statement_id: "NotExistsStatement",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
});
