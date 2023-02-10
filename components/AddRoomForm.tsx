import * as React from 'react';
import { DecodedJWT, RoomData } from "../types/types"
import { ChangeEvent, FormEvent, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';
import Image from 'next/image';
import lock from '../public/lock.svg';
import unlock from '../public/unlock.svg';
import styled from 'styled-components';

type RoomInput = {
  name: string;
  password: string;
  locked: boolean;
}

type ValidateResponse = {
  ok: boolean;
  msg: string;
}

const initialRoomInput: RoomInput = {
  name: "",
  password: "",
  locked: false
}

const validateForm = (form: RoomInput): ValidateResponse => {
  const { name, password, locked } = form;
  if (name.trim().length < 5) {
    return {
      ok: false,
      msg: "Too short room name, it should be at least 5 characters long"
    };
  }
  if (locked) {
    if (password.trim().length < 8) {
      return {
        ok: false,
        msg: "Too short password, it should be at least 8 characters long"
      };
    }
  }
  return {
    ok: true,
    msg: ""
  }
}

type InputProps = {
  width: number;
}

const StyledInput = styled.input<InputProps>`
  width: ${(props) => props.width}%;
  padding: 0.3rem;
  background: #e6be94;
  color: black;
  margin-right: 1rem;
  border: none;
  outline: none;
  border: 1px solid #ae896b;
`

const AddRoomForm = () => {
  const [roomInput, setRoomInput] = useState<RoomInput>(initialRoomInput);
  const [locked, setLocked] = useState(unlock);
  const socket = useSocket();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const targetName = event.target.name;
    const type = event.target.type;
    const value = type === "checkbox" ? event.target.checked : event.target.value;

    setRoomInput({
      ...roomInput,
      [targetName]: value
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isFine = validateForm(roomInput);
    if (!isFine.ok) {
      alert(isFine.msg);
      return;
    }
    const { name, locked, password } = roomInput;
    const token = Cookies.get("token");
    if (!token) throw new Error("shouldn't happen");
    const owner = jwtDecode<DecodedJWT>(token);
    const room: RoomData = {
      name,
      owner: owner.nick,
      requiresPassword: locked,
      password
    };
    
    socket.emit("addRoom", room, token);

    setRoomInput(initialRoomInput);
  };

  const changeLock = () => {
    if (locked === unlock) {
      setLocked(lock);
    } else {
      setLocked(unlock);
    }
    roomInput.locked = !roomInput.locked;
  }

  return (
  <form onSubmit={handleSubmit}>
    <StyledInput width={45} type="text" placeholder='Room name' name="name" value={roomInput.name} onChange={handleChange} />
    <Image src={locked} alt="Unlock" onClick={changeLock} width={20} height={20} style={{marginRight: "1rem", marginBottom: "-5px", cursor: "pointer"}}/>
    <StyledInput width={30} type="password" placeholder='Password' name="password" disabled={!roomInput.locked} value={roomInput.password} onChange={handleChange} />
    <StyledInput width={10} type="submit" value="Add room!" style={{borderRadius: "3px", cursor: "pointer"}} />
  </form>
  )
}

export default AddRoomForm;