import express from "express";
import router from "./src/routes/route.js";
import errorHandler from "./src/middleware/errorHandler.js";


const app = express();
app.use(express.json());
app.use("/", router);
app.use(errorHandler);

app.listen(3000, () => {
    console.log("Server is running on port http://localhost:3000");
});