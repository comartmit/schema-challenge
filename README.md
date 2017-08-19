# Schema Validation

Event Validation Service in NodeJS

### Requirements
- Node version 6.0.0 or later - this was a consideration to avoid needing to work with Babel given the timeline.

### Instructions

Fork a copy of this repository locally and then run the following commands from within the directory:

```
> npm install  # installs all required modules
> npm test  # runs linting and the test suite located at `./lib/tests/`
> npm start  # starts the server runs at localhost:3000
```

The entry point to the service is `server.js`. All routes defined in the problem statement have been implemented and can be hit either via postman or curl:
- `GET /spec - returns routing spec as well as full events spec`
- `GET /spec/:type - returns the event spec for the specified event` (returns a 404 if the type is not found)
- `POST /validate - takes a json object satisfying the requirements of the specified event spec`

### Method
The majority of what I built was a scalable templating scheme. Effectively we are defining a validation library. Every validator is equipped with a contract as well as functionality to perform validation on an input value. The specific validators included are:
- `Validator`: a base class validator, enforces 'required/optional' behavior
- `StringType`: validates strings
- `IntegerType`: validates integers
- `UUIDType`: validates strings that represent UUID's
- `ISO8601Type`: validates strings that are an ISO8601 formatted date

The above validators all publish the same contract:
- `type`: the type name of the validator
- `description`: description set during instantiation, useful for defining schemas
- `required`: whether or not the field is required

There is another base type validator known as `ConstantType`. This allows us to define contract "values" for a field. It is used to represent the `type` field on an event, as every event is unique based on its `type` field. They publish the following contract:
- `value`: what exact value should be passed for this field
- `required`: currently they are all set to true

The above validators are all "primitives" in the context of this system and can be used to construct more complicated schemas. These schemas are referred to as a SchemaType. SchemaTypes take an object map of `fieldname: Validator` as an input argument. The published contract of the SchemaType is the recursive structure/contracts of all nested validators. Currently SchemaTypes are required by default, even if the bodies are empty.

The final validator type is an EventType. EventType is just a wrapper on SchemaType, that takes `type` as an argument and then sets it as a ConstantType on the underlying schema document, to be enforced by validation.

It is worth noting that I implemented these validators under an inheritence model with the hope that it will be easy to add new validators in the future as the core validation plumbing is handled in `Validator` (for primitives) and `SchemaType` for compound objects. Additionally, I believe it makes for an elegant 'schema declaration' (see `./lib/events.js`).
_Pay it forward with a more comprehensive infrastructure in order to more easily drive templating and instantiation._

### Example
The contract for the SMSEvent is:

```
{
    "phoneNumber": {
        "type": "String",
        "description": "Phone number",
        "required": true
    },
    "body": {
        "text": {
            "type": "String",
            "description": "the text in the message",
            "required": true
        },
        "messageID": {
            "type": "UUID",
            "description": "unique ID of the message",
            "required": false
        },
        "timestamp": {
            "type": "ISO8601",
            "description": "time the message was sent - ISO8601 format",
            "required": true
        }
    },
    "type": {
        "value": "SMS",
        "required": true
    }
}
```

This contract only tells you the format and types of what values to send in the object to validate. A successful call to the `/validate` endpoint, satisfying the contract for this Event could look like:

```
{
	"type": "SMS",
	"userID": "Martin",
	"body": {
		"text": "HELLO WORLD!",
		"messageID": "7cb08a8a-652e-4a23-9853-9299faafd874",
		"timestamp": "2017-08-18T19:42:15.423Z"
	}
}
```

Example Curl: `curl -H "Content-Type: application/json" -X POST -d '{"type":"IM","userID":"MartimessageID":"7cb08a8a-652e-4a23-9853-9299faafd874","timestamp":"2017-08-18T19:42:15.423Z"}}' http://localhost:3000/validate`

Given that messageID is optional, the following would also work:

```
{
	"type": "SMS",
	"userID": "Martin",
	"body": {
		"text": "HELLO WORLD!",
		"timestamp": "2017-08-18T19:42:15.423Z"
	}
}
```

## Errors

One consideration of this system was how to handle the validation errors. When we are discussing a primitive type validator, this is simple: does it validate or not. We currently fail validation for primitive validators if:
- required but null
- wrong datatype
- incorrect value (only on ConstantType)

To handle these reasons as well as support other failure reasons, I introduced a lightweight class `ValidationError`. A `ValidationError` stores the appropriate failure reason for validation. During `SchemaType` validation, all failing field errors are aggregated, pre-pended (recursively) with the respective field name, and returned as the overall reason for validation failure.

_Please pass various required fields, constant fields, and field types for this event to experience the dynamic behavior._

## Testing

I chose to use Mocha and Chai for testing. I have unit tested all of the validation types and logic, but did not get to test the API's. The testing of the API's is better suited for integration testing. I find that it is quick to generate a postman collection that can run an E2E test suite. Please advise if you would like for me to follow up with one.

One area I didn't unit test, was the EventType instances. These objects are starting to get on the larger side and there is no clean equality testing in javascript for comparing two javascript objects. I have verified their correctness by hitting the API - and would likely incorporate those as part of an E2E Postman suite.

## Extensions

Some areas that I could continue to work with more time:
- logging: right now I have only set up a standard node request logger, but have not instrumented with my own logging
- postman E2E test suite
- testing: my testing of returned errors resulted in some boilerplate code that I would pull out.
- a second pass at the ValidationError to better handle the recursive case
- an explicit routing layer - didn't seem necessary for so few routes.
- (Saturday 8/19) - a `from_string` approach to schema definition that would support serialization to and from json for schemas themselves.
