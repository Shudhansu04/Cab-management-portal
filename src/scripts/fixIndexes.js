import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndexes() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const cabsCollection = db.collection('cabs');

    // Get all indexes
    const indexes = await cabsCollection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the old cabNumber index if it exists
    try {
      await cabsCollection.dropIndex('cabNumber_1');
      console.log('✅ Dropped old cabNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  cabNumber_1 index does not exist');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Ensure cabId index exists
    try {
      await cabsCollection.createIndex({ cabId: 1 }, { unique: true });
      console.log('✅ Ensured cabId unique index exists');
    } catch (error) {
      console.log('⚠️  Error creating cabId index:', error.message);
    }

    console.log('\n✅ Index fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();

