// ...
app.post("/add-to-cart", async (req, res) => {
    const { roomId } = req.body;
  
    try {
      const query = { _id: new ObjectId(roomId) };
      const room = await rooms.findOne(query);
  
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
  
      // Check if the room is available
      if (room.availability <= 0) {
        return res.status(400).json({ error: "Room not available!" });
      }
  
      // Update room availability by decreasing it by 1
      const updatedAvailability = room.availability - 1;
  
      // Update the room's availability
      await rooms.updateOne(query, { $set: { availability: updatedAvailability } });
  
      res.json({ success: "Room added to cart!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  });
  // ...
  