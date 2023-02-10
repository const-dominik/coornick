import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { useAuthContext } from "../lib/authContext";
import styled from 'styled-components';

const Container = styled.div`
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  position: relative;
  background: #e2b17c;
  border-left: 1px solid black;
  border-top: 1px solid black;
  border-right: 1px solid black;
`;

const MessageContainer = styled.div`
  height: 76vh;
  overflow-y: auto;
`

const StyledForm = styled.form`
  position: absolute;
  bottom: 0;
  width: 100%;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 3vh;
  background: #ae896b;

  &:focus {
    outline: none;
  }
`;

const Message = styled.div`
  padding: 0.3rem;
  overflow-wrap: break-word;

  &:nth-child(odd) {
    background: #8c7760;
  }
  &:nth-child(even) {
    background: #705e4b;
  }
`


const Chat = () => {
  const Router = useRouter();
  const socket = useSocket();
  const [msgCount, setMsgCount] = useState(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [id, setId] = useState("");
  const messagesRef = useRef(messages);
  const idRef = useRef(id);
  const divRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(msgCount);
  const { setIsAuthorized } = useAuthContext();

  const jwt = Cookies.get("token");
  if (!jwt) {
    setIsAuthorized(false);
    throw new Error("unauthorized");
  }

  useEffect(() => {
    messagesRef.current = messages;
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    idRef.current = id;
  }, [id]);

  useEffect(() => {
    setId(window.location.pathname.slice(1));
  }, [Router.isReady]);

  useEffect(() => {
    socket.on("message", (sender, msg, roomId) => {
      if (id !== roomId) return;
      const mess = `${sender}: ${msg}`;
      setMsgCount(msgCountRef.current+1);
      setMessages([...messages, mess]);
    });
  }, [socket, id, messages]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const mess = message.trim();
    if (mess === "") return;
    if (mess.length > 100) return alert("Max message length is 100 characters.");
    socket.emit("message", id, mess, jwt);
    setMessage("");
  }

  const scrollToBottom = () => {
    if (divRef.current)
      divRef.current.scroll({ top: divRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <Container>
      <MessageContainer ref={divRef}>
        {messages.map(message => {
          return <Message key={msgCount}>{message}</Message>;
        })}
      </MessageContainer>
      <StyledForm onSubmit={handleSubmit}>
        <StyledInput type="text" name="" value={message} onChange={handleChange}/>
      </StyledForm>
    </Container>
  )
}

export default Chat;