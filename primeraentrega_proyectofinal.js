const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port = 8080;

app.use(express.json());

const productsFilePath = path.join(__dirname, 'productos.json');
const cartsFilePath = path.join(__dirname, 'carrito.json');


let products = loadFromJSON(productsFilePath) || [];
let carts = loadFromJSON(cartsFilePath) || [];


function loadFromJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}


function saveToJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}


app.use((req, res, next) => {
  saveToJSON(productsFilePath, products);
  saveToJSON(cartsFilePath, carts);
  next();
});


function findCart(req, res, next) {
  const { cid } = req.params;
  const cart = carts.find((cart) => cart.id === cid);
  if (!cart) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }
  req.cart = cart;
  next();
}


function findProduct(req, res, next) {
  const { pid } = req.params;
  const product = products.find((product) => product.id === pid);
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  req.product = product;
  next();
}


const productsRouter = express.Router();
app.use('/api/products', productsRouter);

productsRouter.get('/', (req, res) => {
  const { limit } = req.query;
  let productList = products;
  if (limit) {
    productList = productList.slice(0, limit);
  }
  res.json(productList);
});

productsRouter.get('/:pid', findProduct, (req, res) => {
  res.json(req.product);
});

productsRouter.post('/', (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } = req.body;
  const id = Math.random().toString(36).substring(2);
  const newProduct = {
    id,
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

productsRouter.put('/:pid', findProduct, (req, res) => {
  const { title, description, code, price, stock, category, thumbnails } = req.body;
  const productToUpdate = req.product;
  productToUpdate.title = title;
  productToUpdate.description = description;
  productToUpdate.code = code;
  productToUpdate.price = price;
  productToUpdate.stock = stock;
  productToUpdate.category = category;
  productToUpdate.thumbnails = thumbnails;
  res.json(productToUpdate);
});

productsRouter.delete('/:pid', findProduct, (req, res) => {
  const index = products.indexOf(req.product);
  products.splice(index, 1);
  res.json({ message: 'Producto eliminado' });
})

const cartsRouter = express.Router();
app.use('/api/carts', cartsRouter);

cartsRouter.post('/', (req, res) => {
  const id = Math.random().toString(36).substring(2);
  const newCart = {
    id,
    products: [],
  };
  carts.push(newCart);
  res.status(201).json(newCart);
});

cartsRouter.get('/:cid', findCart, (req, res) => {
  res.json(req.cart.products);
});

cartsRouter.post('/:cid/product/:pid', findCart, findProduct, (req, res) => {
  const { quantity } = req.body;
  const cart = req.cart;
  const product = req.product;
  const cartProduct = {
    product: product.id,
    quantity,
  };
  cart.products.push(cartProduct);
  res.status(201).json(cartProduct);
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
