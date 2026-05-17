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

const api = new Hono<AppEnv>();

api.route("/auth", authRouter);
api.route("/me", me);
api.route("/users", users);
api.route("/dashboard", dashboard);
api.route("/students", students);
api.route("/faculty", faculty);
api.route("/achievements", achievements);
api.route("/certifications", certifications);
api.route("/results", results);
api.route("/experiences", experiences);
api.route("/projects", projects);
api.route("/socials", socials);
api.route("/cv", cv);
api.route("/audit-logs", auditLogs);

export default api;
