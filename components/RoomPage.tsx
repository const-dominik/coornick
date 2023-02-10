import type { Room } from "../types/types";
import Chat from "./Chat"
import TicTacToeGame from "./TicTacToeGame";
import styled from 'styled-components';

export type RoomProps = {
  room: Room,
  password: string
}

const Container = styled.div`
  height: 79vh;
  width: 100%;
  display: flex;
  background: #209ffe;
`;

const WidthDiv = styled.div<{width: number}>`
  width: ${(props) => props.width}%;
`

const RoomPage = (data: RoomProps) => {
  return (
    <Container>
      <WidthDiv width={80}>
        <TicTacToeGame password={data.password} room={data.room}/>
      </WidthDiv>
      <WidthDiv width={20}>
        <Chat />
      </WidthDiv>
    </Container>
  );
}

export default RoomPage;