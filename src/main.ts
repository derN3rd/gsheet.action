import { debug, getInput, setFailed, setOutput } from '@actions/core';
import GoogleSheet from 'google-sheet-cli/lib/lib/google-sheet';
import { inspect } from 'util';
import { ValidatedCommand, asyncForEach, validateCommands } from './lib';

export interface Result {
  command: ValidatedCommand;
  result: unknown;
}

export interface Results {
  results: Result[];
  error?: Error;
}

export default async function run(): Promise<Results> {
  try {
    const spreadsheetId: string = getInput('spreadsheetId', {
      required: true,
    });

    const { GSHEET_CLIENT_EMAIL, GSHEET_PRIVATE_KEY } = process.env;
    if (!GSHEET_CLIENT_EMAIL || !GSHEET_PRIVATE_KEY)
      throw new Error('Google sheets credentials have to be supplied');

    const gsheet = new GoogleSheet(spreadsheetId);
    await gsheet.authorize({
      /* eslint-disable camelcase */
      client_email: GSHEET_CLIENT_EMAIL,
      private_key: GSHEET_PRIVATE_KEY,
      /* eslint-enable camelcase */
    });

    const commandsString: string = getInput('commands', {
      required: true,
    });
    const validatedCommands = validateCommands(commandsString);

    const results: Result[] = [];
    await asyncForEach<ValidatedCommand>(
      validatedCommands,
      async (command: ValidatedCommand) => {
        const { func, kwargs } = command;
        const result = await gsheet[func](...kwargs);
        results.push({ command, result });
      }
    );

    setOutput('results', JSON.stringify({ results }));
    // eslint-disable-next-line i18n-text/no-en
    debug(`Processed commands\n${JSON.stringify(results, null, 2)}`);
    return { results };
  } catch (error) {
    const err = error as Error;
    debug(`Error:\n${inspect(err, false, 3)}`);
    setFailed(err.message || err);
    return { error: err, results: [] };
  }
}

!process.env.TEST && run();
