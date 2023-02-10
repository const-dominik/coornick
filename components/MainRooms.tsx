import styled from 'styled-components';
import { RoomsWithId } from '../types/types';
import AddRoomForm from './AddRoomForm';
import RoomLine from "./RoomLine";

const RoomsContainer = styled.div`
  margin-top: 1rem;
  width: 100%;
`;

const Container = styled.div`
  width: 60%;
  height: 90%;
  margin: auto 1rem;
  background: #98795a;
  border: 1px solid #98795a;
  border-radius: 5px;
  text-align: center;
`;

const RoomsHeader = styled.h1`
  margin: 1rem 0;
`;

const NameDiv = styled.div`
  width: 50%;
`;
  
const OwnerDiv = styled.div`
  width: 40%;
`;
  
const LockDiv = styled.div`
  width: 10%;
`;

const FlexDiv = styled.div`
  display: flexbox;
  border-bottom: 1px solid black;
  border-top: 1px solid black;
`

const TableHeader = () => {
  return (
    <FlexDiv>
      <NameDiv>Room name</NameDiv>
      <OwnerDiv>Room owner</OwnerDiv>
      <LockDiv>Lock</LockDiv>
    </FlexDiv>
  )
}
const Rooms = ({ rooms }: { rooms: RoomsWithId }) => {
  return (
    <Container>
      <RoomsHeader>Rooms</RoomsHeader>
      <AddRoomForm></AddRoomForm>
      <RoomsContainer>
        <TableHeader />
        { 
        rooms.map(roomWithId => {
          return <RoomLine room={roomWithId} key={roomWithId[0]}/>
        }) 
        }
      </RoomsContainer>
    </Container>
  );
}

export default Rooms;