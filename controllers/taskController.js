const StatusCodes = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

async function index(req, res) {
  const tasks = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE user_id = $1`,
    [global.user_id]
  );
  if (!tasks || !tasks.rows.length) {
    return res
      .status(404)
      .json({ message: "No tasks were find for logged in user" }); // return empty array if no tasks found
  }
  return res.status(200).json(tasks.rows);
}

async function show(req, res) {
  const taskId = parseInt(req.params?.id);
  if (!taskId) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }
  const tasks = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE user_id = $1 AND id = $2`,
    [global.user_id, taskId]
  );
  if (!tasks || !tasks.rows.length) {
    return res
      .status(404)
      .json({ message: "No task were find for logged in user" }); // return empty array if no tasks found
  }
  res.json(tasks.rows[0]);
}

async function create(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const task = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id]
  );
  return res.status(201).json(task.rows[0]);
}

async function deleteTask(req, res) {
  const taskToFind = parseInt(req.params?.id);
  if (!taskToFind) {
    return res
      .status(404)
      .json({ message: "The task ID passed is not found." });
  }

  // filter on user_id
  const tasks = await pool.query(
    `SELECT id, title, is_completed FROM tasks WHERE user_id = $1`,
    [global.user_id]
  );

  // filter on task id
  const taskToDelete = tasks.rows.find((task) => task.id === taskToFind);
  if (!taskToDelete) {
    return res
      .status(404)
      .json({ message: "The task ID passed is not found." });
  }

  const task = await pool.query(`DELETE FROM tasks WHERE id = $1`, [
    taskToDelete.id,
  ]);
  return res.json(task); // return the entry just deleted.  The default status code, OK, is returned
}

async function update(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });

  const taskIdToUpdate = parseInt(req.params?.id); // if there are no params, the ? makes sure that you
  if (!taskIdToUpdate) {
    return res
      .status(404)
      .json({ message: "The task ID passed is not valid." });
  }

  const oldKeys = Object.keys(value);
  const keys = oldKeys.map((key) =>
    key === "isCompleted" ? "is_completed" : key
  );
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const idParm = `$${keys.length + 1}`;
  const userParm = `$${keys.length + 2}`;
  const updatedTask = await pool.query(
    `UPDATE tasks SET ${setClauses} 
  WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`,
    [...Object.values(value), req.params.id, global.user_id]
  );
  if (updatedTask.rowCount === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found or user not owns it" });
  }
  return res.json(updatedTask.rows[0]);
}

module.exports = { create, deleteTask, index, update, show };
