'use strict';

const _ = require('lodash');

// uuid module's `valid` function is broken, ideally would use that
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* Errors */

/*
  Represents an error due to Object validation.
  Supports a primitve solution to storing multiple validation errors for a single schema.
*/
class ValidationError extends Error {
  constructor() {
    super('failed input validation');
    this.messages = [];
  }

  addFieldError(message) {
    this.messages.push(message);
  }

  getFieldErrors() {
    return this.messages;
  }
}


/* Validators */

/*
  A base validator class that establishes the plumbing for defining and work with validators.
  @param type - the expected type of data for validation
  @param description - provides field level explanations when defining contracts - optional
  @param required - whether or not an input is expected - default: true
*/
class Validator {
  constructor(type, description, required = true) {
    this._type = type;
    this._description = description || '';
    this._required = required;
  }

  /*
    Evaluates an input value against the requirements of the validator
    @param value - the input object value to test against the validator
  */
  validate(value) {
    let error;

    // validates the required property against the value provided
    if (value === null || value === undefined) {
      if (this._required) {
        error = new ValidationError();
        error.addFieldError('field is required');
        throw error;
      }
    } else {
      // validates the specific type of the value provided
      if (!this.validateType(value)) {
        error = new ValidationError();
        error.addFieldError('invalid type for field');
        throw error;
      }
    }

    return true;
  }

  /*
    Called as during validate to test that the "type" of the value provided matches expectation
    @param value - the input object value to test against the validator
  */
  validateType(value) {
    return true;
  }

  /*
    Returns the defined contract for the validator
  */
  getContract() {
    return {
      type: this._type,
      description: this._description,
      required: this._required,
    };
  }
}

/*
  A validator for testing String inputs
  @param description - provides field level explanations when defining contracts - optional
  @param required - whether or not an input is expected - default: true
*/
class StringType extends Validator {
  constructor(description, required) {
    super('String', description, required);
  }

  validateType(value) {
    return _.isString(value);
  }
}

/*
  A validator for testing Integer inputs
  @param description - provides field level explanations when defining contracts - optional
  @param required - whether or not an input is expected - default: true
*/
class IntegerType extends Validator {
  constructor(description, required) {
    super('Integer', description, required);
  }

  validateType(value) {
    return Number.isInteger(value);
  }
}

/*
  A validator for testing ISO8601 date inputs
  @param name - the name given to the validator (ie. the name of a field)
  @param description - provides field level explanations when defining contracts - optional
  @param required - whether or not an input is expected - default: true
*/
class ISO8601Type extends Validator {
  constructor(description, required) {
    super('ISO8601', description, required);
  }

  validateType(value) {
    // parse the date and verify that the stringified version matches the input
    const parsedDate = new Date(value);
    return parsedDate && parsedDate.toISOString() === value;
  }
}

/*
  A validator for testing UUID inputs
  @param name - the name given to the validator (ie. the name of a field)
  @param description - provides field level explanations when defining contracts - optional
  @param required - whether or not an input is expected - default: true
*/
class UUIDType extends Validator {
  constructor(description, required) {
    super('UUID', description, required);
  }

  validateType(value) {
    return _.isString(value) && UUID_FORMAT.test(value);
  }
}

/*
  A validator for testing constant value inputs
  @param name - the name given to the validator (ie. the name of a field)
  @param description - the expected value to be passed on the contract
*/
class ConstantType extends Validator {
  constructor(value) {
    super('Constant', value, true);
  }

  validate(value) {
    if (value !== this._description) {
      const error = new ValidationError();
      error.addFieldError('unmatched constant type');
      throw error;
    }

    return true;
  }

  getContract() {
    return {
        value: this._description,
        required: true
    };
  }
}

/*
  Defines a Schema based validator that supports defining nested validators
  @param name - the name given to the validator (ie. the name of a field)
  @param schema - an object mapping fields to respective validators
*/
class SchemaType extends Validator {
  constructor(schema) {
    super('Schema', null, true);  // for now we will say all schema types are required
    this._schema = schema;
  }

  validate(value) {
    const validated = {};
    let returnErrors, fieldErrors;

    // validate presence of required as well as type of provided fields
    for (const field in this._schema) {
      const validator = this._schema[field];

      try {
        validated[field] = validator.validate(value[field]);
      } catch (error) {
        if (error instanceof ValidationError) {
          validated[field] = false;
          returnErrors = returnErrors || new ValidationError();

          // translate all nested field errors
          fieldErrors = error.getFieldErrors();
          for (const errorField in fieldErrors) {
            // for nested schemas - the top level schema won't have a name
            returnErrors.addFieldError(field + ': ' + fieldErrors[errorField]);
          }
        }
      }
    }

    // validate that we have not received any rogue fields
    for (const field in value) {
      if (!(field in validated)) {
        returnErrors = returnErrors || new ValidationError();
        returnErrors.addFieldError(field + ': unexpected field');
      }
    }

    if (returnErrors) throw returnErrors;

    return true;
  }

  getContract() {
    return _.mapValues(this._schema, validator => (validator.getContract()));
  }
}

/*
  Defines a Schema based validator for strict event definition
  @param eventName - the name of this event, which is required as part of validate
  @param schema - an object mapping fields to respective validators
*/
class EventType extends SchemaType {
  constructor(eventName, schema) {
    schema.type = new ConstantType(eventName);
    super(schema);
  }
}

module.exports = {
  Validator,
  ValidationError,
  String: StringType,
  Integer: IntegerType,
  ISO8601: ISO8601Type,
  UUID: UUIDType,
  Constant: ConstantType,
  Schema: SchemaType,
  Event: EventType,
};
