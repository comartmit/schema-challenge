'use strict';

const assert = require('chai').assert;
const types = require('../types.js');
const uuid = require('uuid4');


describe('Base validator', () => {
  const validator = new types.Validator('TestType', 'Test validator');

  it('requires by default', () => {
    assert.isTrue(validator._required);
  });

  it('throws validation error if required and not provided', () => {
    let errorThrown = false;

    try {
      validator.validate(null);
    } catch (error) {
      errorThrown = true;
      assert.isTrue(error instanceof types.ValidationError);
      const fieldErrors = error.getFieldErrors();
      assert.strictEqual(fieldErrors.length, 1);
      assert.strictEqual(fieldErrors[0], 'field is required');
    }

    assert.isTrue(errorThrown);
  });

  it('ignores empty values if not required', () => {
    validator._required = false;
    assert.isTrue(validator.validate(null));
    validator._required = true; // set it back
  });

  it('returns contract information', () => {
    const contract = validator.getContract();
    assert.strictEqual(contract.type, 'TestType');
    assert.strictEqual(contract.description, 'Test validator');
    assert.isTrue(contract.required);
  });
});


describe('String validator', () => {
  const validator = new types.String('a string test');

  it('passes validation with String input', () => {
    assert.isTrue(validator.validate('hello world!'));
  });

  it('fails validation without String input', () => {
    let errorThrown = false;

    try {
      validator.validate(new Date());
    } catch (error) {
      errorThrown = true;
      assert.isTrue(error instanceof types.ValidationError);
      const fieldErrors = error.getFieldErrors();
      assert.strictEqual(fieldErrors.length, 1);
      assert.strictEqual(fieldErrors[0], 'invalid type for field');
    }

    assert.isTrue(errorThrown);
  });

  it('returns contract information', () => {
    const contract = validator.getContract();
    assert.strictEqual(contract.type, 'String');
    assert.strictEqual(contract.description, 'a string test');
    assert.isTrue(contract.required);
  });
});


describe('Integer validator', () => {
  const validator = new types.Integer('an integer test');

  it('passes validation with Integer input', () => {
    assert.isTrue(validator.validate(10));
  });

  it('fails validation without Integer input', () => {
    let errorThrown = false;

    try {
      validator.validate('10');
    } catch (error) {
      errorThrown = true;
      assert.isTrue(error instanceof types.ValidationError);
      const fieldErrors = error.getFieldErrors();
      assert.strictEqual(fieldErrors.length, 1);
      assert.strictEqual(fieldErrors[0], 'invalid type for field');
    }

    assert.isTrue(errorThrown);
  });

  it('returns contract information', () => {
    const contract = validator.getContract();
    assert.strictEqual(contract.type, 'Integer');
    assert.strictEqual(contract.description, 'an integer test');
    assert.isTrue(contract.required);
  });
});


describe('UUID validator', () => {
  const validator = new types.UUID('an UUID test');

  it('passes validation with UUID input', () => {
    assert.isTrue(validator.validate(uuid()));
  });

  it('fails validation without UUID input', () => {
    let errorThrown = false;

    try {
      validator.validate('10');
    } catch (error) {
      errorThrown = true;
      assert.isTrue(error instanceof types.ValidationError);
      const fieldErrors = error.getFieldErrors();
      assert.strictEqual(fieldErrors.length, 1);
      assert.strictEqual(fieldErrors[0], 'invalid type for field');
    }

    assert.isTrue(errorThrown);
  });

  it('returns contract information', () => {
    const contract = validator.getContract();
    assert.strictEqual(contract.type, 'UUID');
    assert.strictEqual(contract.description, 'an UUID test');
    assert.isTrue(contract.required);
  });
});


describe('ISO8601 validator', () => {
  const validator = new types.ISO8601('an ISO8601 test');

  it('passes validation with ISO8601 input', () => {
    assert.isTrue(validator.validate((new Date()).toISOString()));
  });

  it('fails validation without ISO8601 input', () => {
    let errorThrown = false;

    try {
      validator.validate('10');
    } catch (error) {
      errorThrown = true;
      assert.isTrue(error instanceof types.ValidationError);
      const fieldErrors = error.getFieldErrors();
      assert.strictEqual(fieldErrors.length, 1);
      assert.strictEqual(fieldErrors[0], 'invalid type for field');
    }

    assert.isTrue(errorThrown);
  });

  it('returns contract information', () => {
    const contract = validator.getContract();
    assert.strictEqual(contract.type, 'ISO8601');
    assert.strictEqual(contract.description, 'an ISO8601 test');
    assert.isTrue(contract.required);
  });
});


