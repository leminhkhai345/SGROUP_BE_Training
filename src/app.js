import express from "express";
import router from "./routes/route.js";
import errorHandler from "./middleware/errorHandler.js";
import { NotFoundError } from "./core/error.response.js";

const app = express();
app.use(express.json());
app.use("/", router);
app.use((req, res, next) => next(new NotFoundError("Route not found")));
app.use(errorHandler);
export default app;
