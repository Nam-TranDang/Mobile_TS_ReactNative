import { connectDB } from "./lib/db.js"; // Adjust path to your connectDB function
import Genre from "./models/genre.js"; // Adjust path to your Genre model
import mongoose from "mongoose";

// File nay dung de add auto - genre vao mongo --> file nay standalone voi backend, co the chay doc lap node src/seed.js 

// import cai nay de no biet config cuar mongo db - load configue cua env
import dotenv from "dotenv";
dotenv.config();


// List of 21 genres from your Genre model's enum
const genres = [
  "Textbook",
  "Biography",
  "Non-fiction",
  "Fiction",
  "Self-help",
  "Anime & Comic",
  "Health",
  "Food & Cooking",
  "History",
  "Science",
  "Technology",
  "Business & Finance",
  "Romance",
  "Adventure",
  "Horror",
  "Poetry",
  "Children's",
  "Young Adult",
  "Travel",
  "Religion",
  "Art & Photography",
];

// Function to seed genres into the 'genres' collection
async function seedGenres() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Check for existing genres to avoid duplicates 
    const existingGenres = await Genre.find({ genre_name: { $in: genres } });
    const existingGenreNames = existingGenres.map((genre) => genre.genre_name);

    // Filter out genres that already exist
    const genresToInsert = genres.filter((genre) => !existingGenreNames.includes(genre));

    if (genresToInsert.length === 0) {
      console.log("All genres already exist in the 'genres' collection.");
      return;
    }

    // Prepare genre documents
    const genreDocs = genresToInsert.map((name) => ({
      genre_name: name,
      soft_delete: false,
    }));

    // Insert genres into the 'genres' collection
    await Genre.insertMany(genreDocs);
    console.log(`${genresToInsert.length} genres inserted successfully into the 'genres' collection:`);
    console.log(genresToInsert);

  } catch (error) {
    console.error("Error seeding genres:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
}

// Run the seed functionSS
seedGenres();