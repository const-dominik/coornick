import Head from "next/head"
import styled from "styled-components"
import Footer from "../components/Footer";
import Header from "../components/Header";

const Container = styled.div`
  width: 100vw;
  height: 88vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background-color: #e6be94;
`;

const BoxContainer = styled.div`
  width: 400px;
	height: 250px;
	margin: 0 auto;
  background-color: #e2b17c;
  color: #705e4b;
  border: 6px solid #98795a;
  border-radius: 10px;
	display: grid;
	grid-template: repeat(3, 1fr) / repeat(3, 1fr);
`;

const Box = styled.div`
  background-color: #e2b17c;
  border-radius: 2px;
  font-family: Helvetica;
  font-weight: bold;
  font-size: 4em;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
`;

const StyledH1 = styled.h1`
  margin: 1rem;
  font-family: Arial, Helvetica, sans-serif;
`;

const ErrorPage = () => {
  return (
    <>
      <Head>
        <title>Coornick | Route doesn&apos;t exist</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/rooster.ico" />
      </Head>
      <main>
        <Header></Header>
        <Container>
          <BoxContainer>
            <Box>_</Box>
            <Box></Box>
            <Box>_</Box>
            <Box>X</Box>
            <Box></Box>
            <Box>X</Box>
            <Box></Box>
            <Box>O</Box>
            <Box></Box>
          </BoxContainer>
        <StyledH1>Sorry, page doesn&apos;t exist.</StyledH1>
        </Container>
        <Footer></Footer>
      </main>
    </>
  )
}

export default ErrorPage;