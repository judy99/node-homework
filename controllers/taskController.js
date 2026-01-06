const StatusCodes = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

async function index(req, res) {
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get tasks with pagination and eager loading
  const tasks = await prisma.task.findMany({
    where: { userId: global.user_id },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
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
    where: { userId: global.user_id },
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
        userId: global.user_id,
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

async function create(req, res, next) {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const { title, isCompleted, priority } = value;
  const userId = global.user_id;

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
        userId: global.user_id,
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
        userId: global.user_id,
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

module.exports = { create, deleteTask, index, update, show };
