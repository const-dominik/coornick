import Head from 'next/head'
import MainRooms from "../components/MainRooms"
import { useEffect, useState, useRef } from 'react'
import { RoomsWithId } from '../types/types';
import { useSocket } from '../hooks/useSocket';
import AuthorizationForm from '../components/Authorization';
import { useAuthContext } from '../lib/authContext';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import styled from 'styled-components';
import Ranking from '../components/Ranking';

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
`;

const IndexContainer = styled.div`
  width: 100%;
  height: 79vh;
  display: flex;
  background: #e6be94;
`

const Home = () => {
  const [rooms, setRooms] = useState<RoomsWithId>([]);
  const prevRooms = useRef<RoomsWithId>([]);
  prevRooms.current = rooms;
  const socket = useSocket();
  const router = useRouter();
  const { isAuthorized } = useAuthContext();

  useEffect(() => {
    fetch("/api/socket");
  }, [])

  useEffect(() => {
    (async () => {
      await fetch("/api/socket");
    })()

    socket.on("newRoom", (newRooms) => {
      setRooms([...prevRooms.current, ...newRooms]);
    });

    socket.on("roomAdded", (id) => {
      router.push(`${id}`);
    })
    
    socket.on("removeRoom", id => {
      setRooms(rooms => {
        return rooms.filter(room => room[0] !== id);
      })
    });

    socket.emit("join");
  }, [socket]);
  
  return (
    <>
      <Head>
        <title>Coornick | Wanna play tic-tac-toe?</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/rooster.ico" />
      </Head>
        <Container>
          {isAuthorized ? 
          <>
          <Header></Header>
            <IndexContainer>
              <MainRooms rooms={rooms}></MainRooms>
              <Ranking /> 
            </IndexContainer>
          <Footer></Footer>
          </> :
          <AuthorizationForm></AuthorizationForm> }
        </Container>
    </>
  )
}

export default Home;