import { Hono } from "hono";
import type { AppEnv } from "../types/context";
import achievements from "./achievements";
import auditLogs from "./audit-logs";
import authRouter from "./auth";
import certifications from "./certifications";
import cv from "./cv";
import dashboard from "./dashboard";
import experiences from "./experiences";
import faculty from "./faculty";
import me from "./me";
import projects from "./projects";
import results from "./results";
import socials from "./socials";
import students from "./students";
import users from "./users";

const api = new Hono<AppEnv>()
  .route("/auth", authRouter)
  .route("/me", me)
  .route("/users", users)
  .route("/dashboard", dashboard)
  .route("/students", students)
  .route("/faculty", faculty)
  .route("/achievements", achievements)
  .route("/certifications", certifications)
  .route("/results", results)
  .route("/experiences", experiences)
  .route("/projects", projects)
  .route("/socials", socials)
  .route("/cv", cv)
  .route("/audit-logs", auditLogs);

export default api;
