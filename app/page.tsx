import { requireUser } from './auth';
import JarvisApp from '@/components/jarvis/app';
export const dynamic='force-dynamic';
export default async function Page(){
 const user=await requireUser();
 return <JarvisApp initialName={user.displayName.split(' ')[0].slice(0,80)||user.login} />;
}
