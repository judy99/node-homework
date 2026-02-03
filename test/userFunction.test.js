require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user ", () => {
  let saveRes = null;
  let csrf = "";
  it("46. It creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent
      .post("/api/users/register")
      .set("X-Recaptcha-Test", process.env.RECAPTCHA_BYPASS)
      .send(newUser);
    expect(saveRes.status).toBe(201);
  });
  it("47. Registration returns an object with the expected name.", async () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  });
  it("48. Test that the returned object includes a csrfToken.", async () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });
  it("49. You can logon as the newly registered user.", async () => {
    saveRes = await agent
      .post("/api/users/logon")
      .send({ email: "jdeere@example.com", password: "Pa$$word20" });
    csrf = saveRes.body.csrfToken;
    expect(saveRes.status).toBe(200);
  });
  it("50. Verify that you are logged in: /api/tasks should not return a 401", async () => {
    saveRes = await agent.get("/api/tasks/").set("X-CSRF-TOKEN", csrf);
    expect(saveRes.status).not.toBe(401);
  });
  it("51. Verify that you can log out.", async () => {
    saveRes = await agent
      .post("/api/users/logoff")
      .set("X-CSRF-TOKEN", csrf)
      .send();
    expect(saveRes.status).toBe(200);
  });
  it("52. Make sure that you are really logged out: /api/tasks should return a 401", async () => {
    saveRes = await agent.get("/api/tasks/").set("X-CSRF-TOKEN", csrf);
    expect(saveRes.status).toBe(401);
  });
});

describe("Manager access to /api/analytics/users", () => {
  let csrf = "";

  it("53. Register a user", async () => {
    saveRes = await agent
      .post("/api/users/register")
      .set("X-Recaptcha-Test", process.env.RECAPTCHA_BYPASS)
      .send({
        name: "Jane Doe",
        email: "janedoe@example.com",
        password: "Pa$$word20",
      });
    expect(saveRes.status).toBe(201);
  });

  it("54. You can logon as the newly registered user.", async () => {
    saveRes = await agent
      .post("/api/users/logon")
      .send({ email: "janedoe@example.com", password: "Pa$$word20" });
    csrf = saveRes.body.csrfToken;
    expect(saveRes.status).toBe(200);
  });

  it("55. Verify that the user doesn't have access to: /api/analytics/users, should return a 403", async () => {
    saveRes = await agent.get("/api/analytics/users").set("X-CSRF-TOKEN", csrf);
    expect(saveRes.status).toBe(403);
  });

  it("56. Update the user's role to manager in the database", async () => {
    await prisma.user.update({
      where: { email: "janedoe@example.com" },
      data: { roles: "manager" },
    });
    const user = await prisma.user.findUnique({
      where: { email: "janedoe@example.com" },
      select: { roles: true },
    });
    expect(user.roles).toBe("manager");
  });

  it("57. Verify that you can log out.", async () => {
    saveRes = await agent
      .post("/api/users/logoff")
      .set("X-CSRF-TOKEN", csrf)
      .send();
    expect(saveRes.status).toBe(200);
  });

  it("58. Logon the user with manager role", async () => {
    saveRes = await agent
      .post("/api/users/logon")
      .send({ email: "janedoe@example.com", password: "Pa$$word20" });
    managerCsrf = saveRes.body.csrfToken;
    expect(saveRes.status).toBe(200);
  });

  it("59. User with manager role can access /api/analytics/users and receives 200", async () => {
    saveRes = await agent
      .get("/api/analytics/users")
      .set("X-CSRF-TOKEN", managerCsrf);
    expect(saveRes.status).toBe(200);
  });
});
