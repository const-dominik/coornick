import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { DecodedJWT, ProfileData } from "../types/types";
import Header from "../components/Header";
import Head from "next/head";
import Footer from "../components/Footer";
import { parseUserStats } from "../utils/utils";
import styled from 'styled-components';
import userPic from '../public/user.svg';
import Image from 'next/image';
import { useRouter } from "next/router";

const ProfileContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 79vh;
  background: #e6be94;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

type CloudProps = {
  width: number;
}

const Cloud = styled.div<CloudProps>`
  width: 30%;
  height: ${(props) => props.width}%;
  background: #98795a;
  border: 1px solid #98795a;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  & div {
    text-align: center;
}
`;

const ColoredText = styled.span`
  color: ${(props: {color: string}) => props.color};
`;

const H3WithMargin = styled.h3`
  margin-top: 1rem;
`;

const Logout = styled.div`
  position: absolute;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 30px;
  height: 2rem;
  width: 5rem;
  margin: 1rem;
  cursor: pointer;
  text-align: center;
  background: #98795a;
  color: #e6be94;
  border-radius: 5px;
  bottom: 0;
  right: 0;
`

const ProfilePage = () => {
  const socket = useSocket();
  const router = useRouter();
  const [userData, setUserData] = useState<ProfileData>();
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    const jwt = Cookies.get("token");
    if (!jwt) return;
    const data = jwtDecode<DecodedJWT>(jwt);
    fetch('/api/socket/').finally(() => {
      socket.on("profile", (userData) => {
        setUserData(userData);
      });
      if (data.email) {
        socket.emit("getProfile", jwt);
      } else {
        setUnauthorized(true);
      }
    });
  }, [socket]);

  const logout = () => {
    Cookies.remove("token");
    router.push("/");
  }

  return (
  <>
    <Head>
      <title>Coornick | Profile</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/rooster.ico" />
    </Head>
    <main>
      <Header></Header>
        {unauthorized && (<div style={{textAlign: 'center'}}>You need to be logged in to check your stats.</div>)}
        { !unauthorized && <ProfileContainer>
        <Cloud width={45} style={{marginBottom: '1rem'}}>
          <Image src={userPic} alt="User" width={160} height={200} style={{justifySelf: "center", alignSelf: "center"}}/>
          <h2>{userData?.nick}</h2>
        </Cloud>
        <Cloud width={40}>
          <div>
            <H3WithMargin>Stats:</H3WithMargin>
            <h3>
              <ColoredText color="#39fc1b">{userData?.stats[0]}</ColoredText>/
              <ColoredText color="yellow">{userData?.stats[1]}</ColoredText>/
              <ColoredText color="red">{userData?.stats[2]}</ColoredText>
            </h3>
            <H3WithMargin>Games played:</H3WithMargin>
            {userData && <h3>{parseUserStats(userData?.stats).gamesPlayed}</h3> }
            <H3WithMargin>Win/lose ratio:</H3WithMargin>
            {userData && <h3>{parseUserStats(userData?.stats).ratio.toFixed(2)}</h3>}
          </div>
        </Cloud>
        <Logout onClick={logout}>Logout</Logout>
      </ProfileContainer> }
      <Footer></Footer>
    </main>
  </>);
}

export default ProfilePage;