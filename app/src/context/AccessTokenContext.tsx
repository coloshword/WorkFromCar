import { createContext, useContext, useState, useEffect } from "react";

type AccessTokenContextProps = {
  authToken: string | null;
  setAuthToken: (authToken: string | null) => void;
}

const defaultProps: AccessTokenContextProps = {
  authToken: null,
  setAuthToken: () => {},
}

const AccessTokenContext = createContext<AccessTokenContextProps>(defaultProps);

export const useAccessToken = () => useContext(AccessTokenContext);

export const AccessTokenProvider = ({ children, accessToken }: { children: React.ReactNode, accessToken: string | null }) => {
  const [authToken, setAuthToken] = useState<string | null>(accessToken);

  return (
    <AccessTokenContext.Provider value={{ authToken, setAuthToken }}>
      {children}
    </AccessTokenContext.Provider>
  );
}
