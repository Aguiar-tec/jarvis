import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from 'cloudflare:workers';
import { currentUser } from '@/lib/server/github-auth';

export async function getAuthenticatedUser(){return currentUser(await headers(),env);}
export async function requireUser(){
 const user=await getAuthenticatedUser();
 if(!user)redirect('/login');
 return user;
}
