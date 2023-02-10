import Cookies from "js-cookie";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import styled from "styled-components";
import { useSocket } from "../hooks/useSocket";
import { useAuthContext } from "../lib/authContext";
import { LoginData, RegisterData } from "../types/types";

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
  height: 100vh;
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
  display: flex;
  flex-direction: column;
  background: #98795a;
  border: 1px solid #ae896b;
  border-radius: 5px;
  text-align: center;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
  margin: .5rem auto 0 auto;
`;

const StyledH3 = styled.h3`
  margin: 1rem 0;
  font-family: Arial, Helvetica, sans-serif;
`;

const SelectAuthForm = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const OptionAuthForm = styled.div`
  padding: 1rem;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.2rem;
  font-weight: bold;
  width: ${(props: { width: number }) => props.width}%;
  background-color: blue;
  user-select: none;
  cursor: pointer;
`;

const initialUserData: RegisterData = {
  email: "",
  password: "",
  nick: "",
} as const;

const initialLoginData: LoginData = {
  identifier: "",
  password: ""
} as const;

type WhatToDo = "login" | "register" | "guest";

const AuthorizationForm = () => {  
  const [user, setUser] = useState<RegisterData>(initialUserData);
  const [loginData, setLoginData] = useState<LoginData>(initialLoginData);
  const [guestNick, setGuestNick] = useState("");
  const [whatToDo, setWhatToDo] = useState<WhatToDo>("login");
  const [message, setMessage] = useState("In order to use Coornick, you have to either register, login or use guest function.");
  const { setIsAuthorized } = useAuthContext();
  const socket = useSocket();

  useEffect(() => {
    socket.on("authOK", token => {
      Cookies.set("token", token);
      setIsAuthorized(true);
    });

    socket.on("authFail", reason => {
      setMessage(reason);
      setIsAuthorized(false);
    });

  }, [socket])


  //for registration
  const handleRegistartionChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name;
    const value = event.target.value;
    
    setUser({
      ...user,
      [name]: value 
    });
  };

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(user).some(v => v.trim() === "")) {
      return alert("Form data cannot be empty.");
    }
    if (user.nick.includes("@") || user.nick.length > 20) {
      if (user.nick.includes("@")) return alert("You cannot have an '@' in your nick.")
      if (user.nick.length > 20) return alert("Nick can be at most 20 characters.");
    }
    if (!user.email.includes("@")) {
      return alert("Email is incorrect.");
    }
    if (user.password.length < 8) {
      return alert("Password should be at least 8 characters long.");
    }
    socket.emit("register", user);
    setMessage("Please wait...");
  }
  
  //for login
  const handleLoginChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name;
    const value = event.target.value;
    
    setLoginData({
      ...loginData,
      [name]: value 
    });
  };
  
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.values(loginData).some(v => v.trim() === "")) {
      alert("Form data cannot be empty.");
      return false;
    }
    
    socket.emit("login", loginData);
    setMessage("Please wait...");
  }

  //guest
  const handleGuestChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGuestNick(event.target.value);
  }

  const handleGuest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (guestNick.length < 5 || guestNick.length > 20) {
      alert("Nick has to be at least 5 characters long and at most 20 characters long.");
      return false;
    }

    socket.emit("guest", guestNick);
    setMessage("Checking if nick is available...");
  };

  const backgroundFor = (el: WhatToDo) => {
    if (el === whatToDo) {
      return "#e2b17c";
    }
    return "#705e4b";
  }

  const selectChange = (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
    event.preventDefault();
    if (event.currentTarget.textContent) {
      setWhatToDo(event.currentTarget.textContent.toLowerCase() as WhatToDo);
    }
  };

  return (
    <Container>
      <FormContainer>
        <StyledH3>{message}</StyledH3>
        <>
          <SelectAuthForm>
            <OptionAuthForm width={33} onClick={(e) => selectChange(e)} style={{background: backgroundFor("login")}}>Login</OptionAuthForm>
            <OptionAuthForm width={34} onClick={selectChange} style={{background: backgroundFor("register"), borderLeft: "1px solid black", borderRight: "1px solid black"}}>Register</OptionAuthForm>
            <OptionAuthForm width={33} onClick={selectChange} style={{background: backgroundFor("guest")}}>Guest</OptionAuthForm>
          </SelectAuthForm>
          { whatToDo === "register" && <StyledForm onSubmit={handleRegistration}>
            <StyledInput type="text" name="nick" value={user.nick} onChange={handleRegistartionChange} placeholder='Enter your nick'/>
            <StyledInput type="email" name="email" value={user.email} onChange={handleRegistartionChange} placeholder='Enter your email' />
            <StyledInput type="password" name="password" value={user.password} onChange={handleRegistartionChange} placeholder='Password' />
            <StyledInput type="submit" value="Submit!" style={{border: "1px solid #ae896b", borderRadius: "3px", cursor: "pointer"}} />
          </StyledForm> }
          { whatToDo === "login" && <StyledForm onSubmit={handleLogin}>
            <StyledInput type="text" name="identifier" value={loginData.identifier} onChange={handleLoginChange} placeholder='Enter your nick or email'/>
            <StyledInput type="password" name="password" value={loginData.password} onChange={handleLoginChange} placeholder='Password' />
            <StyledInput type="submit" value="Submit!" style={{border: "1px solid #ae896b", borderRadius: "3px", cursor: "pointer"}}/>
          </StyledForm> }
          { whatToDo === "guest" && <StyledForm onSubmit={handleGuest}>
            <StyledInput type="text" name="nick" value={guestNick} onChange={handleGuestChange} placeholder='Enter your nick'/>
            <StyledInput type="submit" value="Submit!" style={{border: "1px solid #ae896b", borderRadius: "3px", cursor: "pointer"}}/>
          </StyledForm> }
        </>
      </FormContainer>
    </Container>
  )
};

export default AuthorizationForm;