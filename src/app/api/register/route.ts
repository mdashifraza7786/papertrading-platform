import { NextResponse } from 'next/server';
import { UserModel as User } from '@/models/Users';
import connectDB from '@/util/dbConnect';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Please provide all required fields' }, { status: 400 });
        }

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({name, email, password: hashedPassword });
        await newUser.save();

        return NextResponse.json({ success: true, message: 'User registered successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
