import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import dbConnect from '@/util/dbConnect'; 
import { getUserByEmail } from './models/Users';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                },
                password: {
                    label: 'Password',
                    type: 'password',
                },
            },
            authorize: async (credentials) => {
              const email = credentials.email as string | undefined
              const password = credentials.password as string | undefined

                if (!email || !password) {
                    throw new CredentialsSignin('Please provide both email and password');
                }

             
                    await dbConnect();
                    
                    const user = await getUserByEmail(email);

                    if (!user) {
                        throw new CredentialsSignin('Invalid Email or Password');
                    }

                    const isMatch = await compare(password, user.password);

                    if (!isMatch) {
                        throw new CredentialsSignin('Invalid Email or Password');
                    }

                    return { name: user.name, email: user.email };
            
            },
        }),
    ],
});
