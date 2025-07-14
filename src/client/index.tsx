import { createRoot } from "react-dom/client";
import React, { useState, useMemo, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router";
import { nanoid } from "nanoid";

import { names, type ChatMessage, type Message } from "../shared";

function App() {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { room } = useParams();

  // Replace with your actual JWT token
  const JWT_TOKEN = "YOUR_JWT_TOKEN";

  const socket = useMemo(() => {
    return new WebSocket(`ws://localhost:2413/ws/chat?token=${JWT_TOKEN}`);
  }, [room]);

  useEffect(() => {
    socket.onopen = () => {
      // Optionally notify connection established
    };
    socket.onmessage = (evt) => {
      const message = JSON.parse(evt.data);
      if (message.type === "add") {
        setMessages((prev) => {
          const foundIndex = prev.findIndex((m) => m.id === message.id);
          if (foundIndex === -1) {
            return [
              ...prev,
              {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
              },
            ];
          } else {
            return [
              ...prev.slice(0, foundIndex),
              {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
              },
              ...prev.slice(foundIndex + 1),
            ];
          }
        });
      } else if (message.type === "update") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? {
                  id: message.id,
                  content: message.content,
                  user: message.user,
                  role: message.role,
                }
              : m,
          ),
        );
      } else if (message.type === "all") {
        setMessages(message.messages);
      }
    };
    socket.onerror = (err) => {
      // Optionally handle errors
    };
    socket.onclose = () => {
      // Optionally handle close
    };
    return () => {
      socket.close();
    };
  }, [socket]);

  return (
    <div className="chat container">
      {messages.map((message) => (
        <div key={message.id} className="row message">
          <div className="two columns user">{message.user}</div>
          <div className="ten columns">{message.content}</div>
        </div>
      ))}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          const content = e.currentTarget.elements.namedItem(
            "content",
          ) as HTMLInputElement;
          const chatMessage: ChatMessage = {
            id: nanoid(8),
            content: content.value,
            user: name,
            role: "user",
          };
          setMessages((messages) => [...messages, chatMessage]);
          socket.send(
            JSON.stringify({
              type: "add",
              ...chatMessage,
            } as Message),
          );
          content.value = "";
        }}
      >
        <input
          type="text"
          name="content"
          className="ten columns my-input-text"
          placeholder={`Hello ${name}! Type a message...`}
          autoComplete="off"
        />
        <button type="submit" className="send-message two columns">
          Send
        </button>
      </form>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
      <Route path="/:room" element={<App />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>,
);