import app from "./src/app.js";
import { config } from "./src/config/env.config.js";

app.listen(config.app.port, () => {
  console.log(`Server is running on port http://localhost:${config.app.port}`);
});
