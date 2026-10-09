import { useEffect, useState } from "react";
import { api } from "./api";

export default function useSession() {
  const [session, setSession] = useState({
    loading: true, username: "", error: "",
  });
  useEffect(() => {
    let active = true;
    api("/djangoapp/session").then(data => {
      if (active) setSession({
        loading: false, username: data.userName || "", error: "",
      });
    }).catch(error => {
      if (active) setSession({
        loading: false, username: "", error: error.message,
      });
    });
    return () => { active = false; };
  }, []);
  return session;
}
