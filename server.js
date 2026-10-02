const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "data.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

const defaultData = {
  settings: {
    cafeName: "Craving Bite Cafe",
    tagline: "Big flavor. Zero compromise.",
    location: "Mansehra",
    whatsapp: "923109067376",
    phone: "03109067376",
    deliveryFee: 100,
    bankName: "Easypaisa",
    accountTitle: "Craving Bite Cafe",
    accountNumber: "03109067376",
    iban: "",
    opening: "11:00 AM",
    closing: "11:00 PM",
    about: "Fresh burgers, shawarma, fries & drinks.",
    banner: "Fresh • Hot • Cravable"
  },

  menu: [
    {
      id: 1,
      cat: "Burgers",
      name: "Zinger Burger",
      price: 420,
      emoji: "🍔",
      desc: "Crispy chicken, lettuce & signature sauce.",
      available: true,
      best: true
    },
    {
      id: 2,
      cat: "Burgers",
      name: "Classic Chicken Burger",
      price: 350,
      emoji: "🍔",
      desc: "Juicy chicken patty with fresh toppings.",
      available: true,
      best: false
    },
    {
      id: 3,
      cat: "Burgers",
      name: "Double Zinger",
      price: 620,
      emoji: "🍔",
      desc: "Double crispy chicken with extra cheese.",
      available: true,
      best: true
    },
    {
      id: 4,
      cat: "Shawarma",
      name: "Chicken Shawarma",
      price: 300,
      emoji: "🌯",
      desc: "Tender chicken, veggies & creamy sauce.",
      available: true,
      best: true
    },
    {
      id: 5,
      cat: "Shawarma",
      name: "Cheese Shawarma",
      price: 360,
      emoji: "🌯",
      desc: "Loaded shawarma with melted cheese.",
      available: true,
      best: false
    },
    {
      id: 6,
      cat: "Fries",
      name: "Regular Fries",
      price: 180,
      emoji: "🍟",
      desc: "Golden, crispy & perfectly salted.",
      available: true,
      best: false
    },
    {
      id: 7,
      cat: "Fries",
      name: "Loaded Fries",
      price: 320,
      emoji: "🍟",
      desc: "Fries loaded with cheese & signature sauce.",
      available: true,
      best: true
    },
    {
      id: 8,
      cat: "Drinks",
      name: "Cold Drink",
      price: 120,
      emoji: "🥤",
      desc: "Chilled soft drink.",
      available: true,
      best: false
    },
    {
      id: 9,
      cat: "Drinks",
      name: "Mineral Water",
      price: 80,
      emoji: "💧",
      desc: "Chilled bottled water.",
      available: true,
      best: false
    }
  ],

  coupons: [
    {
      id: 1,
      code: "CBC10",
      type: "percent",
      value: 10,
      active: true
    }
  ],

  orders: [],
  customers: []
};

function read() {
  return JSON.parse(fs.readFileSync(DB, "utf8"));
}

function write(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

if (!fs.existsSync(DB)) {
  write(defaultData);
}

function auth(req, res, next) {
  if (req.headers["x-admin-key"] !== "CBC-V5-ADMIN-KEY") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

app.get("/api/config", (req, res) => {
  const data = read();

  res.json({
    settings: data.settings,
    menu: data.menu.filter(item => item.available),
    coupons: data.coupons.filter(coupon => coupon.active)
  });
});

app.post("/api/orders", (req, res) => {
  const data = read();
  const body = req.body;

  if (!body.name || !body.phone || !body.items?.length) {
    return res.status(400).json({
      error: "Missing information"
    });
  }

  const order = {
    ...body,
    id: "CBC-" + Date.now().toString().slice(-7),
    status: "Received",
    createdAt: new Date().toISOString()
  };

  data.orders.unshift(order);

  const customer = data.customers.find(
    item => item.phone === body.phone
  );

  if (customer) {
    customer.orders++;
    customer.spent += body.total;
    customer.lastOrder = order.createdAt;
  } else {
    data.customers.push({
      id: crypto.randomUUID(),
      name: body.name,
      phone: body.phone,
      orders: 1,
      spent: body.total,
      lastOrder: order.createdAt
    });
  }

  write(data);

  res.json(order);
});

app.post("/api/admin/login", (req, res) => {
  if (req.body?.password === "cravingbiteadmin") {
    return res.json({
      key: "CBC-V5-ADMIN-KEY"
    });
  }

  res.status(401).json({
    error: "Invalid password"
  });
});

app.use("/api/admin", auth);

app.get("/api/admin/all", (req, res) => {
  res.json(read());
});

app.put("/api/admin/settings", (req, res) => {
  const data = read();

  data.settings = {
    ...data.settings,
    ...req.body
  };

  write(data);

  res.json(data.settings);
});

app.post("/api/admin/menu", (req, res) => {
  const data = read();

  const item = {
    ...req.body,
    id: Date.now()
  };

  data.menu.push(item);

  write(data);

  res.json(item);
});

app.put("/api/admin/menu/:id", (req, res) => {
  const data = read();

  const item = data.menu.find(
    x => x.id == req.params.id
  );

  if (!item) {
    return res.status(404).json({
      error: "Not found"
    });
  }

  Object.assign(item, req.body);

  write(data);

  res.json(item);
});

app.delete("/api/admin/menu/:id", (req, res) => {
  const data = read();

  data.menu = data.menu.filter(
    x => x.id != req.params.id
  );

  write(data);

  res.json({
    ok: true
  });
});

app.post("/api/admin/coupons", (req, res) => {
  const data = read();

  const coupon = {
    id: Date.now(),
    ...req.body
  };

  data.coupons.push(coupon);

  write(data);

  res.json(coupon);
});

app.put("/api/admin/coupons/:id", (req, res) => {
  const data = read();

  const coupon = data.coupons.find(
    x => x.id == req.params.id
  );

  if (!coupon) {
    return res.status(404).json({
      error: "Not found"
    });
  }

  Object.assign(coupon, req.body);

  write(data);

  res.json(coupon);
});

app.delete("/api/admin/coupons/:id", (req, res) => {
  const data = read();

  data.coupons = data.coupons.filter(
    x => x.id != req.params.id
  );

  write(data);

  res.json({
    ok: true
  });
});

app.put("/api/admin/orders/:id", (req, res) => {
  const data = read();

  const order = data.orders.find(
    x => x.id === req.params.id
  );

  if (!order) {
    return res.status(404).json({
      error: "Not found"
    });
  }

  Object.assign(order, req.body);

  write(data);

  res.json(order);
});

/* Render / production health check */
app.get("/health", (req, res) => {
  res.status(200).send("Craving Bite
