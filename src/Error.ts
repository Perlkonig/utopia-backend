export enum Errors {
    INVALID_LOCATION,           // You tried to move to a location that doesn't exist
    ASSIGNMENT_MALFORMED,       // The assignment string could not be interpreted
    ASSIGNMENT_INVALID,         // The assignment string was well formed, but either the number didn't exist or the destination is already occupied
}

export class InvalidArgumentsError extends Error {
    code: Errors;

    constructor(code: Errors, message?: string) {
        super(message);
        // see: typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = InvalidArgumentsError.name; // stack traces display correctly now
        this.code = code;
    }
}