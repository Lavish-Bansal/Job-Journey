import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// universal route
app.get("/", (req, res) => {
  res.send("Welcome!");
});

// routes import
import authRouter from "./routes/authRoutes.js";
import jobsRouter from "./routes/jobsRouter.js";

// middleware import
import notFoundMiddleware from "./middlewares/not-found.js";
import errorHandlerMiddleware from "./middlewares/error-handler.js";
import authenticateUser from "./middlewares/auth.js";

// ------------Security Packages------------ //
import helmet from "helmet";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

app.use(helmet()); // secure Express-app by setting various HTTP headers
app.use(xss()); // node-Connect-middleware to sanitize user input coming from POST body, GET queries, and url params
app.use(mongoSanitize()); // Sanitizes user-supplied data to prevent MongoDB Operator Injection

// routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", authenticateUser, jobsRouter);

// middlewares
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export { app };
