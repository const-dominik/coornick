import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SocketProvider } from '../lib/socketContext'
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useSocket } from '../hooks/useSocket';
import { AuthContext } from '../lib/authContext';

export default function App({ Component, pageProps }: AppProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const socket = useSocket();

  useEffect(() => {
    socket.on("isTokenOk", (isOk) => {
      setIsAuthorized(isOk);
    })

    const token = Cookies.get("token");
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    socket.emit("checkTokenValidity", token);
  }, [socket])
  
  return (
    <SocketProvider>
      <AuthContext.Provider value={{
        isAuthorized,
        setIsAuthorized
      }}>
          <Component {...pageProps} />
      </AuthContext.Provider>
    </SocketProvider>
  )
}
