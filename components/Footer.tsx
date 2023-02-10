import styled from 'styled-components';
import Image from 'next/image'
import Link from 'next/link';
import roosterPic from '../public/rooster.png'
import githubPic from '../public/github-mark-white.png';

const Container = styled.div`
  height: 9vh;
  width: 100%;

  padding: 0.5rem;

  display: flex;
  align-items: center;
  flex-direction: column;
  
  background: #98795a;

  position: absolute;
  bottom: 0;
  overflow: hidden;
`;

const StyledLink = styled.a`
  text-decoration: none;
  margin-left: 0.6rem;
  color: #e6be94;
`;

const CenteredDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const Footer = () => {
  return (
    <Container>
      <CenteredDiv>
        <Image src={roosterPic} alt="Rooster image" width={24} height={24}></Image>
        <StyledLink href="https://www.flaticon.com/free-icon/rooster_9362107" target="_blank">    https://www.flaticon.com/free-icon/rooster_9362107</StyledLink>
      </CenteredDiv>
      <CenteredDiv>
        <Image src={githubPic} alt="Github logo" width={24} height={24}></Image>
        <StyledLink href="https://github.com/const-dominik" target="_blank">   https://github.com/const-dominik</StyledLink>
      </CenteredDiv>
    </Container>
  )
}


export default Footer;