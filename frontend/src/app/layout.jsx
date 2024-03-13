import './globals.css'
import { Poppins } from 'next/font/google'
import styles from './layout.module.css'

const poppins = Poppins({
  weight: ['100', '200', '300','400', '500', '600', '700'],
  subsets: ['latin'],
})

export const metadata = {
  title: 'Streaming Code Test',
  description: 'A simple chat app that streams data from the server to the client using Server-Sent Events (SSE).',
  favicon: '/favicon.ico',
}

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={poppins.className}>
        <header className={styles.layoutHeader}>
          <h1>Live Chat Stream</h1>
        </header>
        {children}
      </body>
    </html>
  )
}
