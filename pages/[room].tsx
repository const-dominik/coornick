import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import PasswordForm from '../components/PasswordForm';
import RoomPage from '../components/RoomPage';
import type { Room } from '../types/types';
import { useSocket } from '../hooks/useSocket';
import { useAuthContext } from '../lib/authContext';
import AuthorizationForm from '../components/Authorization';
import Cookies from 'js-cookie';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Room = () => {
  const socket = useSocket();
  const router = useRouter();
  const { room } = router.query;
  const [doesRouteActuallyExist, setRouteExistance] = useState(true);
  const [roomId, setRoomId] = useState(room);
  const [requiresPassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [roomData, setRoom] = useState<Room>();
  const { isAuthorized } = useAuthContext();

  useEffect(() => {
    fetch("/api/socket").finally(() => {
      const jwt = Cookies.get("token");
      if (!jwt) return;

      socket.on("roomData", (room) => {
        setRequirePassword(false);
        setRoom(room);
      });
      
      socket.on("roomError", () => {
        setRouteExistance(false);
      })
  
      socket.on("roomRequiresPassword", () => {
        setRequirePassword(true);
      });
  
      socket.on("roomData", (room) => {
        setRequirePassword(false);
        setRoom(room);
      });

      emitInitialGetRoom();
    });
  }, [])

  const emitInitialGetRoom = (): void | ReturnType<typeof setTimeout> => {
    const jwt = Cookies.get("token");
    if (!jwt || (typeof roomId !== "string" && !window.location.pathname)) {
      return setTimeout(emitInitialGetRoom, 100);
    }
    const id = window.location.pathname.slice(1);
    setRoomId(id);
    socket.emit("getRoom", id, undefined, jwt);
  }

  useEffect(() => {
    emitInitialGetRoom();
  }, [router.isReady]);

  useEffect(() => {
    if (router.isReady && typeof roomId === "string") {
      socket.emit("doesRoomExist", roomId);
    }
    if (!doesRouteActuallyExist) {
      router.push("/404");
    }
  }, [doesRouteActuallyExist, router, router.isReady])
  
  return (
    <>
      <Head>
        <title>Coornick | Playin&apos; tic-tac-toe</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/rooster.ico" />
      </Head>
      <div>
        {!doesRouteActuallyExist ? (<div>This room doesn&apos;t exist.</div>) :
          isAuthorized ?
          <>
          <Header></Header>
            { requiresPassword && typeof roomId === "string" && <PasswordForm id={roomId} setPassword={setPassword} ></PasswordForm> }
            { !requiresPassword && roomData && <RoomPage room={roomData} password={password}/> }
          <Footer></Footer>
          </> : <AuthorizationForm/>
        }
      </div>
    </>
  )
}

export default Room;