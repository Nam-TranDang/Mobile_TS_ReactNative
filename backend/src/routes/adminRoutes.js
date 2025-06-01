// chinh sua thong tin admin - xoa user - deactive - xoa bai viet - chinh sua genre 
import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import isAdmin from "../middleware/admin.middleware.js";
import Genre from "../models/genre.js";
import mongoose from "mongoose";

const router = express.Router();

// cap quyen admin 

// chinh sua xoa genre 
// CRUD genre --> doiovoi

// Helper function to normalize genre_name to a consistent format (e.g., "Textbook", "Business & Finance")
const normalizeGenreName = (name) => {
  if (!name || typeof name !== "string") return name;
  return name
    .trim()
    .split(/(\s+|\&\s+)/) // Split on spaces or "&" with surrounding spaces
    .map((word, index, arr) => {
      // Preserve "&" and spaces between words
      if (word.match(/^\s+$/) || word.match(/^\&\s*$/)) return word;
      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
};

router.get("/genres", protectRoute, isAdmin, async (req, res) => {
  try {
    const genres = await Genre.find({ soft_delete: false }) // neu chua xoa mem thi get 
      .select("genre_name _id") // select ten va id tu mongo
      .sort({ genre_name: 1 }); // Sort alphabetically 

    if (!genres || genres.length === 0) {
      return res.status(404).json({ message: "No genres found" });
    }

    res.status(200).json(genres);
  } catch (error) {
    console.error("Error fetching genres:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/genres", protectRoute, isAdmin, async (req, res) => {
  try {
    const { genre_name } = req.body;

    // Validate required field
    if (!genre_name || typeof genre_name !== "string" || genre_name.trim() === "") {
      return res.status(400).json({ message: "Genre name is required and must be a non-empty string" });
    }

    const trimmedGenreName = genre_name.trim();
    const normalizedGenreName = normalizeGenreName(trimmedGenreName);

    // Case-insensitive duplicate check
    const existingGenre = await Genre.findOne({
      genre_name: { $regex: `^${trimmedGenreName}$`, $options: "i" },
      soft_delete: false,
    });

    if (existingGenre) {
      return res.status(400).json({
        message: `Genre '${trimmedGenreName}' already exists as '${existingGenre.genre_name}'`,
      });
    }

    // Create new genre with normalized name
    const newGenre = new Genre({
      genre_name: normalizedGenreName,
      soft_delete: false,
    });

    await newGenre.save();
    res.status(201).json(newGenre);
  } catch (error) {
    console.error("Error creating genre:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update - voi req param cua id do
// khong xoa genre --> chi de soft delete de reference book co the hoat dong 
router.patch("/genres/:id", protectRoute, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { genre_name, soft_delete } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid genre ID format" });
    }

    // Find the genre
    const genre = await Genre.findById(id);
    if (!genre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    // Case 1 & 3: If soft_delete is false, allow normal updates
    if (!genre.soft_delete) {
      // Handle genre_name update if provided
      if (genre_name !== undefined) {
        if (typeof genre_name !== "string" || genre_name.trim() === "") {
          return res.status(400).json({ message: "Genre name must be a non-empty string" });
        }

        const trimmedGenreName = genre_name.trim();
        const normalizedGenreName = normalizeGenreName(trimmedGenreName);

        // Case-insensitive duplicate check, excluding the current genre
        const existingGenre = await Genre.findOne({
          genre_name: { $regex: `^${trimmedGenreName}$`, $options: "i" },
          soft_delete: false,
          _id: { $ne: id },
        });

        if (existingGenre) {
          return res.status(400).json({
            message: `Genre '${trimmedGenreName}' already exists as '${existingGenre.genre_name}'`,
          });
        }

        genre.genre_name = normalizedGenreName;
      }

      // Handle soft_delete update if provided (can set to true to deactivate)
      if (soft_delete !== undefined) {
        if (typeof soft_delete !== "boolean") {
          return res.status(400).json({ message: "soft_delete must be a boolean value (true or false)" });
        }
        genre.soft_delete = soft_delete; // Can be true or false when soft_delete is false
      }
    } else {
      // Case 2: If soft_delete is true, only allow setting soft_delete to false and optionally update genre_name
      if (soft_delete !== undefined) {
        if (typeof soft_delete !== "boolean") {
          return res.status(400).json({ message: "soft_delete must be a boolean value (true or false)" });
        }
        if (soft_delete !== false) {
          return res.status(400).json({ message: "Cannot update a deleted genre; set soft_delete to false to reactivate and modify" });
        }
        // Allow updating genre_name only if reactivating
        if (genre_name !== undefined) {
          if (typeof genre_name !== "string" || genre_name.trim() === "") {
            return res.status(400).json({ message: "Genre name must be a non-empty string" });
          }

          const trimmedGenreName = genre_name.trim();
          const normalizedGenreName = normalizeGenreName(trimmedGenreName);

          // Case-insensitive duplicate check, excluding the current genre
          const existingGenre = await Genre.findOne({
            genre_name: { $regex: `^${trimmedGenreName}$`, $options: "i" },
            soft_delete: false,
            _id: { $ne: id },
          });

          if (existingGenre) {
            return res.status(400).json({
              message: `Genre '${trimmedGenreName}' already exists as '${existingGenre.genre_name}'`,
            });
          }

          genre.genre_name = normalizedGenreName;
        }
        genre.soft_delete = false; // Reactivate the genre
      } else {
        // No soft_delete change requested, no updates allowed
        return res.status(400).json({ message: "Cannot update a deleted genre; set soft_delete to false to reactivate and modify" });
      }
    }

    await genre.save();
    res.status(200).json(genre);
  } catch (error) {
    console.error("Error updating genre:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      params: req.params,
    });
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
