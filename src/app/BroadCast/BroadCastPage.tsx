"use client";

import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from "react";
import styles from "./broadcast.module.css";
import { useAuth } from "@/context/AuthContext";
import { format as formatDate } from "date-fns-tz";
import { useNotification } from "@/context/NotificationContext";
import { hasCommunityLeaderAccess } from "@/utils/roleCheck";
import { usePathname } from "next/navigation";

// Types
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

// Constants
const CHANNEL_ID = 1;
const API_BASE_URL = "https://myappapi-yo3p.onrender.com/api";

// Components
const LoadingState: React.FC = () => (
  <div className="container-fluid py-5">
    <div className="text-center">
      <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-4 text-muted fs-5">Loading Broadcast...</p>
    </div>
  </div>
);

const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="d-flex align-items-center my-4">
    <hr className="flex-grow-1 border-secondary" />
    <span className="px-3 text-muted fs-6">{label}</span>
    <hr className="flex-grow-1 border-secondary" />
  </div>
);

const ImageWithFallback: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt, className, onClick }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`${className} ${styles.imageFallback}`}>
        <i className="fas fa-file-image fs-4"></i>
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
      onClick={onClick}
    />
  );
};

const ImageViewerModal: React.FC<{
  isOpen: boolean;
  currentImage: string;
  currentImageIndex: number;
  images: string[];
  onClose: () => void;
  onNavigate: (direction: number) => void;
  onDownload: () => void;
}> = ({ isOpen, currentImage, currentImageIndex, images, onClose, onNavigate, onDownload }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className="fs-4">
            Attachment {currentImageIndex + 1} of {images.length}
          </h5>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times fs-5"></i>
          </button>
        </div>

        <div className={styles.imageContainer}>
          <button
            className={styles.navButton}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(-1);
            }}
          >
            <i className="fas fa-chevron-left fs-4"></i>
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
              onNavigate(1);
            }}
          >
            <i className="fas fa-chevron-right fs-4"></i>
          </button>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.downloadButton} onClick={onDownload}>
            <i className="fas fa-download me-2"></i> Download
          </button>
        </div>
      </div>
    </div>
  );
};

