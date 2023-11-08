const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173","https://assignment-11-785f0.web.app/"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ni8nft9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// custom middlewares
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // MongoDB collections
    const rooms = client.db("Assignment-11").collection("rooms");
    const bookings = client.db("Assignment-11").collection("bookings");
    const ratings = client.db("Assignment-11").collection("ratings");

    // auth related api JWT
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      //expiration time 6 months
      const expirationTime = 6 * 30 * 24 * 60 * 60;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: expirationTime,
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });
    //clear cookie after logout
    app.post("/logout", (req, res) => {
      res.clearCookie("token");
      res.send({ message: "Logout successful" });
    });

    //get rooms
    app.get("/rooms", async (req, res) => {
      const result = await rooms.find().toArray();
      res.send(result);
    });

    //find single room with id
    app.get("/rooms/:id", verifyToken, async (req, res) => {
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
    app.post("/bookings", verifyToken, async (req, res) => {
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
        await rooms.updateOne(query, {
          $set: { availability: updatedAvailability },
        });

        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
      }
    });

    //get my bookings
    app.get("/myBookings/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await bookings.find(query).toArray();
      res.send(result);
    });
    //Delete from my bookings
    app.delete("/myBookings/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookings.deleteOne(query);
      res.send(result);
    });
    //update booking
    app.post("/myBookings/update/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = {
        $set: {
          roomId: data.roomId,
          userEmail: data.userEmail,
          date: data.date,
        },
      };
      const result = await bookings.updateOne(filter, updatedData);

      res.send(result);
    });

    //create ratings
    app.post("/ratings", verifyToken, async (req, res) => {
      const rating = req.body;
      const result = await ratings.insertOne(rating);
      res.send(result);
    });
    //get ratings
    app.get("/ratings", async (req, res) => {
      const result = await ratings.find().toArray();
      res.send(result);
    });
    //get ratings by room id
    app.get("/ratings/:roomId", async (req, res) => {
      const roomId = req.params.roomId;
      const query = { roomId: roomId };
      const result = await ratings.find(query).toArray();
      res.send(result);
    });
    //get ratings count and average by room id
    app.get("/ratings/ratingsCount/:roomId", async (req, res) => {
      const roomId = req.params.roomId;
      const query = { roomId: roomId };
      const result = await ratings.find(query).toArray();
      const Count = result.length || 0;
      // Calculate the total ratings and sum of ratings
      let totalRatings = 0;
      let sumOfRatings = 0;

      for (const rating of result) {
        totalRatings++;
        sumOfRatings += parseInt(rating.rating);
      }
      // Calculate the average rating
      const averageRating = totalRatings > 0 ? sumOfRatings / totalRatings : 0;

      res.send({ ratingsCount: Count, averageRating: averageRating });
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
