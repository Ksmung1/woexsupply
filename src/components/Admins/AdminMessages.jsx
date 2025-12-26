import React, { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { useAlert } from "../../context/AlertContext";
import {
  FaEnvelope,
  FaSpinner,
  FaUsers,
  FaUser,
  FaUserTag,
} from "react-icons/fa";

const AdminMessages = () => {
  const { showSuccess, showError } = useAlert();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState("all"); // "all", "role", "individual"
  const [selectedRole, setSelectedRole] = useState("customer"); // "customer", "reseller"
  const [selectedUserId, setSelectedUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (messageType === "individual") {
      fetchUsers();
    }
  }, [messageType]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      showError("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const sendMessage = async () => {
    if (!subject.trim() || !content.trim()) {
      showError("Please fill in both subject and content");
      return;
    }

    setSending(true);
    try {
      const messagesRef = collection(db, "messages");
      let recipientIds = [];

      if (messageType === "all") {
        // Get all user IDs
        const usersSnapshot = await getDocs(collection(db, "users"));
        recipientIds = usersSnapshot.docs.map((doc) => doc.id);
      } else if (messageType === "role") {
        // Get user IDs by role
        const usersSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "==", selectedRole))
        );
        recipientIds = usersSnapshot.docs.map((doc) => doc.id);
      } else if (messageType === "individual") {
        if (!selectedUserId) {
          showError("Please select a user");
          setSending(false);
          return;
        }
        recipientIds = [selectedUserId];
      }

      if (recipientIds.length === 0) {
        showError("No recipients found");
        setSending(false);
        return;
      }

      // Create message for each recipient
      const messagePromises = recipientIds.map((recipientId) =>
        addDoc(messagesRef, {
          recipientId,
          subject: subject.trim(),
          content: content.trim(),
          read: false,
          createdAt: Timestamp.now(),
          senderName: "Admin",
          senderId: "admin",
        })
      );

      await Promise.all(messagePromises);
      showSuccess(
        `Message sent to ${recipientIds.length} recipient${
          recipientIds.length > 1 ? "s" : ""
        }`
      );

      // Reset form
      setSubject("");
      setContent("");
      setSelectedUserId("");
    } catch (error) {
      console.error("Error sending message:", error);
      showError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Send Message
          </h1>

          {/* Message Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setMessageType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  messageType === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaUsers size={14} />
                All Users
              </button>
              <button
                onClick={() => setMessageType("role")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  messageType === "role"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaUserTag size={14} />
                By Role
              </button>
              <button
                onClick={() => setMessageType("individual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  messageType === "individual"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaUser size={14} />
                Individual
              </button>
            </div>
          </div>

          {/* Role Selection */}
          {messageType === "role" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="customer">Customer</option>
                <option value="reseller">Reseller</option>
              </select>
            </div>
          )}

          {/* User Selection */}
          {messageType === "individual" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              {loadingUsers ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <FaSpinner className="animate-spin" />
                  <span>Loading users...</span>
                </div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email || user.id} (
                      {user.role || "customer"})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={sending}
            className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FaEnvelope />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