interface MessageInputProps {
  newMessage: string;
  images64: string[];
  isAuthenticated: boolean;
  viewingActiveMessages: boolean;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  newMessage, 
  images64, 
  isAuthenticated, 
  viewingActiveMessages, 
  onMessageChange, 
  onSendMessage, 
  onFileSelect, 
  onRemoveImage,
  fileInputRef 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const getImageSrc = (img: string) => {
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("base64,")) {
      const base64Data = img.split("base64,")[1];
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  return (
    <>
      {/* Image previews */}
      {images64.length > 0 && (
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
                onClick={() => onRemoveImage(index)}
                aria-label="Remove image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
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
          <i className="fas fa-paperclip fs-5"></i>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={onFileSelect}
          style={{ display: "none" }}
        />

        <input
          type="text"
          className={styles.messageInput}
          placeholder="Type your emergency message..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!isAuthenticated}
        />

        <button
          className={styles.sendButton}
          onClick={onSendMessage}
          disabled={(!newMessage.trim() && images64.length === 0) || !isAuthenticated}
        >
          <i className="fas fa-paper-plane fs-5"></i>
        </button>
      </div>

      {!isAuthenticated && (
        <div className={`${styles.alert} ${styles.alertWarning} mt-3`}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          You must be logged in to send messages
        </div>
      )}
    </>
  );
};

// Main Component
export default function BroadcastPage() {
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const pathname = usePathname();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [images64, setImages64] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingActiveMessages, setViewingActiveMessages] = useState(true);
  const [isCommunityLeader, setIsCommunityLeader] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentMessageImages, setCurrentMessageImages] = useState<string[]>([]);

  // Refs - Fixed type definition
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef(0);

  const isBroadCastPage = pathname === "/BroadCast";

  // API Functions
  const markAllBroadcastAsRead = useCallback(async () => {
    try {
      if (!user?.UserID) return;

      const response = await fetch(
        `${API_BASE_URL}/Leader/notifications/allread/${user.UserID}`,
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

      console.log("All broadcast notifications marked as read");
    } catch (err: unknown) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    try {
      const endpoint = viewingActiveMessages
        ? `${API_BASE_URL}/channels/${CHANNEL_ID}/messages`
        : `${API_BASE_URL}/channels/${CHANNEL_ID}/messages/disabled`;

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

      // Mark broadcast as read
      if (CHANNEL_ID === 1) {
        await markAllBroadcastAsRead();
      }

      setMessages(formattedMessages);
      setLoading(false);
    } catch (err: unknown) {
      setError("Failed to load messages. Please try again.");
      setLoading(false);
      console.error("Message fetch error:", err);
    }
  }, [CHANNEL_ID, user, viewingActiveMessages, markAllBroadcastAsRead]);

  const disableMessage = async (messageId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/${messageId}/disable`,
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
        fetchMessages();
      } else {
        throw new Error(await response.text());
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

  const restoreMessage = async (messageId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/${messageId}/restore`,
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
        fetchMessages();
      } else {
        throw new Error(await response.text());
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

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
        `${API_BASE_URL}/channels/${CHANNEL_ID}/messages`,
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

  // File handling
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
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

  const removeImage = (index: number) => {
    setImages64((prev) => prev.filter((_, i) => i !== index));
  };

  // Image viewer functions
  const openImageViewer = (imageSrc: string, images: string[], index: number) => {
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

  // Effects
  useEffect(() => {
    if (isBroadCastPage && user) {
      setIsCommunityLeader(hasCommunityLeaderAccess(user.Role));
    }
  }, [user, isBroadCastPage]);

  useEffect(() => {
    if (!isBroadCastPage) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [fetchMessages, isBroadCastPage]);

  useEffect(() => {
    if (isBroadCastPage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isBroadCastPage]);

  // Handlers
  const toggleMessageView = () => {
    setViewingActiveMessages(!viewingActiveMessages);
    lastMessageIdRef.current = 0;
  };

  const getImageSrc = (img: string) => {
    if (img.startsWith("data:image")) return img;
    if (img.startsWith("base64,")) {
      const base64Data = img.split("base64,")[1];
      return `data:image/jpeg;base64,${base64Data}`;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="page-inner">
      <div className={styles.broadcastCard}>
        {/* Header */}
        <div className={styles.channelHeader}>
          <div className={styles.headerLeft}>
            <h5 className="fs-3">Channel: Melville Emergency Channel</h5>
            {isCommunityLeader && (
              <button onClick={toggleMessageView} className={styles.viewToggle}>
                <i className={`fas fa-eye${viewingActiveMessages ? '-slash' : ''} me-2`}></i>
                {viewingActiveMessages ? "View Disabled Messages" : "View Active Messages"}
              </button>
            )}
          </div>
          <i className={`fas fa-info-circle text-white ${styles.infoIcon} fs-5`}></i>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles.alertDanger} fs-6`}>
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

        {/* Messages List */}
        <div className={styles.messageList}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-comments fa-3x mb-3"></i>
              <p className="fs-5">No messages yet. Be the first to broadcast!</p>
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
                      <p className="mb-2 fs-6">{msg.Content}</p>

                      {/* Render images */}
                      {msg.images64.map((img, imgIndex) => {
                        const src = getImageSrc(img);
                        return (
                          <ImageWithFallback
                            key={imgIndex}
                            src={src}
                            alt={`Attachment ${imgIndex + 1}`}
                            className={styles.messageImage}
                            onClick={() => openImageViewer(src, msg.images64, imgIndex)}
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
                                <i className="fas fa-eye-slash me-1"></i> Disable
                              </button>
                            ) : (
                              <button
                                className={styles.restoreButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreMessage(msg.MessageID);
                                }}
                              >
                                <i className="fas fa-eye me-1"></i> Restore
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

        {/* Message Input */}
        <MessageInput
          newMessage={newMessage}
          images64={images64}
          isAuthenticated={isAuthenticated}
          viewingActiveMessages={viewingActiveMessages}
          onMessageChange={setNewMessage}
          onSendMessage={sendMessage}
          onFileSelect={handleFileSelect}
          onRemoveImage={removeImage}
          fileInputRef={fileInputRef}
        />

        {/* Image Viewer Modal */}
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          currentImage={currentImage}
          currentImageIndex={currentImageIndex}
          images={currentMessageImages}
          onClose={closeImageViewer}
          onNavigate={navigateImage}
          onDownload={downloadImage}
        />
      </div>
    </div>
  );
}