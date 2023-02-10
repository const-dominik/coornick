import { SocketContext } from '../lib/socketContext'
  import { useContext } from "react";

export const useSocket = () => {
  const socket = useContext(SocketContext);

  return socket;
};