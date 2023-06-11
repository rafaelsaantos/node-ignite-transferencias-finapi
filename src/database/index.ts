import { Connection, createConnection, getConnectionOptions } from "typeorm";

interface IOptions {
  host: string;
  database: string;
}

getConnectionOptions().then(options => {
  const newOptions = options as IOptions;
  newOptions.host = 'localhost';
  createConnection({
    ...options,
  });
});
