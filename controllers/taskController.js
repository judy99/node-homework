const StatusCodes = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

function index(req, res) {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email
  );

  if (!userTasks || !userTasks.length) {
    return res.status(404).json({ message: "No tasks found for this user." });
  }

  const tasks = userTasks.map(
    ({ userId, ...taskWithoutUserId }) => taskWithoutUserId
  );
  res.json(tasks);
}

function show(req, res) {
  const taskId = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  if (!taskId) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskId && task.userId === global.user_id.email
  );

  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found or user not owns it" });
  }
  const { userId, ...sanitizedTask } = global.tasks[taskIndex];
  res.json(sanitizedTask);
}

function create(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const newTask = {
    ...value,
    id: taskCounter(),
    userId: global.user_id.email,
  };

  global.tasks.push(newTask);
  const { userId, ...sanitizedTask } = newTask;
  // we don't send back the userId! This statement removes it.
  res.status(201).json(sanitizedTask);
}

function deleteTask(req, res) {
  const taskToFind = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  // get a null
  if (!taskToFind) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskToFind && task.userId === global.user_id.email
  );
  // we get the index, not the task, so that we can splice it out
  if (taskIndex === -1) {
    // if no such task
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
    // else it's a 404.
  }

  const task = { userId: global.user_id.email, ...global.tasks[taskIndex] }; // make a copy without userId
  global.tasks.splice(taskIndex, 1); // do the delete
  return res.json(task); // return the entry just deleted.  The default status code, OK, is returned
}

function update(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const taskIdToUpdate = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  if (!taskIdToUpdate) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskIdToUpdate && task.userId === global.user_id.email
  );

  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found or user not owns it" });
  }
  Object.assign(global.tasks[taskIndex], value);
  // global.tasks[taskIndex] = updatedTask;
  const { userId, ...sanitizedTask } = global.tasks[taskIndex];
  res.json(sanitizedTask);
}

module.exports = { create, deleteTask, index, update, show };
