const prisma = require("../db/prisma");

async function getUserAnalytics(req, res) {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ message: "The task ID passed is not valid." });
  }

  if (!prisma.user.findUnique({ where: { id: userId } })) {
    return res.status(404).json({ error: "User not found" });
  }

  // Use groupBy to count tasks by completion status
  const taskStats = await prisma.task.groupBy({
    by: ["isCompleted"],
    where: { userId },
    _count: {
      id: true,
    },
  });

  // Include recent task activity with eager loading
  const recentTasks = await prisma.task.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true,
      User: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Calculate weekly progress using groupBy
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
  const weeklyProgress = await prisma.task.groupBy({
    by: ["createdAt"],
    where: {
      userId,
      createdAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
  });

  res.status(200).json({
    taskStats,
    recentTasks,
    weeklyProgress,
  });
  return;
}

async function getUsersWithStats(req, res) {
  // Parse pagination parameters (similar to how you did in the task index method in section 3 above)
  // Hint: Parse page and limit from req.query, calculate skip
  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build where clause with optional search filter
  const whereClause = { userId: req.user.id };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find, // Matches %find% pattern
      mode: "insensitive", // Case-insensitive search (ILIKE in PostgreSQL)
    };
  }

  // Get users with task counts using _count aggregation
  // Note: In Prisma, you need to use include for relations, then transform the result
  const usersRaw = await prisma.user.findMany({
    include: {
      Task: {
        where: { isCompleted: false },
        select: { id: true },
        take: 5,
      },
      _count: {
        select: {
          Task: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // Transform to only include the fields we want
  const users = usersRaw.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    _count: user._count,
    Task: user.Task,
  }));

  // Get total count for pagination
  const totalUsers = await prisma.user.count();

  const pagination = {
    page,
    limit,
    total: totalUsers,
    pages: Math.ceil(totalUsers / limit),
    hasNext: page * limit < totalUsers,
    hasPrev: page > 1,
  };

  // Return tasks with pagination information
  return res.status(200).json({
    users,
    pagination,
  });
}

async function searchTasks(req, res) {
  const searchQuery = req.query.q;
  if (!searchQuery || searchQuery.trim().length < 2) {
    return res.status(400).json({
      error: "Search query must be at least 2 characters long",
    });
  }

  // Get limit from query (default to 20)
  const limit = parseInt(req.query.limit) || 20;

  // Construct search patterns outside the query for proper parameterization
  const searchPattern = `%${searchQuery}%`;
  const exactMatch = searchQuery;
  const startsWith = `${searchQuery}%`;

  // Use raw SQL for complex text search with parameterized queries
  const searchResults = await prisma.$queryRaw`
  SELECT 
    t.id,
    t.title,
    t.is_completed as "isCompleted",
    t.priority,
    t.created_at as "createdAt",
    t.user_id as "userId",
    u.name as "user_name"
  FROM tasks t
  JOIN users u ON t.user_id = u.id
  WHERE t.title ILIKE ${searchPattern} 
     OR u.name ILIKE ${searchPattern}
  ORDER BY 
    CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startsWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT ${parseInt(limit)}
`;

  // Return results with query and count
  // Hint: The test expects results array, query string, and count number
  res.status(200).json({
    results: searchResults,
    query: searchQuery,
    count: searchResults.length,
  });
}

module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };
