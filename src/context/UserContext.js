"use client";

import Loader from "@/components/ui/Loader";
import useFetch from "@/hooks/useFetch";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const UserContext = createContext({ isLoading: true, user: null, setUser: () => { }, refetch: () => { } });

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true)

  const { refetch } = useFetch({
    auto: true,
    url: `/api/user`,
    withAuth: true,
    onSuccess: (result) => {
      setUser(result);
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "An error occurred while fetching user data");
      setIsLoading(false);
    },
  });


  if (isLoading) return <Loader fullScreen />

  return (
    <UserContext.Provider value={{ user, setUser, refetch, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);