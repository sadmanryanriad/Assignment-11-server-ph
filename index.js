const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ni8nft9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // MongoDB collections
    const rooms = client.db("Assignment-11").collection("rooms");
    const bookings = client.db("Assignment-11").collection("bookings");

    //get rooms
    app.get("/rooms", async (req, res) => {
      const result = await rooms.find().toArray();
      res.send(result);
    });

    //find single room with id
    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await rooms.findOne(query);

        if (result) {
          res.send(result);
        }
      } catch (error) {
        res.status(400).send("Invalid room ID");
      }
    });

    // Book a Room for a Single Day API
    app.post("/bookings", async (req, res) => {
      const { roomId, date, userEmail } = req.body;

      try {
        const query = { _id: new ObjectId(roomId) };
        const room = await rooms.findOne(query);

        //Check if there is any room
        if (!room) {
          return res.status(404).json({ error: "Room not found" });
        }

        // Check if the room is available
        if (room.availability <= 0) {
          return res.status(400).json({ error: "Room not available!" });
        }

        // Perform validation and check availability for the selected date.?
        // If the room is available for the specified date, create a booking record?

        // Create a booking record for the selected date
        const booking = {
          roomId,
          date,
          userEmail,
        };
        // Insert the users booking info into a "bookings" collection
        const result = await bookings.insertOne(booking);

        // Update room availability by decreasing it by 1
        const updatedAvailability = room.availability - 1;
        await rooms.updateOne(query, { $set: { availability: updatedAvailability } });

        res.json(result);

      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
      }
    });

    //get my bookings 
    app.get("/myBookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await bookings.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
