import { createContext, ReactNode } from "react";
import { io } from "socket.io-client";
import { MySocket } from "../types/types";

let socket: MySocket = io();
export const SocketContext = createContext(socket);

interface ISocketProvider {
  children: ReactNode;
}

export const SocketProvider = (props: ISocketProvider) => (
  <SocketContext.Provider value={socket}>{props.children}</SocketContext.Provider>
);