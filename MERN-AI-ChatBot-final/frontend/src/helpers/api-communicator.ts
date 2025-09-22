import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/user/login", { email, password });
  if (res.status !== 200) {
    throw new Error("Unable to login");
  }
  const data = await res.data;
  return data;
};

export const signupUser = async (
  name: string,
  email: string,
  password: string
) => {
  const res = await api.post("/user/signup", { name, email, password });
  if (res.status !== 201) {
    throw new Error("Unable to Signup");
  }
  const data = await res.data;
  return data;
};

export const checkAuthStatus = async () => {
  const res = await api.get("/user/auth-status");
  if (res.status !== 200) {
    throw new Error("Unable to authenticate");
  }
  const data = await res.data;
  return data;
};

export const sendChatRequest = async (message: string, conversationId?: string) => {
  try {
    const res = await api.post("/chat/new", { message, conversationId });
    if (res.status !== 200) {
      throw new Error("Unable to send chat");
    }
    const data = await res.data;
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    } else if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error(error.response?.data?.message || "Unable to send chat");
    }
  }
};

export const getUserChats = async () => {
  try {
    const res = await api.get("/chat/all-chats");
    if (res.status !== 200) {
      throw new Error("Unable to load chats");
    }
    const data = await res.data;
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    } else if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error(error.response?.data?.message || "Unable to load chats");
    }
  }
};

export const deleteConversation = async (conversationId: string) => {
  try {
    const res = await api.delete(`/chat/conversation/${conversationId}`);
    if (res.status !== 200) {
      throw new Error("Unable to delete conversation");
    }
    const data = await res.data;
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    } else if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error(error.response?.data?.message || "Unable to delete conversation");
    }
  }
};

export const deleteUserChats = async () => {
  try {
    const res = await api.delete("/chat/delete");
    if (res.status !== 200) {
      throw new Error("Unable to delete chats");
    }
    const data = await res.data;
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    } else if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error(error.response?.data?.message || "Unable to delete chats");
    }
  }
};

export const logoutUser = async () => {
  try {
    const res = await api.get("/user/logout");
    if (res.status !== 200) {
      throw new Error("Unable to logout");
    }
    const data = await res.data;
    return data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Session expired. Please login again.");
    } else if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error(error.response?.data?.message || "Unable to logout");
    }
  }
};
