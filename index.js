const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require('jsonwebtoken');
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gp9ypzc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("raf-IT").collection("users");
    const salaryCollection = client.db("raf-IT").collection("salary");

    app.post('/jwt', async (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token });
      })

      const verifyToken = (req, res, next) => {
        console.log('inside verify token', req.headers.authorization);
        if (!req.headers.authorization) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next();
        })
      }
  
      const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if (!isAdmin) {
          return res.status(403).send({ message: 'forbidden access' });
        }
        next();
      }

      app.get('/users/admin/:email',  async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.role === 'admin';
        }
        res.send({ admin });
      })
      app.get('/users/hr/:email',  async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let hr = false;
        if (user) {
          hr = user?.role === 'HR';
        }
        res.send({ hr });
      })

      app.post('/users', async (req, res) => {
        const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
        const result = await userCollection.insertOne(user);
        res.send(result);
      });

      app.post('/salary', async (req, res) => {
        const user = req.body;
        const {email,formattedResult}= req.body;

        const query = { email: user.email }
        const existingUser = await salaryCollection.findOne(query);
        if (existingUser) {
          const result = await salaryCollection.updateOne(
            { _id: existingUser._id },
            { $push: { salaryDetails:  formattedResult  } }
          );
          res.send(result);
        }
        else
        {
          const result = await salaryCollection.insertOne({
            email,
            salaryDetails: [formattedResult],
          });
        res.send(result);
        }
        
      });

      app.get("/users", async (req, res) => {

        const cursor =userCollection.find();
        const rest = await cursor.toArray();
        res.send(rest);
      });

      app.get("/users/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.findOne(query);
        res.send(result);
      });
      app.get("/users/role/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.findOne(query);
        res.send(result);
      });
      app.get("/users/verified/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.findOne(query);
        res.send(result);
      });

      app.patch('/users/role/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            role: 'HR'
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })
      app.patch('/users/fire/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            isFire: true
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })
      app.patch('/users/verified/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const existingDoc = await userCollection.findOne(filter);
        const updatedValue = !existingDoc.isVerified;
        const updatedDoc = {
          $set: {
            isVerified: updatedValue
          }
        }
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("server running");
  });
  
  app.listen(port, () => {
    console.log(`Raf IT is running on port:${port}`);
  });