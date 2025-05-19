// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose'; // Import HydratedDocument and Types
import * as bcrypt from 'bcryptjs';

// Interface for your custom instance methods
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({ timestamps: true })
export class User {
  // _id is implicitly part of HydratedDocument and will be Types.ObjectId
  // No need to declare _id: Types.ObjectId here explicitly unless you have specific reasons

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ default: '' })
  profileImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Define UserDocument using HydratedDocument
// This combines the User class properties, Mongoose document properties (like _id),
// and your custom methods.
export type UserDocument = HydratedDocument<User, IUserMethods>;

// Pre-save hook for password hashing
// Ensure 'this' is typed as UserDocument
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
// Ensure 'this' is typed as UserDocument
UserSchema.methods.comparePassword = async function (this: UserDocument, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};