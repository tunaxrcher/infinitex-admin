import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect root path to demo1
  redirect('/demo1');
}

