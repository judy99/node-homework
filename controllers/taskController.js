const StatusCodes = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { querySchema } = require("../validation/querySchema");

const prisma = require("../db/prisma");

function createDynamicSelect(fieldsParam) {
  if (!fieldsParam) return undefined;
  const selectObj = {};
  fieldsParam.split(",").forEach((field) => {
    const trimmedField = field.trim();
    // Handle specific logic for your Task relation if requested
    selectObj[trimmedField] = true;
  });

  return selectObj;
}

async function index(req, res) {
  const { error, value } = querySchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  });

  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: error.message,
    });

  const { page, limit, find } = value;

  const skip = (page - 1) * limit;

  // Build where clause with optional search filter
  const whereClause = { userId: req.user.id };

  if (find) {
    whereClause.title = {
      contains: find, // Matches %find% pattern
      mode: "insensitive", // Case-insensitive search (ILIKE in PostgreSQL)
    };
  }

  // dynamic fields
  let selectFields;

  if (req.query.fields) {
    selectFields = createDynamicSelect(req.query.fields);
    if (
      !Object.keys(selectFields).every((key) =>
        ["id", "title", "isCompleted", "priority", "createdAt"].includes(key)
      )
    ) {
      return res
        .status(400)
        .json({ message: "Invalid field(s) in query parameters." });
    }
  } else {
    selectFields = {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
    };
  }

  // Get tasks with pagination and eager loading
  const tasks = await prisma.task.findMany({
    where: whereClause,
    select: {
      ...selectFields,
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // Get total count for pagination metadata
  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  // Build pagination object with complete metadata
  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  // Return tasks with pagination information
  return res.status(200).json({
    tasks,
    pagination,
  });
}

async function show(req, res, next) {
  const taskId = parseInt(req.params?.id);
  if (!taskId) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: req.user.id,
      },
      select: {
        title: true,
        isCompleted: true,
        priority: true,
        id: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    if (!task)
      return res.status(404).json({ message: "The task was not found." });
    return res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
}

async function create(req, res, next) {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const { title, isCompleted, priority } = value;
  const userId = req.user.id;

  let task = null;
  try {
    task = await prisma.task.create({
      data: { title, isCompleted, priority, userId },
      select: { title: true, isCompleted: true, priority: true, id: true }, // specify the column values to return
    });
    return res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    return next(err); // the error handler takes care of other erors
  }
}

async function deleteTask(req, res, next) {
  const taskId = parseInt(req.params?.id);
  if (!taskId) {
    return res
      .status(404)
      .json({ message: "The task ID passed is not found." });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id: taskId,
        userId: req.user.id,
      },
      select: { title: true, isCompleted: true, priority: true, id: true },
    });
    return res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
}

async function update(req, res, next) {
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  // assuming that value contains the validated change coming back from Joi, and that
  // you have a valid req.params.id:
  const taskIdToUpdate = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  if (!taskIdToUpdate) {
    return res
      .status(404)
      .json({ message: "The task ID passed is not valid." });
  }

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id: taskIdToUpdate,
        userId: req.user.id,
      },
      select: { title: true, isCompleted: true, priority: true, id: true },
    });
    return res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
}

async function bulkCreate(req, res, next) {
  // Bulk create with validation
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: req.user.id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { create, deleteTask, index, update, show, bulkCreate };
