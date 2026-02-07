const Joi = require("joi");

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  find: Joi.string().trim().min(1).max(50).optional(),
  priority: Joi.string()
    .default("medium")
    .valid("low", "medium", "high")
    .not(null),
  fields: Joi.string()
    .trim()
    .optional()
    .custom((value, helpers) => {
      const fields = value.split(",").map((field) => field.trim());
      const validFields = [
        "id",
        "title",
        "isCompleted",
        "priority",
        "createdAt",
      ];
      const invalidFields = fields.filter(
        (field) => !validFields.includes(field),
      );
      if (invalidFields.length > 0) {
        return helpers.error("any.invalid", {
          message: `Invalid field(s): ${invalidFields.join(", ")}`,
        });
      }
      return value;
    }),
  sortBy: Joi.string().trim().min(1).max(50).optional().default("createdAt"),
  sortDirection: Joi.string().trim().min(1).max(50).optional().default("desc"),
});

module.exports = { querySchema };
