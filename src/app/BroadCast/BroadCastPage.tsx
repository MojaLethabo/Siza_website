"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./broadcast.module.css";
import { useAuth } from "@/context/AuthContext";
import { format as formatDate } from "date-fns-tz";

interface Message {
  MessageID: number;
  SenderID: number;
  SenderName: string;
  Content: string;
  SentAt: string;
  isCurrentUser: boolean;
}

export default function BroadcastPage() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelId = 1; // Melville Emergency Channel

  // Fetch messages from server
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${BASE}/api/channels/${channelId}/messages`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Sort by SentAt in ascending order (oldest first)
      const sorted = data.messages.sort(
        (a: any, b: any) =>
          new Date(a.SentAt).getTime() - new Date(b.SentAt).getTime()
      );

      const formattedMessages = sorted.map((msg: any) => ({
        ...msg,
        SentAt: formatDate(new Date(msg.SentAt), "MMM d, h:mm a"),
        isCurrentUser: msg.SenderID === user?.UserID,
      }));

      setMessages(formattedMessages);
      setLoading(false);
    } catch (err) {
      setError("Failed to load messages. Please try again.");
      setLoading(false);
      console.error("Message fetch error:", err);
    }
  };

  // Load initial messages and set up polling
  useEffect(() => {
    fetchMessages();

    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    // Generate a temporary ID out here
    const tempId = Date.now();
    const tempMessage: Message = {
      MessageID: tempId,
      SenderID: user.UserID,
      SenderName: user.FullName,
      Content: newMessage,
      SentAt: new Date().toISOString(),
      isCurrentUser: true,
    };

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const response = await fetch(
        `${BASE}/api/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: user.UserID,
            content: newMessage,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to send message");

      const newMessageData = await response.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.MessageID === tempId
            ? { ...newMessageData, isCurrentUser: true }
            : msg
        )
      );
    } catch (err) {
      console.error("Message send error:", err);
      // Now tempId is in scope here, so you can revert safely:
      setMessages((prev) => prev.filter((m) => m.MessageID !== tempId));
      setError("Failed to send message. Please try again.");
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading messages...</span>
        </div>
        <p className="mt-2">Loading broadcast channel...</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className={styles.broadcastCard}>
        <div className={styles.channelHeader}>
          <h5>Channel: Melville Emergency Channel</h5>
          <i
            className={`fas fa-info-circle text-white ${styles.infoIcon}`}
            title="Channel Info"
          ></i>
        </div>

        {error && (
          <div className="alert alert-danger mb-3">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        <div className={styles.messageList}>
          {messages.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="fas fa-comments fa-2x mb-2"></i>
              <p>No messages yet. Be the first to broadcast!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.MessageID}
                className={`${styles.messageItem} ${
                  msg.isCurrentUser ? styles.outgoing : styles.incoming
                }`}
              >
                <div className={styles.messageBubble}>
                  {!msg.isCurrentUser && (
                    <div className="fw-bold small mb-1">{msg.SenderName}</div>
                  )}
                  <p className="mb-1">{msg.Content}</p>
                  <small className="text-muted">
                    {formatDate(new Date(msg.SentAt), "MMM d, h:mm a")}
                  </small>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isAuthenticated}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isAuthenticated}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>

        {!user && (
          <div className="alert alert-warning mt-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            You must be logged in to send messages
          </div>
        )}
      </div>
    </div>
  );
}
