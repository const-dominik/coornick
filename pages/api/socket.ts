import type { NextApiRequest } from 'next'
import { Server } from 'socket.io'
import { MyServer, Room, RoomData, NextApiResponseWithSocket, BoardPick, UserData, DecodedJWT, GuestData, SidePick, ProfileData } from '../../types/types';
import { v4 }  from 'uuid';
import { getOppositeSide, checkTTTWinner, copyTuple, emptyBoard, checkDraw } from '../../utils/utils';
import clientPromise from '../../lib/mongodb';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';

const rooms = new Map<string, Room>();
const jwts = new Map<string, string>();
const checkIfSocketIsInRoom = (id: string, rooms: Set<string>) => Array.from(rooms).includes(id);

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io: MyServer = new Server(res.socket.server, {
    cookie: true
  });

  res.socket.server.io = io;

  io.on("connection", (socket) => {
    const transferOwnership = (socketRoom: Set<string>, gameRoom: Room, data: DecodedJWT, room: string) => {
      if (gameRoom.data.owner === data.nick) {
        const users = [...socketRoom.keys()].filter(id => id !== socket.id);
        const randomUser = users[Math.floor(Math.random()*users.length)];
        const jwt = jwts.get(randomUser);
        if (!jwt) return;
        const data = jwtDecode<DecodedJWT>(jwt);
        gameRoom.data.owner = data.nick;

        io.in(room).emit("roomData", gameRoom);
        io.in(room).emit("message", `[SYSTEM]`, `Owner left room, ownership transferred to ${data.nick}`, room);
      }
    }

    const handleDisconnection = (room: Room, nick: string, scoreCounts: boolean) => {
      let playedAs: SidePick | "" = 
        (room.game.circlePlayer === nick ? "circlePlayer" :
        room.game.crossPlayer === nick ? "crossPlayer" :
        "");
      if (playedAs) {
        socket.in(room.id).emit("sidePicked", playedAs, null);
        if (room.game.turn) {
          room.game.turn = null;
          const oppositeSide = getOppositeSide(playedAs);
          if (room.game[oppositeSide] === null) return;
          if (typeof room.game[oppositeSide] === "string" && typeof room.game[playedAs] === "string" && scoreCounts) {
            //@ts-ignore
            addScore(room.game[oppositeSide], "win");
            //@ts-ignore
            addScore(room.game[playedAs], "lose")
          }
          //@ts-ignore
          io.in(room.id).emit("winner", [oppositeSide, room.game[oppositeSide]], true);
        }
        room.game[playedAs] = null;
        io.in(room.id).emit("sidePicked", playedAs, null);
      }
    }

    const addScore = async (nick: string, score: "win" | "lose" | "draw") => {
      const client = await clientPromise;
      const db = client.db("coornick");
      const usersCollection = db.collection("users");

      const user = await usersCollection.findOne<UserData>({ nick: nick });
      if (user) {
        if (score === "win") {
          user.stats[0]++;
        } else if (score === "lose") {
          user.stats[2]++;
        } else {
          user.stats[1]++;
        }
        const added = await usersCollection.updateOne({ nick: nick }, { $set: { stats: user.stats } });
        if (added.acknowledged) {
          return true;
        } 
      }
    }

    socket.on("join", () => {
      const serializedMap = [...rooms.values()].map<[string, RoomData]>((room) => [room.id, room.data]);
      socket.emit("newRoom", serializedMap);
    });

    socket.on("joinRoom", (id) => {
      if (checkIfSocketIsInRoom(id, socket.rooms)) {
        const room = rooms.get(id);
        if (room) {
          socket.emit("roomData", room);
        }
      }
    })
    
    socket.on("addRoom", (roomData) => {
      const randomId = v4();
      if ([...rooms.values()].some(room => {
        return room.data.name === roomData.name
      })) return;
      const room: Room = {
        data: roomData,
        id: randomId,
        game: {
          crossPlayer: null,
          circlePlayer: null,
          turn: null,
          board: copyTuple(emptyBoard)
        }
      }
      rooms.set(randomId, room);
      io.emit("newRoom", [[randomId, roomData]]);
      socket.emit("roomAdded", randomId);
    });

    socket.on("doesRoomExist", id => {
      const room = rooms.get(id);
      if (!room) return socket.emit("roomError");
    })

    socket.on("getRoom", (id, password, jwt) => {
      const room = rooms.get(id);
      const data = jwtDecode<DecodedJWT>(jwt);
      if (!room) return socket.emit("roomError");
      const roomData = room.data;
      if (!roomData.requiresPassword || password === roomData.password || room.data.owner === data.nick) {
        socket.emit("roomData", room);
        socket.join(id);
      } else {
        socket.emit("roomRequiresPassword", !!password);
      }
    });

    socket.on('message', (id, message, jwt) => {
      const data = jwtDecode<DecodedJWT>(jwt);
      if (message.length > 100) return;
      if (checkIfSocketIsInRoom(id, socket.rooms)) {
        io.in(id).emit("message", data.nick, message, id);
      }
    });

    socket.on("pickSide", (id, side, jwt) => {
      const data = jwtDecode<DecodedJWT>(jwt);
      if (checkIfSocketIsInRoom(id, socket.rooms)) {
        const room = rooms.get(id);
        if (!room) return;
        if (!side) {
          return handleDisconnection(room, data.nick, true);
        }
        if (!room.game[side]) {
          const oppositeSide = getOppositeSide(side);
          room.game[side] = data.nick;
          if (room.game[oppositeSide] === data.nick) {
            room.game[oppositeSide] = null;
          }
          io.in(id).emit("sidePicked", side, data.nick);
          if (room.game.circlePlayer && room.game.crossPlayer && !room.game.turn) {
            const randomStart = Math.random() < 0.5 ? "circlePlayer" : "crossPlayer";
            room.game.turn = randomStart;
            room.game.board = copyTuple(emptyBoard);
            io.in(id).emit("startGame", randomStart);
          }
        }
      }
    });

    socket.on("kick", (side, id, jwt) => {
      const data = jwtDecode<DecodedJWT>(jwt);
      const room = rooms.get(id);
      if (room) {
        const player = room.game[side];
        if (player) {
          if (room.data.owner === data.nick || player === data.nick) {
            if (!room.game.turn) {
              room.game[side] = null;
              io.in(id).emit("sidePicked", side, null);
            } else {
              let message: string;
              if (room.data.owner === data.nick && player !== data.nick) {
                message = "The game has been stopped, because room owner kicked one of the players.";
                io.in(id).emit("stopGame", "Owner kicked a guy.");
              } else {
                message = `The game has been stopped, because ${data.nick} surrendered.`;
                const oppositeSide = getOppositeSide(side);
                const oppositeNick = room.game[oppositeSide];
                const sideNick = room.game[side];
                if (oppositeNick === null || sideNick === null) return;
                if (typeof oppositeNick === "string" && typeof sideNick === "string") {
                  addScore(oppositeNick, "win");
                  addScore(sideNick, "lose");
                }
                io.in(room.id).emit("winner", [oppositeSide, oppositeNick], true);
                io.in(id).emit("stopGame", "Player surrendered.");
              }
              room.game[side] = null;
              room.game.turn = null;
              io.in(id).emit("message", "[SYSTEM]", message, id)
              socket.in(room.id).emit("sidePicked", side, null);
              io.in(id).emit("sidePicked", side, null);
            }
          }
        }
      }
    });

    socket.on("move", (id, index, jwt) => {
      const data = jwtDecode<DecodedJWT>(jwt);
      const player = data.nick;
      const room = rooms.get(id);
      if (room) {
        const { game } = room;
        
        if (game.board[index] !== null) return;
        if (game.turn === null) return;
        
        const currentTurn = game[game.turn];
        if (currentTurn !== player) return;
        
        let pick: BoardPick =
          (game.circlePlayer === player ? "O" :
          game.crossPlayer === player ? "X" : null);

        if (pick) {
          game.board[index] = pick;
          io.in(id).emit("move", index, pick);
          const winner = checkTTTWinner(game.board);
          const draw = checkDraw(game.board);
          if (winner !== null) {
            const loserNick = game[getOppositeSide(winner)];
            const winnerNick = game[winner];
            if (!loserNick || !winnerNick) throw new Error("shouldn't happen");
            game.turn = null;
            addScore(winnerNick, "win");
            addScore(loserNick, "lose");
            io.in(id).emit("winner", [winner, winnerNick], false);
          } else if (draw) {
            const circle = game.circlePlayer;
            const cross = game.crossPlayer;
            if (!circle || !cross) throw new Error("shouldn't happen");
            game.turn = null;
            addScore(circle, "draw");
            addScore(cross, "draw");
            io.in(id).emit("winner", ["draw", ""], false);
          } else {
            game.turn = getOppositeSide(game.turn);
          }
        }
      }
    });

    socket.on('restart', (id) => {
      const room = rooms.get(id);
      if (room) {
        if (checkIfSocketIsInRoom(id, socket.rooms)) {
          if (room.game.circlePlayer && room.game.crossPlayer && !room.game.turn) {
            const randomStart = Math.random() < 0.5 ? "circlePlayer" : "crossPlayer";
            room.game.turn = randomStart;
            room.game.board = copyTuple(emptyBoard);
            io.in(id).emit("startGame", randomStart);
          }
        }
      }
    });

    socket.on('handleLeave', () => {
      const jwt = jwts.get(socket.id);
      if (!jwt) return;
      const data = jwtDecode<DecodedJWT>(jwt);
      socket.rooms.forEach(room => {
        const socketRoom = io.of("/").adapter.rooms.get(room);
        const gameRoom = rooms.get(room);
        if (!gameRoom || !socketRoom) return;
        socketRoom.delete(socket.id);
        if ([...socketRoom.keys()].filter(id => jwts.get(id) === jwt).length > 1) return;
        if (socketRoom.size === 0 && [...rooms.keys()].includes(room)) {
          rooms.delete(room);
          io.emit("removeRoom", room);
        }
        handleDisconnection(gameRoom, data.nick, true);
        transferOwnership(socketRoom, gameRoom, data, room);
      })
    })

    socket.on('disconnecting', () => {
      const jwt = jwts.get(socket.id);
      if (!jwt) return;
      const data = jwtDecode<DecodedJWT>(jwt);
      socket.rooms.forEach(room => {
        const socketRoom = io.of("/").adapter.rooms.get(room);
        const gameRoom = rooms.get(room);
        if (!gameRoom || !socketRoom) return;
        if ([...socketRoom.keys()].filter(id => jwts.get(id) === jwt).length > 1) return;
        handleDisconnection(gameRoom, data.nick, true);
        transferOwnership(socketRoom, gameRoom, data, room);
      })
      jwts.delete(socket.id);
    });

    socket.on("register", async (data) => {
      try {
        if (data.nick.includes("@") || !data.email.includes("@")) return;
        const client = await clientPromise;
        const db = client.db("coornick");
        const usersCollection = db.collection("users");
        const guestsCollection = db.collection("guests");

        const checkEmailPromise = usersCollection.findOne<UserData>({ email: data.email });
        const checkNickPromise = usersCollection.findOne<UserData>({ nick: data.nick });
        const checkGuestsPromise = guestsCollection.findOne<GuestData>({ nick: data.nick });
        const [isEmailInDatabase, isNickInDatabase, isGuestNick] = await Promise.all([checkEmailPromise, checkNickPromise, checkGuestsPromise]);
        if (!isEmailInDatabase && !isNickInDatabase && (!isGuestNick || isGuestNick.exp < Date.now())) {
          if (isGuestNick && isGuestNick.exp < Date.now()) {
            await guestsCollection.deleteOne({ nick: isGuestNick.nick });
          }
          const salt = await bcrypt.genSalt(10);
          const entry: UserData = {
            nick: data.nick,
            email: data.email,
            password: await bcrypt.hash(data.password, salt),
            stats: [0, 0, 0]
          };
          const added = await usersCollection.insertOne(entry);
          if (added.acknowledged) {
            const token = jwt.sign({ email: data.email, nick: data.nick }, process.env.JWT_SECRET as Secret, { expiresIn: '14d' });
            return socket.emit("authOK", token); 
          }
          return socket.emit("authFail", "internal server error");
        } else if (isGuestNick) {
          const expIn = ((isGuestNick.exp - Date.now())/(1000*60*60)).toFixed(2);
          socket.emit("authFail", `this nick is currently taken by guest, it'll be valid for the next ${expIn}h.`);
        } else {
          const message = isEmailInDatabase ? "Email already in database" : "This nick is taken";
          return socket.emit("authFail", message);
        }
      } catch(e) {
        console.log("register", e);
      }
    });

    socket.on("login", async (data) => {
      try {
        const client = await clientPromise;
        const db = client.db("coornick");
        const usersCollection = db.collection("users");

        const identifier = data.identifier.includes("@") ? "email" : "nick";

        const user = await usersCollection.findOne<UserData>({ [identifier]: data.identifier });
        if (user) {
          const isPasswordValid = await bcrypt.compare(data.password, user.password);
          if (isPasswordValid) {
            const token = jwt.sign({ email: user.email, nick: user.nick }, process.env.JWT_SECRET as Secret, { expiresIn: '14d' });
            return socket.emit("authOK", token);
          }
        }
        return socket.emit("authFail", "user not found");
      } catch (e) {
        console.log("login", e);
      }
    });

    socket.on("guest", async (nick) => {
      try {
        const client = await clientPromise;
        const db = client.db("coornick");
        const usersCollection = db.collection("users");
        const guestsCollection = db.collection("guests");

        const checkNickPromise = usersCollection.findOne<UserData>({ nick: nick });
        const checkGuestNickPromise = guestsCollection.findOne<GuestData>({ nick: nick });
        const [guest, user] = await Promise.all([checkGuestNickPromise, checkNickPromise]);
        if (!user) {
          if (!guest || guest.exp < Date.now()) {
            if (guest) {
              await guestsCollection.deleteOne({ nick: nick });
              //remove the old record and add fresh
            }
            const entry: GuestData = {
              nick,
              exp: Date.now() + 24*60*60*1000 //just for one day
            };
            const added = await guestsCollection.insertOne(entry);
            if (added.acknowledged) {
              const token = jwt.sign({ nick: nick }, process.env.JWT_SECRET as Secret, { expiresIn: '1d' }); //short token for guests
              jwts.set(socket.id, token);
              return socket.emit("authOK", token);
            }
          } else {
            const expIn = ((guest.exp - Date.now())/(1000*60*60)).toFixed(2);
            socket.emit("authFail", `This nick is currently taken by guest, it'll be valid for the next ${expIn}h.`);
          };
        } else {
          socket.emit("authFail", "nick is taken")
        }
      } catch (e) {
        console.log("guest", e);
      }
    });

    socket.on("getProfile", async (jwt) => {
      const data = jwtDecode<DecodedJWT>(jwt);
      if (!data.email) return;
      try {
        const client = await clientPromise;
        const db = client.db("coornick");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne<UserData>({ email: data.email });
        if (!user) throw new Error("shouldn't happen, user not found even though jwt has email");
        const profileData: ProfileData = {
          nick: user.nick,
          stats: user.stats
        };
        socket.emit("profile", profileData);
      } catch (e) {
        console.log("profile", e);
      }
    })

    socket.on("checkTokenValidity", token => {
      const decoded = jwtDecode<DecodedJWT>(token);
      if (decoded) {
        if (decoded.exp && Date.now() < decoded.exp * 1000) {
          socket.emit("isTokenOk", true);
          jwts.set(socket.id, token);
        } else {
          socket.emit("isTokenOk", false);
        }
      }
    })

    socket.on("getRanking", async () => {
      try {
        const client = await clientPromise;
        const db = client.db("coornick");
        const usersCollection = db.collection("users");
        
        const users = await usersCollection.find<UserData>({}).sort({ "stats.0": -1 }).limit(20).toArray();
        const ranking = users.map<[nick: string, wins: number]>(user => [user.nick, user.stats[0]]);
        socket.emit("getRanking", ranking);
      } catch(e) {
        console.log("ranking", e);
      }
    });
  });

  io.of("/").adapter.on('delete-room', room => {
    if ([...rooms.keys()].includes(room)) {
      rooms.delete(room);
      io.emit("removeRoom", room);
    }
  });

  res.end();
}

export default SocketHandler;