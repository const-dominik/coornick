import { createContext, useContext } from 'react'

type AuthData = {
  isAuthorized: boolean | null;
  setIsAuthorized: Function;
}

export const AuthContext = createContext<AuthData | null>(null);

export const useAuthContext = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("data missing");
  }
  return authContext;
}