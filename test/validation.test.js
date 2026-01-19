const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// let {error, value} = userSchema.validate(object1)
// console.log("got here");
// ({error, value } = userSchema.validate(object2))

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "password")
    ).toBeDefined();
  });
  // 1. The user schema requires that an email be specified.
  it("1. The user schema requires that an email be specified.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "Pa$$word123" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "email")
    ).toBeDefined();
  });
  // The user schema does not accept an invalid email.
  it("2. The user schema does not accept an invalid email.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bobsample.com", password: "Pa$$word123" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "email")
    ).toBeDefined();
  });

  // The user schema requires a password.
  it("3. The user schema requires a password.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "password")
    ).toBeDefined();
  });
  // The user schema requires name.
  it("4. The user schema requires name.", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "pa$$Pa$$word123" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "name")
    ).toBeDefined();
  });
  // The name must be valid (3 to 30 characters).
  it("5. The name must be valid (3 to 30 characters).", () => {
    const { error } = userSchema.validate(
      { name: "Bo", email: "bob@sample.com", password: "Pa$$word123" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "name")
    ).toBeDefined();
  });
  // If validation is performed on a valid user object, error comes back falsy.
  it("6. If validation is performed on a valid user object, error comes back falsy.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "Pa$$word123" },
      { abortEarly: false }
    );
    expect(error).toBeFalsy();
  });
});

// title: Joi.string().trim().min(3).max(30).required(),
// isCompleted: Joi.boolean().default(false).not(null),
// priority: Joi.string()
//   .default("medium")
//   .valid("low", "medium", "high")
//   .not(null),

// { title: "My new task", isCompleted: false, priority: "medium" },
describe("task object validation tests", () => {
  it("1. The task schema requires a title.", () => {
    const { error } = taskSchema.validate(
      { isCompleted: false, priority: "medium" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "title")
    ).toBeDefined();
  });
  // If an isCompleted value is specified, it must be valid.
  it("2. If an isCompleted value is specified, it must be valid.", () => {
    const { error } = taskSchema.validate(
      { title: "My new task", isCompleted: "false1", priority: "medium" },
      { abortEarly: false }
    );
    expect(
      error.details.find((detail) => detail.context.key == "isCompleted")
    ).toBeDefined();
  });
  // If an isCompleted value is not specified but the rest
  // of the object is valid, a default of false is provided by validation.
  it("3. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation.", () => {
    const { value } = taskSchema.validate({ title: "My new task" });
    expect(value.isCompleted).toBe(false);
  });
  // If isCompleted in the provided object has the value true, it remains true after validation.
  it("4. If isCompleted in the provided object has the value true, it remains true after validation.", () => {
    const { value } = taskSchema.validate({
      title: "My new task",
      isCompleted: true,
    });
    expect(value.isCompleted).toBe(true);
  });
});

describe("patchTaskSchema validation tests", () => {
  it("1. The patchTaskSchema does not require a title.", () => {
    const { error } = patchTaskSchema.validate({ isCompleted: true });
    expect(error).toBeFalsy();
  });
  // If no value is provided for isCompleted this remains undefined in the returned value.
  it("2. If no value is provided for isCompleted this remains undefined in the returned value.", () => {
    const { value } = patchTaskSchema.validate({
      title: "My new task",
    });
    expect(value.isCompleted).toBe(undefined);
  });
});
