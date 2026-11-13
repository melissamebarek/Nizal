const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const articlesRoutes = require("./routes/articlesRouter");

const productsRoutes = require("./routes/productsRouter");

const competitionsRoutes = require("./routes/competitionsRouter");

const orderRoutes = require("./routes/orderRouter");

const registrationRoutes = require("./routes/registrationRouter");

app.use("/api/registrations", registrationRoutes);


app.use("/api/articles", articlesRoutes);

app.use("/api/products", productsRoutes);

app.use("/api/orders", orderRoutes);                            

app.use("/api/competitions", competitionsRoutes);


module.exports = app;

