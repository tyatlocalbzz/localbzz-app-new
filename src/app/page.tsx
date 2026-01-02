import { redirect } from 'next/navigation'

// Root page - middleware handles auth redirect
export default function Home() {
  // This shouldn't be reached if middleware is working
  // but fallback to login just in case
  redirect('/auth/login')
}
