const StatusCodes = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
const prisma = require("../db/prisma");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = {
    id: user.id,
    csrfToken: randomUUID(),
    roles: user.roles || [],
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function createUserWithTasks(userData) {
  return prisma.$transaction(async (tx) => {
    // Create user account (similar to Assignment 6, but using tx instead of prisma)
    const newUser = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        hashedPassword: userData.hashedPassword,
      },
      select: { id: true, email: true, name: true },
    });

    // Create 3 welcome tasks using createMany
    const welcomeTaskData = [
      {
        title: "Complete your profile",
        userId: newUser.id,
        priority: "medium",
      },
      { title: "Add your first task", userId: newUser.id, priority: "high" },
      { title: "Explore the app", userId: newUser.id, priority: "low" },
    ];
    await tx.task.createMany({ data: welcomeTaskData });

    // Fetch the created tasks to return them
    const welcomeTasks = await tx.task.findMany({
      where: {
        userId: newUser.id,
        title: { in: welcomeTaskData.map((t) => t.title) },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        userId: true,
        priority: true,
      },
    });
    return { user: newUser, welcomeTasks };
  });
}
module.exports = { register, logon, logoff, show, googleLogon };

async function register(req, res, next) {
  if (!req.body) req.body = {};
  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "We can't tell if you're a person or a bot." });
  }

  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  value.hashedPassword = await hashPassword(value.password);
  const { name, email, hashedPassword } = value;

  try {
    const result = await createUserWithTasks({ email, name, hashedPassword });
    const csrfToken = setJwtCookie(req, res, result.user);
    res.status(201);
    res.json({
      csrfToken,
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already registered" });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }
}

async function logon(req, res) {
  if (!req.body) req.body = {};
  if (!req.body || !req.body.email || !req.body.password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email and password are required." });
  }

  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  const user = await prisma.user.findUnique({ where: { email } });

  const storedHash = user?.hashedPassword || user?.hashed_password;

  if (!user || !storedHash) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  }

  try {
    if (user) {
      const isMatch = await comparePassword(password, storedHash);
      if (isMatch) {
        const csrfToken = setJwtCookie(req, res, user);

        return res.status(StatusCodes.OK).json({
          name: user.name,
          email: user.email,
          roles: user.roles,
          csrfToken,
        });
      }
    }
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed" });
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: err.message });
  }
}

async function googleLogon(req, res) {
  if (!req.body || !req.body.code) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Authorization code is required." });
  }

  try {
    const googleClient = new OAuth2Client({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      redirectUri: GOOGLE_REDIRECT_URI,
    });

    const { tokens } = await googleClient.getToken(req.body.code);
    googleClient.setCredentials(tokens);

    // verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload.email.trim()) {
      return res
        .status(401)
        .json({ message: "Google user info is not verified" });
    }

    const googleUserEmail = String(payload.email).toLowerCase();
    const googleUserName = payload.name.trim() || googleUserEmail;
    // look up by email
    // if not, create new user with a random password
    const existingUser = await prisma.user.findUnique({
      where: { email: googleUserEmail },
    });

    // create a new user
    if (!existingUser) {
      const hashedPassword = await hashPassword(
        "Fake_Pa$$word_for_gOOgle_l0g0n",
      );

      const newUser = await createUserWithTasks({
        email: googleUserEmail,
        name: googleUserName,
        hashedPassword: hashedPassword,
      });
      const csrfToken = setJwtCookie(req, res, newUser.user);

      return res.status(201).json({
        user: newUser.user,
        welcomeTasks: newUser.welcomeTasks,
        csrfToken: csrfToken,
      });
    }

    // login existing user
    const csrfToken = setJwtCookie(req, res, existingUser);

    return res.status(StatusCodes.OK).json({
      name: existingUser.name,
      email: existingUser.email,
      roles: existingUser.roles,
      csrfToken: csrfToken,
    });
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid Google token" });
  }
}

function logoff(req, res) {
  res.clearCookie("jwt", cookieFlags(req));
  return res.sendStatus(StatusCodes.OK);
}

// show user details and their 5 most recent INCOMPLETE tasks
async function show(req, res) {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
}
