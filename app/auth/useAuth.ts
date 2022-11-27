import { useContext } from "react"
import jwtDecode from "jwt-decode"

import AuthContext from "./context";
import authStorage from "./storage";
import { environment } from "../../enviroment";
import apiClient from "../api/client";

const apiParam = "?X-TRENA-KEY=" + environment.apiKey

const endpoint = "/security/users/me" + apiParam;

export default function useAuth() {
  const {user, setUser, userData, setUserData} = useContext(AuthContext);

  const logIn = async (authToken: any) => {
    const user = jwtDecode(authToken);
    setUser(user);

    const {data: userData} = await apiClient.get(endpoint + "&token=" + authToken);    
    setUserData(userData)

    await authStorage.storeToken(authToken);
  }

  const logOut = async () => {
    setUser(null);
    setUserData(null);
    await authStorage.removeToken();
  }

  return {user, logIn, logOut, setUser, userData, setUserData};
}