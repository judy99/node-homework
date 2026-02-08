const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.boolean().default(false).not(null),
  priority: Joi.string()
    .default("medium")
    .valid("low", "medium", "high")
    .not(null),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  isCompleted: Joi.boolean().not(null),
  priority: Joi.string().valid("low", "medium", "high").not(null),
})
  .min(1)
  .message("No attributes to change were specified.");

/** Body for bulk update: required ids + at least one patch field (title, isCompleted, priority). */
const updateManyByIdsSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .message("IDs must be a non-empty array of task IDs.")
    .required(),
  title: Joi.string().trim().min(3).max(30).optional(),
  isCompleted: Joi.boolean().optional(),
  priority: Joi.string().valid("low", "medium", "high").optional(),
})
  .or("title", "isCompleted", "priority")
  .min(1)
  .message(
    "Body must include at least one field to update (title, isCompleted, priority).",
  );

/** Body for bulk delete */
const deleteManyByIdsSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .message("IDs must be a non-empty array of task IDs.")
    .required(),
});

module.exports = {
  taskSchema,
  patchTaskSchema,
  updateManyByIdsSchema,
  deleteManyByIdsSchema,
};
