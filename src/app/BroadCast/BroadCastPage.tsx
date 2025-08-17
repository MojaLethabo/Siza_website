"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./broadcast.module.css";
import { useAuth } from "@/context/AuthContext";
import { format as formatDate } from "date-fns-tz";
import { useNotification } from "@/context/NotificationContext";
import { hasCommunityLeaderAccess } from "@/utils/roleCheck";
import { usePathname } from "next/navigation";

interface RawMessage {
  MessageID: number;
  SenderID: number;
  SenderName: string;
  Content: string;
  SentAt: string;
  images64: string[];
}

interface Message extends RawMessage {
  isCurrentUser: boolean;
  displayTime: string;
  dateGroup: string;
}

export default function BroadcastPage() {
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [images64, setImages64] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingActiveMessages, setViewingActiveMessages] = useState(true);
  const [isCommunityLeader, setIsCommunityLeader] = useState(false);
  const channelId = 1;
  const pathname = usePathname(); // Use this hook instead
  const isBroadCastPage = pathname === "/BroadCast";

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMessageImages, setCurrentMessageImages] = useState<string[]>(
    []
  );
  const lastMessageIdRef = useRef(0);

  const markAllBroadcastAsRead = useCallback(async () => {
    try {
      if (!user?.UserID) return;

      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/Leader/notifications/allread/${user.UserID}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as read");
      }

      const result = await response.json();
      console.log(result.message);

      // Optional: Refetch notifications or update state
      console.log("All broadcast notifications marked as read");
    } catch (err: unknown) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    try {
      //setLoading(true);
      const endpoint = viewingActiveMessages
        ? `https://myappapi-yo3p.onrender.com/api/channels/${channelId}/messages`
        : `https://myappapi-yo3p.onrender.com/api/channels/${channelId}/messages/disabled`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Sort messages chronologically
      const sorted = data.messages.sort(
        (a: RawMessage, b: RawMessage) =>
          new Date(a.SentAt).getTime() - new Date(b.SentAt).getTime()
      );

      // Format messages with date grouping
      const formattedMessages: Message[] = sorted.map((msg: RawMessage) => {
        const sentAtDate = new Date(msg.SentAt);
        const now = new Date();

        let dateGroup = "";
        if (sentAtDate.toDateString() === now.toDateString()) {
          dateGroup = "today";
        } else if (
          sentAtDate.toDateString() ===
          new Date(now.setDate(now.getDate() - 1)).toDateString()
        ) {
          dateGroup = "yesterday";
        } else {
          dateGroup = formatDate(sentAtDate, "MMMM d, yyyy");
        }

        return {
          ...msg,
          isCurrentUser: msg.SenderID === user?.UserID,
          displayTime: formatDate(sentAtDate, "h:mm a"),
          dateGroup,
        };
      });

      // Update last message ID reference
      if (formattedMessages.length > 0) {
        const maxId = Math.max(...formattedMessages.map((m) => m.MessageID));
        if (maxId > lastMessageIdRef.current) {
          lastMessageIdRef.current = maxId;
        }
      }

      // After successfully loading messages
      if (channelId === 1) {
        // Add your broadcast channel ID check
        await markAllBroadcastAsRead();
      }

      setMessages(formattedMessages);
      setLoading(false);
    } catch (err: unknown) {
      setError("Failed to load messages. Please try again.");
      setLoading(false);
      console.error("Message fetch error:", err);
    }
  }, [channelId, user, viewingActiveMessages, markAllBroadcastAsRead]);

  // Check user role on load
  useEffect(() => {
    if (isBroadCastPage && user) {
      setIsCommunityLeader(hasCommunityLeaderAccess(user.Role));
    }
  }, [user, isBroadCastPage]);

  useEffect(() => {
    if (!isBroadCastPage) return; // Exit if not on chat page

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [fetchMessages, isBroadCastPage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isBroadCastPage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isBroadCastPage]);

  // Toggle between active/disabled views
  const toggleMessageView = () => {
    setViewingActiveMessages(!viewingActiveMessages);
    lastMessageIdRef.current = 0; // Reset last message ID when switching views
  };

  // Disable a message
  const disableMessage = async (messageId: number) => {
    try {
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/messages/${messageId}/disable`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        showNotification({
          title: "Message Disabled",
          content: "Message has been hidden from broadcast",
          type: "success",
          createdAt: new Date(),
          link: `/BroadCast`,
        });
        fetchMessages(); // Refresh message list
      } else {
        throw new Error(await response.text());
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

  // Restore a message
  const restoreMessage = async (messageId: number) => {
    try {
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/messages/${messageId}/restore`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        showNotification({
          title: "Message Restored",
          content: "Message is now visible in broadcast",
          type: "success",
          createdAt: new Date(),
          link: `/BroadCast`,
        });
        fetchMessages(); // Refresh message list
      } else {
        throw new Error(await response.text());
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

  // Send new message
  const sendMessage = async () => {
    if ((!newMessage.trim() && images64.length === 0) || !user) return;

    const tempId = Date.now();
    const tempMessage: Message = {
      MessageID: tempId,
      SenderID: user.UserID,
      SenderName: user.FullName,
      Content: newMessage,
      SentAt: new Date().toISOString(),
      isCurrentUser: true,
      images64: [...images64],
      displayTime: "",
      dateGroup: "",
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setImages64([]);

    try {
      const response = await fetch(
        `https://myappapi-yo3p.onrender.com/api/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: user.UserID,
            content: newMessage,
            images64: images64,
          }),
        }
      );

      if (!response.ok) throw new Error(await response.text());

      const newMessageData = await response.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.MessageID === tempId
            ? {
                ...newMessageData,
                isCurrentUser: true,
                displayTime: formatDate(
                  new Date(newMessageData.SentAt),
                  "h:mm a"
                ),
                dateGroup: "today",
              }
            : msg
        )
      );
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.MessageID !== tempId));
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage || "Failed to send message");
    }
  };

  // Date separator component
  const DateSeparator = ({ label }: { label: string }) => (
    <div className="d-flex align-items-center my-3">
      <hr className="flex-grow-1 border-secondary" />
      <span className="px-2 text-muted small">{label}</span>
      <hr className="flex-grow-1 border-secondary" />
    </div>
  );

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Process image sources
  const getImageSrc = (img: string) => {
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("base64,")) {
      const base64Data = img.split("base64,")[1];
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const newImages: string[] = [];

    files.forEach((file) => {
      if (!file.type.match("image.*")) {
        alert("Only image files are allowed");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large (max 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const result = event.target.result as string;
          if (result.startsWith("data:image")) {
            newImages.push(result);
            if (newImages.length === files.length) {
              setImages64((prev) => [...prev, ...newImages]);
            }
          }
        }
      };
      reader.onerror = () => alert("Error reading image file");
      reader.readAsDataURL(file);
    });
  };

  // Remove image from preview
  const removeImage = (index: number) => {
    setImages64((prev) => prev.filter((_, i) => i !== index));
  };

  // Image component with fallback
  const ImageWithFallback = ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
      return (
        <div className={`${className} ${styles.imageFallback}`}>
          <i className="fas fa-file-image"></i>
          <span>Image unavailable</span>
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  };

  // Render image previews
  const renderImagePreviews = () => (
    <div className={styles.imagePreviews}>
      {images64.map((img, index) => (
        <div key={index} className={styles.imagePreviewItem}>
          <ImageWithFallback
            src={getImageSrc(img)}
            alt={`Attachment ${index + 1}`}
            className={styles.messageImage}
          />
          <button
            type="button"
            className={styles.removeImageButton}
            onClick={() => removeImage(index)}
            aria-label="Remove image"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );

  // Image viewer functions
  const openImageViewer = (
    imageSrc: string,
    images: string[],
    index: number
  ) => {
    setCurrentImage(imageSrc);
    setCurrentImageIndex(index);
    setCurrentMessageImages(images);
    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => setIsImageViewerOpen(false);

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = currentImage;
    link.download = `attachment_${currentImageIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navigateImage = (direction: number) => {
    const newIndex =
      (currentImageIndex + direction + currentMessageImages.length) %
      currentMessageImages.length;
    setCurrentImageIndex(newIndex);
    setCurrentImage(currentMessageImages[newIndex]);
  };

  if (loading) {
    return (
      <div className="page-inner">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{
            minHeight: "400px",
            background: "linear-gradient(135deg, #ff0000 0%, #764ba2 100%)",
            borderRadius: "12px",
            color: "white",
          }}
        >
          <div className="text-center">
            <div
              className="spinner-border mb-3"
              role="status"
              style={{
                width: "3rem",
                height: "3rem",
                borderColor: "rgba(255,255,255,0.3)",
                borderTopColor: "white",
              }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-light">Loading community members...</h5>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-inner">
      <div className={styles.broadcastCard}>
        <div className={styles.channelHeader}>
          <div className={styles.headerLeft}>
            <h5>Channel: Melville Emergency Channel</h5>
            {isCommunityLeader && (
              <button onClick={toggleMessageView} className={styles.viewToggle}>
                {viewingActiveMessages
                  ? "View Disabled Messages"
                  : "View Active Messages"}
              </button>
            )}
          </div>
          <i className={`fas fa-info-circle text-white ${styles.infoIcon}`}></i>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles.alertDanger}`}>
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {/* View Mode Indicator */}
        {!viewingActiveMessages && (
          <div className={styles.disabledViewHeader}>
            <i className="fas fa-eye-slash me-2"></i>
            Viewing Disabled Messages - Sending is disabled
          </div>
        )}

        <div className={styles.messageList}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-comments fa-2x mb-2"></i>
              <p>No messages yet. Be the first to broadcast!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const showSeparator =
                index === 0 || msg.dateGroup !== messages[index - 1].dateGroup;

              return (
                <React.Fragment key={msg.MessageID}>
                  {showSeparator && (
                    <DateSeparator
                      label={
                        msg.dateGroup === "today"
                          ? "Today"
                          : msg.dateGroup === "yesterday"
                          ? "Yesterday"
                          : msg.dateGroup
                      }
                    />
                  )}
                  <div
                    className={`${styles.messageItem} ${
                      msg.isCurrentUser ? styles.outgoing : styles.incoming
                    }`}
                  >
                    <div className={styles.messageBubble}>
                      {!msg.isCurrentUser && (
                        <div className={styles.senderName}>
                          {msg.SenderName}
                        </div>
                      )}
                      <p className="mb-1">{msg.Content}</p>

                      {/* Render images */}
                      {msg.images64.map((img, imgIndex) => {
                        const src = getImageSrc(img);
                        return (
                          <img
                            key={imgIndex}
                            src={src}
                            alt={`Attachment ${imgIndex + 1}`}
                            className={styles.messageImage}
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageViewer(src, msg.images64, imgIndex);
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        );
                      })}

                      <div className={styles.messageFooter}>
                        <small className={styles.messageTime}>
                          {msg.displayTime}
                        </small>

                        {/* Message actions */}
                        {isCommunityLeader && (
                          <div className={styles.messageActions}>
                            {viewingActiveMessages ? (
                              <button
                                className={styles.disableButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  disableMessage(msg.MessageID);
                                }}
                              >
                                <i className="fas fa-eye-slash"></i> Disable
                              </button>
                            ) : (
                              <button
                                className={styles.restoreButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreMessage(msg.MessageID);
                                }}
                              >
                                <i className="fas fa-eye"></i> Restore
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image previews */}
        {images64.length > 0 && renderImagePreviews()}

        {/* Input area (disabled when viewing disabled messages) */}
        <div
          className={styles.messageInputContainer}
          style={{
            opacity: viewingActiveMessages ? 1 : 0.6,
            pointerEvents: viewingActiveMessages ? "all" : "none",
          }}
        >
          <button
            type="button"
            className={styles.attachButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={!isAuthenticated}
            aria-label="Attach image"
          >
            <i className="fas fa-paperclip"></i>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          <input
            type="text"
            className={styles.messageInput}
            placeholder="Type your emergency message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!isAuthenticated}
          />

          <button
            className={styles.sendButton}
            onClick={sendMessage}
            disabled={
              (!newMessage.trim() && images64.length === 0) || !isAuthenticated
            }
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>

        {!user && (
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            You must be logged in to send messages
          </div>
        )}

        {/* Image Viewer Modal */}
        {isImageViewerOpen && (
          <div className={styles.modalOverlay} onClick={closeImageViewer}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h5>
                  Attachment {currentImageIndex + 1} of{" "}
                  {currentMessageImages.length}
                </h5>
                <button
                  className={styles.closeButton}
                  onClick={closeImageViewer}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.imageContainer}>
                <button
                  className={styles.navButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(-1);
                  }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                <img
                  src={currentImage}
                  alt={`Attachment ${currentImageIndex + 1}`}
                  className={styles.modalImage}
                />

                <button
                  className={styles.navButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage(1);
                  }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.downloadButton}
                  onClick={downloadImage}
                >
                  <i className="fas fa-download"></i> Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
