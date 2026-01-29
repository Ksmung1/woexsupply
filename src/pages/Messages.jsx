import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { FaEnvelope, FaEnvelopeOpen, FaSpinner } from "react-icons/fa";

const Messages = () => {
  const { user, signInWithGoogle } = useUser();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasMarkedAsRead = useRef(false);
  // no redirect; show inline login CTA when not signed in

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

      const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
        setLoading(false);

        // Automatically mark all unread messages as read when messages are loaded
        const unreadMessages = messagesList.filter((msg) => !msg.read);
        if (unreadMessages.length > 0 && !hasMarkedAsRead.current) {
          hasMarkedAsRead.current = true;
          try {
            const updatePromises = unreadMessages.map((msg) => {
              const messageRef = doc(db, "messages", msg.id);
              return updateDoc(messageRef, {
                read: true,
                readAt: Timestamp.now(),
              });
            });
            await Promise.all(updatePromises);
          } catch (error) {
            console.error("Error marking messages as read on open:", error);
            hasMarkedAsRead.current = false; // Reset on error so it can retry
          }
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      hasMarkedAsRead.current = false; // Reset when component unmounts
    };
  }, [user?.uid]);

  const markAsRead = async (messageId) => {
    try {
      const messageRef = doc(db, "messages", messageId);
      await updateDoc(messageRef, {
        read: true,
        readAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadMessages = messages.filter((msg) => !msg.read);
      const updatePromises = unreadMessages.map((msg) => {
        const messageRef = doc(db, "messages", msg.id);
        return updateDoc(messageRef, {
          read: true,
          readAt: Timestamp.now(),
        });
      });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen-dvh flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <p className={isDark ? "text-gray-400 mb-4" : "text-gray-600 mb-4"}>
            Sign in to view your messages
          </p>
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((msg) => !msg.read).length;

  return (
    <div className={`min-h-screen-dvh p-4 md:p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-xl shadow-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          {/* Header */}
          <div className={`p-4 md:p-6 border-b flex items-center justify-between ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Messages</h1>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                  : "No unread messages"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Messages List */}
          <div className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
            {loading ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-purple-600 text-2xl mx-auto mb-2" />
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <FaEnvelope className={`text-4xl mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>No messages yet</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 md:p-6 transition-colors cursor-pointer ${
                    !message.read 
                      ? isDark ? "bg-purple-900/30 hover:bg-purple-900/40" : "bg-purple-50 hover:bg-purple-100"
                      : isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                  onClick={() => !message.read && markAsRead(message.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {message.read ? (
                        <FaEnvelopeOpen className={`text-xl ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                      ) : (
                        <FaEnvelope className="text-purple-600 text-xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className={`text-lg font-semibold ${
                            !message.read 
                              ? isDark ? "text-white" : "text-gray-900"
                              : isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {message.subject || "No Subject"}
                        </h3>
                        {!message.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                        )}
                      </div>
                      <p className={`text-sm mb-2 whitespace-pre-wrap ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {message.content}
                      </p>
                      <div className={`flex items-center gap-4 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                        <span>
                          {message.createdAt?.toDate
                            ? format(message.createdAt.toDate(), "PPp")
                            : "Unknown date"}
                        </span>
                        {message.senderName && (
                          <span>From: {message.senderName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
