import { Hono } from "hono";
import type { AppEnv } from "../types/context";
import achievements from "./achievements";
import admin from "./admin";
import auditLogs from "./audit-logs";
import authRouter from "./auth";
import certifications from "./certifications";
import customSections from "./custom-sections";
import experiences from "./experiences";
import faculty from "./faculty";
import interests from "./interests";
import me from "./me";
import projects from "./projects";
import results from "./results";
import socials from "./socials";
import students from "./students";
import users from "./users";
import verifications from "./verifications";

const api = new Hono<AppEnv>()
  .route("/auth", authRouter)
  .route("/me", me)
  .route("/users", users)
  .route("/students", students)
  .route("/faculty", faculty)
  .route("/verifications", verifications)
  .route("/admin", admin)
  .route("/achievements", achievements)
  .route("/certifications", certifications)
  .route("/results", results)
  .route("/experiences", experiences)
  .route("/projects", projects)
  .route("/socials", socials)
  .route("/interests", interests)
  .route("/custom-sections", customSections)
  .route("/audit-logs", auditLogs);

export default api;
