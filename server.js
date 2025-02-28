import express from "express";
import dotenv from "dotenv";

const config = dotenv.config({ path: `${process.env.NODE_ENV}.env` }).parsed;
const PORT = config.PORT;
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello Wbborld!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