describe('Constant validator', () => {
  const validator = new types.Constant('MY CONSTANT');

  it('passes validation with the expected constant input', () => {
    assert.isTrue(validator.validate('MY CONSTANT'));
  });

  it('fails validation without expected constant input', () => {
    let errorThrown = false;

    try {
      validator.validate('10');
    } catch (error) {
      errorThrown = true;
      assert.isTrue(error instanceof types.ValidationError);
      const fieldErrors = error.getFieldErrors();
      assert.strictEqual(fieldErrors.length, 1);
      assert.strictEqual(fieldErrors[0], 'unmatched constant type');
    }

    assert.isTrue(errorThrown);
  });

  it('returns contract information', () => {
    const contract = validator.getContract();
    assert.strictEqual(contract.value, 'MY CONSTANT');
    assert.isTrue(contract.required);
  });
});


describe('Schema validator', () => {
  describe('simple schema', () => {
    const validator = new types.Schema({
      stringField: new types.String('test string'),
      intField: new types.Integer('test integer', false),
    });

    it('passes validation when all subfields validate', () => {
      assert.isTrue(validator.validate({
        stringField: 'test string',
        intField: 1
      }));
    });

    it('fails validation if a subfield fails validation', () => {
      let errorThrown = false;

      try {
        validator.validate({
          stringField: 'test string',
          intField: 'test int'  // should fail!
        });
      } catch (error) {
        errorThrown = true;
        assert.isTrue(error instanceof types.ValidationError);
        const fieldErrors = error.getFieldErrors();
        assert.strictEqual(fieldErrors.length, 1);
        // implicitly tests that schema prepends field name to field errors
        assert.strictEqual(fieldErrors[0], 'intField: invalid type for field');
      }

      assert.isTrue(errorThrown);
    });

    it('fails with multiple field errors if multiple subfields fail', () => {
      let errorThrown = false;

      try {
        validator.validate({
          intField: 'test int'  // should fail!
        });
      } catch (error) {
        errorThrown = true;
        assert.isTrue(error instanceof types.ValidationError);
        const fieldErrors = error.getFieldErrors();
        assert.strictEqual(fieldErrors.length, 2);
        // implicitly tests that schema prepends field name to field errors
        assert.isTrue(fieldErrors.includes('intField: invalid type for field'));
        assert.isTrue(fieldErrors.includes('stringField: field is required'));
      }

      assert.isTrue(errorThrown);
    });

    it('fails for rogue field', () => {
      let errorThrown = false;

      try {
        validator.validate({
          stringField: 'helloWorld',
          rogueField: 'rogue!'  // should fail!
        });
      } catch (error) {
        errorThrown = true;
        assert.isTrue(error instanceof types.ValidationError);
        const fieldErrors = error.getFieldErrors();
        assert.strictEqual(fieldErrors.length, 1);
        // implicitly tests that schema prepends field name to field errors
        assert.strictEqual(fieldErrors[0], 'rogueField: unexpected field');
      }

      assert.isTrue(errorThrown);
    });

    it('returns contract information', () => {
      const contract = JSON.stringify(validator.getContract());
      // This is super hacky but there is no easy way to compare objects and could be a huge rabbit-hole
      assert.strictEqual(contract, '{"stringField":{"type":"String","description":"test string","required":true},"intField":{"type":"Integer","description":"test integer","required":false}}'); // eslint-disable-line max-len
    });
  });


  describe('nested schema', () => {
    const validator = new types.Schema({
      schemaField: new types.Schema({
        stringField: new types.String('test string'),
        intField: new types.Integer('test integer', false),
      }),
      uuidField: new types.UUID('test UUID')
    });

    it('passes validation when all subfields pass', () => {
      assert.isTrue(validator.validate({
        schemaField: {
          stringField: 'hello world'
        },
        uuidField: uuid()
      }));
    });

    it('fails validation when a subfield fails validation', () => {
      let errorThrown = false;

      try {
        validator.validate({
          schemaField: {},  // should fail
          uuidField: uuid()
        });
      } catch (error) {
        errorThrown = true;
        assert.isTrue(error instanceof types.ValidationError);
        const fieldErrors = error.getFieldErrors();
        assert.strictEqual(fieldErrors.length, 1);
        // implicitly tests that schema prepends field name to field errors
        assert.strictEqual(fieldErrors[0], 'schemaField: stringField: field is required');
      }

      assert.isTrue(errorThrown);
    });
  });
});
