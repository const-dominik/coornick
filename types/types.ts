import { Socket } from 'socket.io-client';
import { Server } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { Socket as NetSocket } from 'net'
import type { Server as IOServer } from 'socket.io'
import type { NextApiResponse } from 'next'

export type MyServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export type MySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type MyEvent = keyof ServerToClientEvents | keyof ClientToServerEvents;

export type ServerToClientEvents = {
  removeRoom: (id: string) => void;
  newRoom: (room: RoomsWithId) => void;
  roomData: (room: Room) => void;
  roomRequiresPassword: (isPasswordWrong: boolean) => void;
  roomError: () => void;
  roomAdded: (id: string) => void;
  message: (sender: string, message: string, id: string) => void;
  sidePicked: (side: SidePick, player: string | null) => void;
  startGame: (start: SidePick) => void;
  move: (index: number, pick: Pick) => void;
  winner: (winner: Result, surrender: boolean) => void;
  nickTaken: () => void;
  isTokenOk: (isOk: boolean) => void;
  authOK: (token: string) => void;
  authFail: (reason: string) => void;
  getDisconnectingJWT: () => void;
  stopGame: (reason: string) => void;
  profile: (userData: ProfileData) => void;
  getRanking: (ranking: [nick: string, wins: number][]) => void;
}

export type ClientToServerEvents = {
  addRoom: (room: RoomData, jwt: JWT) => void;
  getRoom: (id: string, password: string | undefined, jwt: JWT) => void;
  message: (id: string, message: string, jwt: JWT) => void;
  pickSide: (id: string, side: SidePick | null, jwt: JWT) => void;
  move: (id: string, index: number, jwt: JWT) => void;
  join: () => void;
  joinRoom: (id: string) => void;
  restart: (id: string) => void;
  register: (data: RegisterData) => void;
  login: (data: LoginData) => void;
  guest: (nick: string) => void;
  checkTokenValidity: (token: string) => void;
  kick: (side: SidePick, id: string, jwt: JWT) => void;
  getProfile: (jwt: JWT) => void;
  getRanking: () => void;
  handleLeave: () => void;
  doesRoomExist: (id: string) => void;
}

type JWT = string;

export type UserData = {
  email: string;
  password: string;
  nick: string;
  stats: [wins: number, draws: number, loses: number]
}

export type ProfileData = {
  nick: string;
  stats: UserData["stats"]
}

export type RegisterData = {
  email: string;
  password: string;
  nick: string;
}

export type LoginData = {
  identifier: string //nick or email
  password: string
}

export type GuestData = {
  nick: string;
  exp: number; //Date
}

export type DecodedJWT = {
  email?: string;
  nick: string;
  exp: number;
}

export type InterServerEvents = {
  ping: () => void;
}

export type SocketData = {}

export type RoomsWithId = [id: string, roomData: RoomData][]

export type Turn = SidePick | null;
export type Result = Winner | "draw";
export type Winner = SidePick | null;
export type SidePick = "crossPlayer" | "circlePlayer";
export type Pick = "X" | "O";
export type BoardPick = Pick | null;
export type Board = [BoardPick, BoardPick, BoardPick, BoardPick, BoardPick, BoardPick, BoardPick, BoardPick, BoardPick];

export type TicTacToe = {
  crossPlayer: string | null;
  circlePlayer: string | null;
  turn: SidePick | null;
  board: Board;
}

export type RoomData = {
  name: string;
  owner: string;
  requiresPassword: boolean;
  password?: string;
}

export type Room = {
  data: RoomData;
  id: string;
  game: TicTacToe;
}

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}