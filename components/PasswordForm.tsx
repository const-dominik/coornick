import Cookies from 'js-cookie';
import * as React from 'react';
import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuthContext } from '../lib/authContext';
import styled from 'styled-components';

const StyledInput = styled.input`
  padding: 0.3rem;
  background: #e6be94;
  width: 100%;
  color: black;
  outline: 0;
  border: 1px solid #ae896b;
  margin: 0 auto .3rem auto;
`

const Container = styled.div`
  width: 100%;
  height: 79vh;
  background: #e6be94;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const FormContainer = styled.div`
  width: 40%;
  height: 40%;
  margin: auto 1rem;
  background: #98795a;
  border: 1px solid #98795a;
  border-radius: 5px;
  text-align: center;
`;

const StyledForm = styled.form`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  margin: auto;
`;

const StyledH2 = styled.h2`
  margin: 1rem;
  font-family: Arial, Helvetica, sans-serif;
`;

const PasswordForm = ({ id, setPassword }: { id: string, setPassword: Dispatch<SetStateAction<string>> }) => {
  const socket = useSocket();
  const [passwordInput, setPasswordInput] = useState("");
  const [isWrongPassword, setWrongPassword] = useState(false);
  const {setIsAuthorized} = useAuthContext();

  const jwt = Cookies.get("token");
  if (!jwt) {
    setIsAuthorized(false);
    throw new Error("unauthorized");
  }

  useEffect(() => {
    socket.on("roomRequiresPassword", (state) => {
      if (state) {
        setWrongPassword(true);
      }
    });
  }, [socket])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordInput(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordInput("");
    setPassword(passwordInput);
    socket.emit("getRoom", id, passwordInput, jwt);
  };

  return (
    <Container>
      <FormContainer>
        <StyledForm onSubmit={handleSubmit}>
          <StyledH2>{isWrongPassword ? "Wrong password!" : "Enter room password."}</StyledH2>
          <StyledInput type="password" name="password" value={passwordInput} onChange={handleChange} />
          <StyledInput type="submit" value="Enter!" style={{borderRadius: "3px", cursor: "pointer", width: "40%"}} />
        </StyledForm>
      </FormContainer>
    </Container>
  );
}

export default PasswordForm;