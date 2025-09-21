import { useLayoutEffect, useRef, useState } from "react";
import { Box, Typography, Button, IconButton, CircularProgress, List, ListItem, ListItemText, ListItemButton, Menu, MenuItem } from "@mui/material";
import red from "@mui/material/colors/red";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ChatItem from "../components/chat/ChatItem";
import TypingIndicator from "../components/chat/TypingIndicator";
import StreamingMessage from "../components/chat/StreamingMessage";
import SearchBar from "../components/shared/SearchBar";
import { IoMdSend, IoMdTrash, IoMdAdd, IoMdDownload, IoMdMore } from "react-icons/io";
import {
  deleteUserChats,
  deleteConversation,
  getUserChats,
  sendChatRequest,
} from "../helpers/api-communicator";
import { exportChatToPDF } from "../utils/exportUtils";
import toast from "react-hot-toast";
type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  name: string;
  chats: Message[];
  createdAt: string;
  isDeleted: boolean;
};

const Chat = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const auth = useAuth();
  const { isDarkMode } = useTheme();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conversation => {
      // Search in conversation name
      const nameMatch = conversation.name.toLowerCase().includes(query.toLowerCase());
      
      // Search in message content
      const messageMatch = conversation.chats.some(chat => 
        chat.content.toLowerCase().includes(query.toLowerCase())
      );
      
      return nameMatch || messageMatch;
    });
    
    setFilteredConversations(filtered);
  };

  // Update filtered conversations when conversations change
  useLayoutEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setFilteredConversations(conversations);
    }
  }, [conversations]);

  // Show loading if auth is not ready or user is not available
  if (!auth || !auth.user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#05101c",
        }}
      >
        <CircularProgress sx={{ color: "#00fffc" }} />
      </Box>
    );
  }

  // Safety check for user data
  if (!auth.user.name || !auth.user.email) {
    console.error("Invalid user data:", auth.user);
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ color: "white" }}>
          Invalid user data
        </Typography>
        <Typography variant="body1" sx={{ color: "gray" }}>
          Please login again
        </Typography>
      </Box>
    );
  }
  const handleSubmit = async () => {
    const content = inputRef.current?.value as string;
    
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (inputRef && inputRef.current) {
      inputRef.current.value = "";
    }
    
    // Generate a unique request ID for this conversation
    const requestId = `${currentConversationId || 'new'}-${Date.now()}`;
    setCurrentRequestId(requestId);
    
    const newMessage: Message = { role: "user", content };
    setChatMessages((prev) => [...prev, newMessage]);
    
    try {
      setIsTyping(true);
      
      const chatData = await sendChatRequest(content, currentConversationId || undefined);
      console.log("Chat response:", chatData); // Debug log
      
      if (chatData && chatData.chats && Array.isArray(chatData.chats)) {
        // Get the last message (AI response)
        const lastMessage = chatData.chats[chatData.chats.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          // Start streaming effect immediately
          setStreamingMessage(lastMessage.content);
          setIsTyping(false);
        } else {
          setChatMessages([...chatData.chats]);
          setIsTyping(false);
        }
        
        // Update conversation ID if it's a new conversation
        if (chatData.conversationId && chatData.conversationId !== currentConversationId) {
          setCurrentConversationId(chatData.conversationId);
          
          // Add new conversation to the list
          const newConversation: Conversation = {
            id: chatData.conversationId,
            name: chatData.conversationName || "New Conversation",
            chats: chatData.chats,
            createdAt: new Date().toISOString(),
            isDeleted: false
          };
          setConversations(prev => [newConversation, ...prev]);
        } else if (currentConversationId) {
          // Update existing conversation
          setConversations(prev => 
            prev.map(conv => 
              conv.id === currentConversationId 
                ? { ...conv, chats: chatData.chats, name: chatData.conversationName || conv.name }
                : conv
            )
          );
        }
      } else {
        console.error("Invalid response format:", chatData);
        setChatMessages((prev) => prev.slice(0, -1));
        setIsTyping(false);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      // Remove the user message if the request failed
      setChatMessages((prev) => prev.slice(0, -1));
      setIsTyping(false);
    } finally {
      setCurrentRequestId(null);
    }
  };
  const handleDeleteChats = async () => {
    try {
      toast.loading("Deleting All Chats", { id: "deletechats" });
      await deleteUserChats();
      setChatMessages([]);
      setConversations([]);
      setCurrentConversationId(null);
      toast.success("Deleted All Chats Successfully", { id: "deletechats" });
    } catch (error: any) {
      console.error("Delete chats error:", error);
      toast.error(error.message || "Deleting chats failed", { id: "deletechats" });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      toast.loading("Deleting Conversation", { id: "deleteconv" });
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setChatMessages([]);
      }
      
      toast.success("Conversation Deleted", { id: "deleteconv" });
    } catch (error: any) {
      console.error("Delete conversation error:", error);
      toast.error(error.message || "Deleting conversation failed", { id: "deleteconv" });
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // Clear any pending streaming when switching conversations
    setStreamingMessage("");
    setIsTyping(false);
    setCurrentRequestId(null);
    
    setCurrentConversationId(conversation.id);
    setChatMessages(conversation.chats);
  };

  const handleNewConversation = () => {
    // Clear any pending streaming when starting new conversation
    setStreamingMessage("");
    setIsTyping(false);
    setCurrentRequestId(null);
    
    setCurrentConversationId(null);
    setChatMessages([]);
  };


  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, conversation: Conversation) => {
    setMenuAnchor(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedConversation(null);
  };

  const handleExportFromMenu = async () => {
    if (selectedConversation) {
      try {
        toast.loading("Exporting chat to PDF...", { id: "export-menu" });
        await exportChatToPDF(selectedConversation.name, selectedConversation.chats);
        toast.success("Chat exported successfully!", { id: "export-menu" });
      } catch (error: any) {
        console.error("Export error:", error);
        toast.error(error.message || "Failed to export chat", { id: "export-menu" });
      }
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = async () => {
    if (selectedConversation) {
      await handleDeleteConversation(selectedConversation.id);
    }
    handleMenuClose();
  };
  useLayoutEffect(() => {
    if (auth?.isLoggedIn && auth.user) {
      getUserChats()
        .then((data) => {
          if (data.conversations && Array.isArray(data.conversations)) {
            setConversations(data.conversations);
            // If there are conversations, load the first one
            if (data.conversations.length > 0) {
              const firstConv = data.conversations[0];
              setCurrentConversationId(firstConv.id);
              setChatMessages(firstConv.chats);
            }
          } else if (data.chats && Array.isArray(data.chats)) {
            // Fallback to old format
            setChatMessages(data.chats);
          }
        })
        .catch((err: any) => {
          console.error("Load chats error:", err);
        });
    }
  }, [auth?.isLoggedIn, auth?.user]);

  // Auto-scroll when messages change
  useLayoutEffect(() => {
    scrollToBottom();
  }, [chatMessages, streamingMessage, isTyping]);
  
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100vh",
        mt: 0,
      }}
    >
        {/* Chat History Sidebar */}
        <Box
          sx={{
            display: { md: "flex", xs: "none", sm: "none" },
            flex: 0.25,
            flexDirection: "column",
            bgcolor: isDarkMode ? "rgb(17,29,39)" : "rgb(240,240,240)",
            borderRight: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
            transition: "background-color 0.3s ease, border-color 0.3s ease",
          }}
        >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? "#333" : "#ddd"}` }}>
          <Button
            onClick={handleNewConversation}
            startIcon={<IoMdAdd />}
            sx={{
              width: "100%",
              bgcolor: isDarkMode ? "#00fffc" : "#1976d2",
              color: isDarkMode ? "black" : "white",
              fontWeight: "700",
              borderRadius: 2,
              mb: 2,
              "&:hover": {
                bgcolor: isDarkMode ? "white" : "#1565c0",
              },
            }}
          >
            New Chat
          </Button>
          <SearchBar onSearch={handleSearch} />
        </Box>

        {/* Conversations List */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <List>
            {(filteredConversations.length > 0 ? filteredConversations : conversations).map((conversation) => (
              <ListItem key={conversation.id} disablePadding>
                <ListItemButton
                  onClick={() => handleSelectConversation(conversation)}
                  selected={currentConversationId === conversation.id}
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: isDarkMode ? "rgba(0, 255, 252, 0.1)" : "rgba(25, 118, 210, 0.1)",
                    },
                    "&:hover": {
                      bgcolor: isDarkMode ? "rgba(0, 255, 252, 0.05)" : "rgba(25, 118, 210, 0.05)",
                    },
                  }}
                >
                  <ListItemText
                    primary={conversation.name}
                    secondary={new Date(conversation.createdAt).toLocaleDateString()}
                    sx={{
                      "& .MuiListItemText-primary": {
                        color: isDarkMode ? "white" : "black",
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiListItemText-secondary": {
                        color: isDarkMode ? "gray" : "#666",
                        fontSize: "12px",
                      },
                    }}
                  />
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuClick(e, conversation);
                    }}
                    size="small"
                    sx={{ color: "gray", ml: 1 }}
                  >
                    <IoMdMore />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: `1px solid ${isDarkMode ? "#333" : "#ddd"}` }}>
          <Button
            onClick={handleDeleteChats}
            startIcon={<IoMdTrash />}
            sx={{
              width: "100%",
              color: "white",
              fontWeight: "700",
              borderRadius: 2,
              bgcolor: red[300],
              "&:hover": {
                bgcolor: red.A400,
              },
            }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

        {/* Main Chat Area */}
      <Box
        sx={{
          display: "flex",
            flex: { md: 0.75, xs: 1, sm: 1 },
          flexDirection: "column",
            height: "100vh",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
              bgcolor: isDarkMode ? "rgb(17,29,39)" : "rgb(240,240,240)",
              transition: "background-color 0.3s ease, border-color 0.3s ease",
        }}
      >
        <Typography
          sx={{
                fontSize: "24px",
                color: isDarkMode ? "white" : "black",
            fontWeight: "600",
          }}
        >
              Chit Chat AI
        </Typography>
          </Box>

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {chatMessages && chatMessages.length > 0 ? (
            <>
              {chatMessages.map((chat, index) => {
                if (!chat || !chat.content || !chat.role) {
                  console.warn("Invalid chat message:", chat);
                  return null;
                }
                return (
                  <ChatItem 
                    content={chat.content} 
                    role={chat.role} 
                    key={index} 
                  />
                );
              })}
              {isTyping && <TypingIndicator />}
              {streamingMessage && (
                <StreamingMessage 
                  content={streamingMessage}
                  isStreaming={true}
                  onStreamingComplete={() => {
                    // Add the completed message to chat history
                    const newMessage: Message = { role: "assistant", content: streamingMessage };
                    setChatMessages(prev => [...prev, newMessage]);
                    setStreamingMessage("");
                    setIsTyping(false);
                    setCurrentRequestId(null);
                  }}
                />
              )}
              {/* Scroll target */}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "gray",
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Welcome to Chit Chat
              </Typography>
                <Typography variant="body1" sx={{ textAlign: "center" }}>
                  Start a new conversation or select one from the sidebar
                </Typography>
              </Box>
            )}
            {/* Scroll target for empty state */}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
              bgcolor: isDarkMode ? "rgb(17,29,39)" : "rgb(240,240,240)",
              transition: "background-color 0.3s ease, border-color 0.3s ease",
            }}
          >
            <Box
              sx={{
            display: "flex",
                borderRadius: 2,
                backgroundColor: isDarkMode ? "rgb(17,27,39)" : "white",
                border: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
                transition: "background-color 0.3s ease, border-color 0.3s ease",
          }}
        >
          <input
            ref={inputRef}
            type="text"
                placeholder="Type your message here..."
            style={{
              width: "100%",
              backgroundColor: "transparent",
                  padding: "15px 20px",
              border: "none",
              outline: "none",
                  color: isDarkMode ? "white" : "black",
                  fontSize: "16px",
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
              />
              <IconButton 
                onClick={handleSubmit} 
                sx={{ 
                  color: isDarkMode ? "#00fffc" : "#1976d2", 
                  mx: 1,
                  "&:hover": {
                    bgcolor: isDarkMode ? "rgba(0, 255, 252, 0.1)" : "rgba(25, 118, 210, 0.1)",
                  }
                }}
              >
            <IoMdSend />
          </IconButton>
            </Box>
          </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? "rgb(17,29,39)" : "white",
            border: `1px solid ${isDarkMode ? "#333" : "#ddd"}`,
            "& .MuiMenuItem-root": {
              color: isDarkMode ? "white" : "black",
              "&:hover": {
                bgcolor: isDarkMode ? "rgba(0, 255, 252, 0.1)" : "rgba(25, 118, 210, 0.1)",
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleExportFromMenu}>
          <IoMdDownload style={{ marginRight: 8 }} />
          Export Chat
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: "red" }}>
          <IoMdTrash style={{ marginRight: 8 }} />
          Delete Chat
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Chat;
