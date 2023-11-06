const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require('cookie-parser');

const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ni8nft9.mongodb.net/?retryWrites=true&w=majority`;

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

    const rooms = client.db("Assignment-11").collection("rooms");


    //get rooms
    app.get("/rooms", async (req, res) => {
        const result = await rooms.find().toArray();
        res.send(result);
      });

    //find room with id
        app.get("/rooms/:id", async (req, res) => {
            const id = req.params.id;   
            const query = { _id: new ObjectId(id) };
            const result = await rooms.find(query).toArray();
            res.send(result);
          });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});