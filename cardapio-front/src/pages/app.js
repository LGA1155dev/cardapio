const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Rotas
app.use("/auth", authRoutes);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

module.exports = app;