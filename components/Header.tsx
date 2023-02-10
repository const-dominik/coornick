import styled from 'styled-components';
import Image from 'next/image'
import Link from 'next/link';
import roosterPic from '../public/rooster.png'
import { DecodedJWT } from '../types/types';
import { useAuthContext } from '../lib/authContext';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const Container = styled.div`
  height: 12vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #98795a;
`;

const MyImg = styled(Image)`
  height: auto;
  width: auto;
  margin: 10px;
`;
  
const LogoText = styled.p`
  text-align: center;
  color: #e6be94;
  font-size: 1.5rem;
  font-weight: 700;
  font-family: Arial, Helvetica, sans-serif;
  user-select: none;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  margin: 10px;
  cursor: pointer;
`;

const LoggedAs = styled.div`
  display: flex;
  margin-right: 1rem;
`;

const Cloud = styled.div`
  background: #e6be94;
  font-weight: 500;
  font-family: Arial, Helvetica, sans-serif;
  padding: 0.6rem;
  margin-left: 1rem;
  border: 1px solid #ae896b;
  border-radius: 5px;
`;
  
const StyledLink = styled(Link)`
  text-decoration: none;
  color: black;
`

const Header = () => {
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [isGuest, setGuest] = useState(false);
  const { isAuthorized } = useAuthContext();
  
  useEffect(() => {
    setNickInterval();
    setGuestInterval();
  }, []);

  const setNickInterval = (): void | ReturnType<typeof setTimeout> => {
    const nick = getNickname();
    if (!nick) {
      return setTimeout(setNickInterval, 100);
    }
    setNick(nick);
  }

  const setGuestInterval = (): void | ReturnType<typeof setTimeout> => {
    const guest = getGuest();
    console.log(guest);
    if (guest === undefined) {
      return setTimeout(setGuestInterval, 100);
    }
    setGuest(!guest);
  }

  const getNickname = () => {
    const token = Cookies.get("token");
    if (!token) return "";
    const data = jwtDecode<DecodedJWT>(token);
    return data.nick;
  };

  const getGuest = () => {
    const token = Cookies.get("token");
    if (!token) return;
    const data = jwtDecode<DecodedJWT>(token);
    return !!data.email;
  }

  const goToIndex = () => {
    router.push("/");
  }

  const isOnProfile = () => {
    return router.asPath === "/profile";
  }

  return (
    <Container>
      <Logo onClick={goToIndex}>
        <MyImg src={roosterPic} alt="Rooster image." width={64} height={64}></MyImg>
        <LogoText>Coornick</LogoText>
      </Logo>
      <LoggedAs>
        <Cloud>
          Logged as: {nick} { isGuest ? "(guest)" : ""} 
        </Cloud>
        { isAuthorized && !isGuest && !isOnProfile() && <Cloud>
          <StyledLink href={"/profile"}>Profile</StyledLink>
        </Cloud> }
      </LoggedAs>
    </Container>
  )
}


export default Header;