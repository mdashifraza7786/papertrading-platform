import connectDB from '@/util/dbConnect';
import { UserModel as LoginUserModel } from '@/models/Users';
import { compare } from 'bcrypt';
import { signIn } from '@/auth';
import { CredentialsSignin } from 'next-auth';
import { NextResponse } from 'next/server';

interface Cred{
    email: string | undefined;
    password : string | undefined;
}

export async function POST(request:Request) {
  try {
    const incommingCredentials = await request.json();
    const email = incommingCredentials.email as string | undefined;
    const password = incommingCredentials.password as string | undefined;

    if (!email || !password) {
      return NextResponse.json({ error: 'Please provide both email and password' });
    }

    await connectDB();

    const user = await LoginUserModel.findOne({ email });

    if (!user) {
      return NextResponse.json({success:"false", message: 'User not found' });
    }
    if (!user.password) {
        return NextResponse.json({ success:"false", message: 'Incorrect Password' });
      }
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ success:"false", message: 'Incorrect password' });
    }

    try {
      await signIn('credentials', {
        email,
        password,
        redirect: false
      });
      return NextResponse.json({ success:"ok", message: 'Login successful' });

    } catch (error) {
      const err = error as CredentialsSignin;
      return NextResponse.json({success:"false", message:err});
    }

  } catch (error) {
    return NextResponse.json({ success:"false", message: 'Internal Server Error' });
  }
}