import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSocket } from '../hooks/useSocket';

const Container = styled.div`
  width: 40%;
  height: 90%;
  margin: auto 1rem;
  background: #98795a;
  border: 1px solid #98795a;
  border-radius: 5px;
  font-family: Arial, Helvetica, sans-serif;
  text-align: center;
`;

const RankingLine = styled.div`
  padding: 3px 0;
  &:nth-child(odd) {
    background: #8c7760;
  }
  &:nth-child(even) {
    background: #705e4b;
  }
`;

const RankingHeader = styled.h1`
  margin: 1rem 0;
`;

const Ranking = () => {
  const socket = useSocket();
  const [ranking, setRanking] = useState<[nick: string, wins: number][]>([]);

  useEffect(() => {
    socket.on("getRanking", ranking => {
      setRanking(ranking);
    });

    socket.emit("getRanking");
  }, [socket]);

  return (
    <Container>
      <RankingHeader>Ranking</RankingHeader>
      {ranking.map(el => !!el[1] && <RankingLine key={el[0]}>{el[0]}: {el[1]} {el[1] === 1 ? "win" : "wins"}</RankingLine>)}
    </Container>
  )
}

export default Ranking;
