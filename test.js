// Book a Room for a Single Day API
app.post("/bookings", async (req, res) => {
    const { roomId, date, user } = req.body;
  
    try {
      const query = { _id: new ObjectId(roomId) };
      const room = await rooms.findOne(query);
  
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
  
      // Perform validation and check availability for the selected date.
      // If the room is available for the specified date, create a booking record.
  
      // Example date validation code:
      if (room.availability === 0) {
        return res.status(400).json({ error: "Room not available!" });
      }
  
      // Create a booking record for the selected date
      const booking = {
        roomId,
        date,
        user,
      };
      // Insert the booking into a "bookings" collection
      // Update the room's availability accordingly
  
      res.json({ message: "Booking successful", booking });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });
  