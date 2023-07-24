"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const google_sheet_1 = __importDefault(require("google-sheet-cli/lib/lib/google-sheet"));
const lib_1 = require("./lib");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const spreadsheetId = (0, core_1.getInput)('spreadsheetId', {
                required: true,
            });
            const { GSHEET_CLIENT_EMAIL, GSHEET_PRIVATE_KEY } = process.env;
            if (!GSHEET_CLIENT_EMAIL || !GSHEET_PRIVATE_KEY)
                throw new Error('Google sheets credentials have to be supplied');
            const gsheet = new google_sheet_1.default(spreadsheetId);
            yield gsheet.authorize({
                /* eslint-disable camelcase */
                client_email: GSHEET_CLIENT_EMAIL,
                private_key: GSHEET_PRIVATE_KEY,
                /* eslint-enable camelcase */
            });
            const commandsString = (0, core_1.getInput)('commands', {
                required: true,
            });
            const validatedCommands = (0, lib_1.validateCommands)(commandsString);
            const results = [];
            yield (0, lib_1.asyncForEach)(validatedCommands, (command) => __awaiter(this, void 0, void 0, function* () {
                const { func, kwargs } = command;
                const result = yield gsheet[func](...kwargs);
                results.push({ command, result });
            }));
            (0, core_1.setOutput)('results', JSON.stringify({ results }));
            // eslint-disable-next-line i18n-text/no-en
            (0, core_1.debug)(`Processed commands\n${JSON.stringify(results, null, 2)}`);
            return { results };
        }
        catch (error) {
            const err = error;
            (0, core_1.debug)(`Error:\n${JSON.stringify(err, null, 2)}`);
            (0, core_1.setFailed)(err.message || err);
            return { error: err, results: [] };
        }
    });
}
exports.default = run;
!process.env.TEST && run();
