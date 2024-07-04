import { NextResponse } from 'next/server';
import { UserModel as User } from '@/models/Users';
import connectDB from '@/util/dbConnect';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        // Parse JSON body from the request
        const { name, email, password } = await request.json();

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
        }

        // Connect to MongoDB
        await connectDB();

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        // Hash the password before saving it to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user instance and save it to the database
        const newUser = new User({name, email, password: hashedPassword });
        await newUser.save();

        // Return success response
        return NextResponse.json({ success: true, message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        // Return server error response
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
