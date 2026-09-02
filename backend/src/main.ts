import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import runsRouter from "./routes/runs.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", runsRouter);

app.listen(3001, () =>
  console.log("Backend Engine running on http://localhost:3001"),
);
