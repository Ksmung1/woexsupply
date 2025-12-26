import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
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
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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
      (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Please log in to view your messages
          </p>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((msg) => !msg.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600 mt-1">
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
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <FaSpinner className="animate-spin text-purple-600 text-2xl mx-auto mb-2" />
                <p className="text-gray-600">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <FaEnvelope className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-600">No messages yet</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !message.read ? "bg-purple-50" : ""
                  }`}
                  onClick={() => !message.read && markAsRead(message.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {message.read ? (
                        <FaEnvelopeOpen className="text-gray-400 text-xl" />
                      ) : (
                        <FaEnvelope className="text-purple-600 text-xl" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className={`text-lg font-semibold ${
                            !message.read ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {message.subject || "No Subject"}
                        </h3>
                        {!message.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
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
