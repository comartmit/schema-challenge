'use strict'

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const is_string = value => {
  return typeof this.value === 'string' || this.value instanceof String
}

// Type level validators

class Validator {
  required = true
  type = ''
  description = ''

  constructor(name, description, {required = true}) {
    if (required === false || required === true) {
      this.required = required;
    } else {
      // TODO raise error
    }
  }

  validate(value) {
    // validates the required property against the value provided
    if (value == null || value == undefined){
      return !this.required
    }

    // validates the specific type of the value provided
    return this.validateType(value)
  }

  // Expects the value to always exist
  validateType(value){
    return True
  }

  getContract() {
    let optional = ' #Optional' if !this.required else ''
    return '"' + this.description + '", #' + this.type + optional;
  }
}

class StringType extends Validator {
  type = 'String'

  validateType(value) {
    return is_string(value);
  }
}

class IntegerType extends Validator {
  type = 'Integer'
  validateType() {
    return Number.isInteger(value);
  }
}

class ISO8601Type extends Validator {
  type = 'ISO8601'

  validateType(value) {
    let parsedDate = Date.parse(value);
    return parsedDate && parsedDate.toISOString() == value;
  }
}

class UUIDType extends Validator {
  type = 'UUID'

  validateType(value) {
    return is_string(value) && UUID_FORMAT.test(value);
  }
}

class SchemaType extends Validator {
  type = 'Schema'

  constructor({ structure = {} }) {
    super(true)  // for now we will say all schema types are required
    this.structure = structure
  }

  validate() {
    for (prop in this._structure) {
      console.log(prop);
    }
  }

  getContract() {

  }

}

class Event extends SchemaType {
  constructor(type, schema){
    this.type = type;
    this.schema = schema;
  }

  validate(data) {

  }

  getContract() {
    // ordered dict?
    let output = {
      type: this.type,
    }

    let schemaContract = this.schema.getContract();
    for (prop in schemaContract){
      output[prop] = schemaContract[prop]
    }

    return output
  }
}

class TestType1 extends SchemaType {
  this._structure = {
    'name': StringType(),
    'person': TestType({

    })
  }

  bark() {
    console.log('woof')
  }
}

const IMEvent = Event('IM', {
  userID: StringType(),
  body: SchemaType({
    text: StringType(),
    messageID: UUIDType(),
    timestamp: ISO8601Type(),
  }),
})

module.exports = {
  String: StringType,
  IntegerType: IntegerType,
  ISO8601Type: ISO8601Type,
  SchemaType: SchemaType,

}
