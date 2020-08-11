export enum Errors {
    LOCATION_INVALID = "LOCATION_INVALID",                      // You tried to move to a location that doesn't exist
    RESOLUTION_INVALID = "RESOLUTION_INVALID",                  // You tried to resolve an absent interrupt or did it in an invalid way
    ASSIGNMENT_MALFORMED = "ASSIGNMENT_MALFORMED",              // Your assignment command was malformed
    ASSIGNMENT_DIE_INVALID = "ASSIGNMENT_DIE_INVALID",          // You tried to assign a die value you didn't roll or that is already assigned
    ASSIGNMENT_LOCATION_INVALID = "ASSIGNMENT_LOCATION_INVALID" // You tried to assign a die to an invalid location
}

export class InvalidArgumentsError extends Error {
    code: Errors;

    constructor(code: Errors, message?: string) {
        if (message === undefined) {
            message = code.toString();
        }
        super(message);
        // see: typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = InvalidArgumentsError.name; // stack traces display correctly now
        this.code = code;
    }
}